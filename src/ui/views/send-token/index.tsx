import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content } from '@repo/ui';
import { Button, ButtonType } from '@repo/ui/primitives';
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useWallet } from '@/ui/utils';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { findChain, findChainByEnum, findChainByID } from '@/utils/chain';
import BigNumber from 'bignumber.js';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { GasLevel, Tx } from '@/background/service/openapi';
import {
  CHAINS_ENUM,
  KEYRING_CLASS,
  MINIMUM_GAS_LIMIT,
  CAN_ESTIMATE_L1_FEE_CHAINS,
  CAN_NOT_SPECIFY_INTRINSIC_GAS_CHAINS,
} from '@/constant';
import { useRequest, useMemoizedFn } from 'ahooks';
import { isValidAddress, intToHex, zeroAddress } from '@ethereumjs/util';
import { message, Form, Modal } from 'antd';
import abiCoderInst, { AbiCoder } from 'web3-eth-abi';
import { SendTxHistoryItem } from '@/background/service/transactionHistory';
import { getKRCategoryByType } from '@/utils/transaction';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { useAsyncFn } from 'react-use';

const abiCoder = (abiCoderInst as unknown) as AbiCoder;
const isTab = false;
const isDesktop = false;
const filterRbiSource = (source: string, rbisource: string) => rbisource;

import TokenSelection from './token-selection';
import RecipientAddress from './recipient-address';
import AmountEntry from './amount-entry';
import {
  SendReserveGasPopup,
  GasLevelType,
} from '@/ui/views/Swap/Component/ReserveGasPopup';

type SendFormData = {
  token: TokenItem | null;
  recipient: string;
  amount: string;
};

const DEFAULT_GAS_USED = 21000;
const CAN_ESTIMATE_L1_FEE_CHAINS_LOCAL = [
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ZORA,
];
const CAN_NOT_SPECIFY_INTRINSIC_GAS_CHAINS_LOCAL = [
  CHAINS_ENUM.OP,
  CHAINS_ENUM.BASE,
  CHAINS_ENUM.ZORA,
  CHAINS_ENUM.LINEA,
  CHAINS_ENUM.MANTA,
  CHAINS_ENUM.SSCROLL,
];

const supportedDirectSign = (type: string): boolean => {
  const supportedTypes: string[] = [
    KEYRING_CLASS.PRIVATE_KEY,
    KEYRING_CLASS.MNEMONIC,
  ];
  return supportedTypes.includes(type);
};

const MINI_SIGN_ERROR = {
  USER_CANCELLED: 'USER_CANCELLED',
  CANT_PROCESS: 'CANT_PROCESS',
  PREFETCH_FAILURE: 'PREFETCH_FAILURE',
};

const SendToken = () => {
  const history = useHistory();
  const location = useLocation();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  const [form] = Form.useForm();

  const [step, setStep] = useState<'recipient' | 'token' | 'amount'>(
    'recipient'
  );
  const [formData, setFormData] = useState<SendFormData>({
    token: null,
    recipient: '',
    amount: '',
  });

  const [chain, setChain] = useState(CHAINS_ENUM.ETH);
  const chainItem = useMemo(() => findChain({ enum: chain }), [chain]);

  // Mock mini signer hooks since they're not available
  const openDirect = async (params: any) => {
    return [] as string[];
  };
  const prefetch = async (params: any) => {
    // No-op
  };

  const [gasFee, setGasFee] = useState<string>('0');
  const [gasLoading, setGasLoading] = useState(false);
  const [tokenList, setTokenList] = useState<TokenItem[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [miniSignLoading, setMiniSignLoading] = useState(false);
  const [chainTokenGasFees, setChainTokenGasFees] = useState<{
    gasLimit: number;
    maybeL1Fee: BigNumber | null;
  }>({
    gasLimit: MINIMUM_GAS_LIMIT,
    maybeL1Fee: null,
  });
  const [selectedGasLevel, setSelectedGasLevel] = useState<GasLevel | null>(
    null
  );
  const [selectedGasLevelType, setSelectedGasLevelType] = useState<
    GasLevelType | undefined
  >(undefined);
  const [clickedMax, setClickedMax] = useState(false);
  const [refreshId, setRefreshId] = useState(0);
  const [reserveGasOpen, setReserveGasOpen] = useState(false);

  const isGnosisSafe = useMemo(() => {
    return currentAccount?.type === KEYRING_CLASS.GNOSIS;
  }, [currentAccount?.type]);

  const isNativeToken = useMemo(
    () => !!chainItem && formData.token?.id === chainItem.nativeTokenAddress,
    [chainItem, formData.token?.id]
  );

  const rbisource = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('rbisource') || '';
  }, [location.search]);

  // Fetch tokens
  useEffect(() => {
    const fetchTokens = async () => {
      if (!currentAccount) return;
      try {
        setTokensLoading(true);
        const chainItem = findChain({ enum: 'eth' });
        if (!chainItem?.serverId) return;
        const tokens = await wallet.openapi.listToken(
          currentAccount.address,
          chainItem.serverId
        );
        setTokenList(tokens || []);
      } catch (e) {
        console.error('Failed to fetch tokens:', e);
        // Fallback for testnet - set empty list or mock tokens
        setTokenList([]);
      } finally {
        setTokensLoading(false);
      }
    };

    fetchTokens();
  }, [currentAccount, wallet]);

  // Get transaction parameters
  const getParams = useCallback(
    ({ amount }: { amount: string }) => {
      if (!formData.token || !formData.recipient) {
        console.warn('[DEBUG] getParams called without token or recipient');
        return {};
      }
      console.log('[DEBUG] getParams called with amount:', amount);
      console.log('[DEBUG] Token in getParams:');
      console.log('  id:', formData.token.id);
      console.log('  symbol:', formData.token.symbol);
      console.log('  name:', formData.token.name);

      const chain = findChain({
        serverId: formData.token.chain,
      })!;

      const sendValue = new BigNumber(amount || 0)
        .multipliedBy(10 ** formData.token.decimals)
        .decimalPlaces(0, BigNumber.ROUND_DOWN);

      console.log(
        '[DEBUG] sendValue:',
        sendValue.toFixed(0),
        '(amount:',
        amount,
        'decimals:',
        formData.token.decimals,
        ')'
      );

      // Use token.id if it's a valid address, otherwise skip building params
      const tokenId = formData.token.id;
      if (!isNativeToken && !isValidAddress(tokenId)) {
        console.error('[DEBUG] Invalid token address:');
        console.error('  tokenId:', tokenId);
        console.error('  symbol:', formData.token?.symbol);
        console.error('  name:', formData.token?.name);
        console.error('  type:', typeof tokenId);
        console.error('  full token:', JSON.stringify(formData.token, null, 2));
        return {};
      }
      if (isNativeToken && !isValidAddress(formData.recipient)) {
        console.error(
          '[DEBUG] Invalid recipient address for native token:',
          formData.recipient
        );
        return {};
      }

      const dataInput = [
        {
          name: 'transfer',
          type: 'function',
          inputs: [
            {
              type: 'address',
              name: 'to',
            },
            {
              type: 'uint256',
              name: 'value',
            },
          ] as any[],
        } as const,
        [
          formData.recipient || '0x0000000000000000000000000000000000000000',
          sendValue.toFixed(0),
        ] as any[],
      ] as const;
      const params: Record<string, any> = {
        chainId: chain.id,
        from: currentAccount!.address,
        to: tokenId,
        value: '0x0',
        data: abiCoder.encodeFunctionCall(dataInput[0], dataInput[1]),
        isSend: true,
      };
      if (isNativeToken) {
        console.log('[DEBUG] Native token detected, adjusting params');
        params.to = formData.recipient;
        delete params.data;
        params.value = `0x${sendValue.toString(16)}`;
      }

      return params;
    },
    [currentAccount, formData.token, formData.recipient, isNativeToken]
  );

  // Fetch gas list
  const fetchGasList = useCallback(async () => {
    if (!formData.amount || !formData.token || !currentAccount?.address) {
      console.log('[DEBUG] fetchGasList - missing data:', {
        amount: !!formData.amount,
        token: !!formData.token,
        account: !!currentAccount?.address,
      });
      return [];
    }

    console.log('[DEBUG] fetchGasList called');

    // Build params locally to avoid dependency loop
    const chain = findChain({ serverId: formData.token.chain })!;
    const sendValue = new BigNumber(formData.amount || 0)
      .multipliedBy(10 ** formData.token.decimals)
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const isNative =
      chainItem && formData.token.id === chainItem.nativeTokenAddress;

    // Validate token.id is a valid address (not a symbol)
    const tokenId = formData.token.id;
    const isValidTokenAddress = isValidAddress(tokenId);

    if (!isNative && !isValidTokenAddress) {
      console.error('[DEBUG] Invalid token address:', {
        tokenId,
        symbol: formData.token?.symbol,
        name: formData.token?.name,
      });
      return [];
    }

    const params: Record<string, any> = {
      chainId: chain.id,
      from: currentAccount.address,
      to: isNative ? formData.recipient : tokenId,
      value: isNative ? `0x${sendValue.toString(16)}` : '0x0',
    };

    // Validate recipient address
    if (!isValidAddress(params.to)) {
      console.error('[DEBUG] Invalid "to" address:', params.to);
      return [];
    }

    // Add data for token transfers
    if (!isNative && formData.recipient) {
      const dataInput = [
        {
          name: 'transfer',
          type: 'function',
          inputs: [
            { type: 'address', name: 'to' },
            { type: 'uint256', name: 'value' },
          ] as any[],
        } as const,
        [
          formData.recipient || '0x0000000000000000000000000000000000000000',
          sendValue.toFixed(0),
        ] as any[],
      ] as const;
      params.data = abiCoder.encodeFunctionCall(dataInput[0], dataInput[1]);
    }

    console.log('[DEBUG] fetchGasList params:');
    console.log('  from:', params.from);
    console.log('  to:', params.to);
    console.log('  chainId:', params.chainId);
    console.log('  value:', params.value);
    console.log('  isNative:', isNative);
    console.log('  hasRecipient:', !!formData.recipient);
    console.log('  isValidTokenAddress:', isValidTokenAddress);

    const list: GasLevel[] = chainItem?.isTestnet
      ? await wallet.getCustomTestnetGasMarket({ chainId: chainItem.id })
      : params?.from
      ? await wallet.gasMarketV2({
          chain: chainItem!,
          tx: params as Tx,
        })
      : [];

    console.log('[DEBUG] fetchGasList got list:', list?.length || 0, 'items');
    if (list && list.length > 0) {
      console.log(
        '[DEBUG] Gas levels:',
        list.map((g) => `${g.level}: ${g.price}`)
      );
    }
    return list;
  }, [
    chainItem,
    formData.amount,
    formData.token,
    currentAccount?.address,
    wallet,
  ]);

  const [
    { value: gasList, loading: loadingGasList },
    loadGasList,
  ] = useAsyncFn(() => {
    return fetchGasList();
  }, [fetchGasList]);

  useEffect(() => {
    if (
      clickedMax ||
      (formData.amount && formData.token && step === 'amount')
    ) {
      loadGasList();
    }
  }, [clickedMax, formData.amount, formData.token, step, loadGasList]);

  // Auto-select normal gas level when list loads
  useEffect(() => {
    console.log('[DEBUG] Auto-select effect running:', {
      gasList: gasList?.length || 0,
      selectedGasLevel: !!selectedGasLevel,
    });
    if (gasList && gasList.length > 0 && !selectedGasLevel) {
      console.log('[DEBUG] Setting default gas level');
      const normalGas = gasList.find((g) => g.level === 'normal') || gasList[0];
      console.log(
        '[DEBUG] Selected gas:',
        normalGas?.level,
        'price:',
        normalGas?.price
      );
      setSelectedGasLevel(normalGas);
    }
  }, [gasList, selectedGasLevel]);

  // Estimate gas on chain
  const estimateGasOnChain = useCallback(
    async (tokenItem?: TokenItem) => {
      const result = { gasNumber: 0 };

      const doReturn = (nextGas = DEFAULT_GAS_USED) => {
        result.gasNumber = nextGas;
        setChainTokenGasFees((prev) => ({
          ...prev,
          gasLimit: result.gasNumber,
        }));
        return result;
      };

      const targetToken = tokenItem || formData.token;

      if (
        !chainItem?.needEstimateGas ||
        !currentAccount?.address ||
        !targetToken
      ) {
        return doReturn(DEFAULT_GAS_USED);
      }

      if (chainItem.serverId !== targetToken?.chain) {
        console.warn('estimateGasOnChain:: chain not matched!');
        return doReturn();
      }

      let _gasUsed: string = intToHex(DEFAULT_GAS_USED);
      try {
        _gasUsed = await wallet.requestETHRpc<string>(
          {
            method: 'eth_estimateGas',
            params: [
              {
                from: currentAccount.address,
                to:
                  formData.recipient && isValidAddress(formData.recipient)
                    ? formData.recipient
                    : zeroAddress(),
                gasPrice: intToHex(0),
                value: intToHex(0),
              },
            ],
          },
          chainItem.serverId
        );
      } catch (err) {
        console.error(err);
      }

      const gasUsed = new BigNumber(_gasUsed)
        .multipliedBy(1.5)
        .integerValue()
        .toNumber();

      return doReturn(Number(gasUsed));
    },
    [
      chainItem,
      formData.token,
      formData.recipient,
      currentAccount?.address,
      wallet,
    ]
  );

  // Fetch L1 fees for L2 chains
  const fetchExtraGasFees = useCallback(
    async (input: { gasPrice?: number }) => {
      const ret = {
        gasLimit: 0,
        maybeL1Fee: new BigNumber(0),
      };
      const doReturn = (
        gasLimit: number | BigNumber,
        l1Value: number | BigNumber = 0
      ) => {
        ret.maybeL1Fee = new BigNumber(l1Value);
        setChainTokenGasFees((prev) => ({
          ...prev,
          maybeL1Fee: ret.maybeL1Fee,
        }));
        return ret;
      };

      if (!currentAccount?.address) return doReturn(0, 0);
      if (!formData.token || !CAN_ESTIMATE_L1_FEE_CHAINS_LOCAL.includes(chain))
        return doReturn(0, 0);

      const {
        gasPrice = (await loadGasList().then((list) => list?.[0]))?.price || 0,
      } = input;

      const l1GasFee = await wallet.fetchEstimatedL1Fee(
        {
          txParams: {
            chainId: chainItem?.id,
            from: currentAccount?.address,
            to:
              formData.recipient && isValidAddress(formData.recipient)
                ? formData.recipient
                : zeroAddress(),
            value: formData.token.raw_amount_hex_str,
            gas: intToHex(DEFAULT_GAS_USED),
            gasPrice: `0x${new BigNumber(gasPrice).toString(16)}`,
            data: '0x',
          },
        },
        chain
      );

      return doReturn(0, new BigNumber(l1GasFee || 0));
    },
    [
      chainItem,
      currentAccount?.address,
      loadGasList,
      formData.token,
      formData.recipient,
      wallet,
      chain,
    ]
  );

  useEffect(() => {
    if (selectedGasLevel?.price) {
      fetchExtraGasFees({
        gasPrice: selectedGasLevel?.price,
      });
    }
  }, [fetchExtraGasFees, selectedGasLevel?.price]);

  const canProceedToToken = useMemo(() => !!formData.recipient, [
    formData.recipient,
  ]);
  const canProceedToAmount = useMemo(() => !!formData.token, [formData.token]);
  const canSubmit = useMemo(
    () => !!formData.token && !!formData.recipient && !!formData.amount,
    [formData.token, formData.recipient, formData.amount]
  );

  const balanceAmount = useMemo(() => {
    if (!formData.token) return new BigNumber(0);
    if (formData.token.raw_amount_hex_str) {
      return new BigNumber(formData.token.raw_amount_hex_str).div(
        10 ** formData.token.decimals
      );
    }
    return new BigNumber(formData.token.amount || 0);
  }, [formData.token]);

  const balanceNumText = useMemo(() => {
    if (!formData.token) return '';
    return `${balanceAmount.toFixed(4)} ${formData.token.symbol}`;
  }, [balanceAmount, formData.token]);

  const insufficientError = useMemo(() => {
    if (!formData.token || !formData.amount) return false;
    const amount = new BigNumber(formData.amount || 0);
    return amount.gt(balanceAmount);
  }, [formData.amount, formData.token, balanceAmount]);

  const handleRecipientChange = (address: string) => {
    setFormData((prev) => ({ ...prev, recipient: address }));
  };

  const handleRecipientNext = () => {
    if (canProceedToToken) {
      setStep('token');
    }
  };

  const handleTokenSelect = (token: TokenItem) => {
    console.log('[DEBUG] Token selected:');
    console.log('  id:', token.id);
    console.log('  symbol:', token.symbol);
    console.log('  name:', token.name);
    console.log('  chain:', token.chain);
    console.log('  decimals:', token.decimals);
    setFormData((prev) => ({ ...prev, token }));
    setStep('amount');
  };

  const handleAmountChange = (amount: string) => {
    setFormData((prev) => ({ ...prev, amount }));
    if (clickedMax) {
      setClickedMax(false);
    }
  };

  const handleGasChange = useCallback((gasLevel: GasLevel) => {
    console.log(
      '[DEBUG] Gas level changed:',
      gasLevel?.level,
      'price:',
      gasLevel?.price
    );
    setSelectedGasLevel(gasLevel);
    if (gasLevel.level && typeof gasLevel.level === 'string') {
      setSelectedGasLevelType(gasLevel.level as GasLevelType);
    }
  }, []);

  const handleGasLevelChanged = useCallback((gasLevel: GasLevel) => {
    setSelectedGasLevel(gasLevel);
    if (gasLevel.level && typeof gasLevel.level === 'string') {
      setSelectedGasLevelType(gasLevel.level as GasLevelType);
    }
    handleReserveGasClose();
  }, []);

  const handleReserveGasClose = useCallback(() => {
    setReserveGasOpen(false);
  }, []);

  // Direct sign is disabled in this flow (mocked mini signer hooks)
  const canUseDirectSubmitTx = useMemo(() => false, []);

  // Prefetch for direct sign
  useEffect(() => {
    let isCurrent = true;
    const setMiniTx = async () => {
      if (
        canUseDirectSubmitTx &&
        formData.amount &&
        formData.recipient &&
        formData.token?.chain &&
        !gasLoading
      ) {
        const chain = findChain({
          serverId: formData.token.chain,
        })!;
        const params = getParams({ amount: formData.amount });

        if (isNativeToken) {
          const couldSpecifyIntrinsicGas = !CAN_NOT_SPECIFY_INTRINSIC_GAS_CHAINS_LOCAL.includes(
            chain.enum
          );

          try {
            const code = await wallet.requestETHRpc<any>(
              {
                method: 'eth_getCode',
                params: [formData.recipient, 'latest'],
              },
              chain.serverId
            );
            const notContract = !!code && (code === '0x' || code === '0x0');

            let gasLimit = 0;

            if (chainTokenGasFees.gasLimit) {
              gasLimit = chainTokenGasFees.gasLimit;
            }

            if (gasLimit > 0) {
              params.gas = intToHex(gasLimit);
            } else if (notContract && couldSpecifyIntrinsicGas) {
              params.gas = intToHex(DEFAULT_GAS_USED);
            }
            if (!notContract) {
              delete params.gas;
            }
          } catch (e) {
            if (couldSpecifyIntrinsicGas) {
              params.gas = intToHex(DEFAULT_GAS_USED);
            }
          }
          if (clickedMax && selectedGasLevel?.price) {
            params.gasPrice = selectedGasLevel?.price;
          }
        }

        !isGnosisSafe &&
          wallet.addCacheHistoryData(
            `${chain.enum}-${params.data || '0x'}`,
            {
              address: currentAccount!.address,
              chainId: findChainByEnum(chain.enum)?.id || 0,
              from: currentAccount!.address,
              to: formData.recipient,
              token: formData.token,
              amount: Number(formData.amount),
              status: 'pending',
              createdAt: Date.now(),
            } as SendTxHistoryItem,
            'send'
          );

        if (isCurrent) {
          prefetch({
            txs: [params as Tx],
            ga: {
              category: 'Send',
              source: 'sendToken',
              trigger: filterRbiSource('sendToken', rbisource) && rbisource,
            },
          }).catch((error) => {
            if (error !== MINI_SIGN_ERROR.PREFETCH_FAILURE) {
              console.error('send token prefetch error', error);
            }
          });
        }
      } else {
        if (isCurrent) {
          prefetch({
            txs: [],
          });
        }
      }
    };
    setMiniTx();
    return () => {
      isCurrent = false;
      prefetch({
        txs: [],
      });
    };
  }, [
    refreshId,
    gasLoading,
    isGnosisSafe,
    canUseDirectSubmitTx,
    formData.token?.chain,
    formData.amount,
    formData.recipient,
    getParams,
    isNativeToken,
    clickedMax,
    selectedGasLevel?.price,
    wallet,
    chainTokenGasFees.gasLimit,
    currentAccount,
    formData.token,
    prefetch,
    rbisource,
  ]);

  const handleClickMaxButton = useCallback(async () => {
    if (!formData.token) return;
    setClickedMax(true);

    const tokenBalance = new BigNumber(
      formData.token.raw_amount_hex_str || 0
    ).div(10 ** formData.token.decimals);
    let amount = tokenBalance.toFixed();

    const couldReserveGas = isNativeToken && !isGnosisSafe;

    if (couldReserveGas) {
      setGasLoading(true);
      try {
        const gasList = await loadGasList();
        const gasLevel = gasList?.[0];

        if (gasLevel && gasLevel.price > 0) {
          const { gasNumber } = await estimateGasOnChain(formData.token);

          let gasAmount = new BigNumber(gasLevel.price)
            .times(gasNumber)
            .div(1e18);

          const { maybeL1Fee } = await fetchExtraGasFees({
            gasPrice: gasLevel.price,
          });

          if (maybeL1Fee?.gt(0)) {
            gasAmount = gasAmount
              .plus(new BigNumber(maybeL1Fee).div(1e18))
              .times(1.1);
          }

          const tokenForSend = tokenBalance.minus(gasAmount);
          amount = tokenForSend.gt(0) ? tokenForSend.toFixed() : '0';

          if (gasLevel) {
            setSelectedGasLevel(gasLevel as GasLevel);
            if (gasLevel.level && typeof gasLevel.level === 'string') {
              setSelectedGasLevelType(gasLevel.level as GasLevelType);
            }
          }
        }
      } catch (e) {
        console.error('Error calculating max amount:', e);
      } finally {
        setGasLoading(false);
      }
    }

    setFormData((prev) => ({ ...prev, amount }));
  }, [
    formData.token,
    isNativeToken,
    isGnosisSafe,
    loadGasList,
    estimateGasOnChain,
    fetchExtraGasFees,
  ]);

  const handleAmountNext = () => {
    console.log('[DEBUG] handleAmountNext called, canSubmit:', canSubmit);
    if (canSubmit) {
      console.log('[DEBUG] Calling handleSubmit');
      handleSubmit({ amount: formData.amount });
    } else {
      console.warn('[DEBUG] Cannot submit:', {
        hasToken: !!formData.token,
        hasRecipient: !!formData.recipient,
        hasAmount: !!formData.amount,
      });
    }
  };

  const handleBack = () => {
    if (step === 'recipient') {
      if (history.length) {
        history.goBack();
      }
    } else if (step === 'token') {
      setStep('recipient');
    } else if (step === 'amount') {
      setStep('token');
    }
  };

  // Handle transaction submission
  const { runAsync: handleSubmit, loading: isSubmitLoading } = useRequest(
    async ({
      amount,
      forceSignPage,
    }: {
      amount: string;
      forceSignPage?: boolean;
    }) => {
      if (!formData.token || !currentAccount?.address || !formData.recipient) {
        console.error('[DEBUG] Missing required info:', {
          token: !!formData.token,
          address: !!currentAccount?.address,
          recipient: !!formData.recipient,
        });
        message.error('Missing required information');
        return;
      }

      if (!selectedGasLevel) {
        console.error('[DEBUG] No gas level selected');
        message.error('Please select a gas level');
        return;
      }

      console.log('[DEBUG] Starting transaction submission:', {
        token: formData.token?.symbol,
        amount: formData.amount,
        recipient: formData.recipient,
        gasLevel: selectedGasLevel?.level,
      });

      const params = getParams({ amount });
      console.log('[DEBUG] Transaction params:', {
        from: params.from,
        to: params.to,
        value: params.value,
        data: params.data ? params.data.substring(0, 50) + '...' : undefined,
        gas: params.gas,
      });

      let shouldForceSignPage = !!forceSignPage;

      if (canUseDirectSubmitTx && !shouldForceSignPage) {
        setMiniSignLoading(true);
        message.loading('Authorizing transaction...', 0);
        try {
          wallet.setLastTimeSendToken(formData.token).catch((error) => {
            console.error('[MiniSign] setLastTimeSendToken error', error);
          });

          const hashes = await openDirect({
            txs: [params as Tx],
            ga: {
              category: 'Send',
              source: 'sendToken',
              trigger: filterRbiSource('sendToken', rbisource) && rbisource,
            },
          });

          message.destroy();
          const hash = hashes[hashes.length - 1];
          if (hash) {
            message.success('Transaction sent successfully!');
            setFormData((prev) => ({ ...prev, amount: '' }));
            await handleMiniSignResolve();
            // Go back to start or close
            setTimeout(() => {
              setStep('recipient');
              setFormData({ token: null, recipient: '', amount: '' });
            }, 1000);
          } else {
            setMiniSignLoading(false);
            message.error('Transaction failed');
          }

          return;
        } catch (error) {
          console.error('send token direct sign error', error);
          message.destroy();
          setMiniSignLoading(false);
          if (
            error === MINI_SIGN_ERROR.USER_CANCELLED ||
            error === MINI_SIGN_ERROR.CANT_PROCESS
          ) {
            return;
          }

          shouldForceSignPage = true;
        }
      }

      // Fall back to full sign page
      const chain = findChain({
        serverId: formData.token.chain,
      })!;

      if (isNativeToken) {
        const couldSpecifyIntrinsicGas = !CAN_NOT_SPECIFY_INTRINSIC_GAS_CHAINS_LOCAL.includes(
          chain.enum
        );

        try {
          const code = await wallet.requestETHRpc<any>(
            {
              method: 'eth_getCode',
              params: [formData.recipient, 'latest'],
            },
            chain.serverId
          );
          const notContract = !!code && (code === '0x' || code === '0x0');

          let gasLimit = 0;

          if (chainTokenGasFees.gasLimit) {
            gasLimit = chainTokenGasFees.gasLimit;
          }

          if (gasLimit > 0) {
            params.gas = intToHex(gasLimit);
          } else if (notContract && couldSpecifyIntrinsicGas) {
            params.gas = intToHex(DEFAULT_GAS_USED);
          }
          if (!notContract) {
            delete params.gas;
          }
        } catch (e) {
          if (couldSpecifyIntrinsicGas) {
            params.gas = intToHex(DEFAULT_GAS_USED);
          }
        }
      }

      // Add gas price from selected gas level
      if (selectedGasLevel?.price) {
        params.gasPrice = intToHex(selectedGasLevel.price);
        console.log('[DEBUG] Added gasPrice:', {
          original: selectedGasLevel.price,
          hex: params.gasPrice,
        });
      }

      try {
        matomoRequestEvent({
          category: 'Send',
          action: 'createTx',
          label: [
            chain.name,
            getKRCategoryByType(currentAccount?.type),
            currentAccount?.brandName,
            'token',
            filterRbiSource('sendToken', rbisource) && rbisource,
          ].join('|'),
        });

        !isGnosisSafe &&
          wallet.addCacheHistoryData(
            `${chain.enum}-${params.data || '0x'}`,
            {
              address: currentAccount!.address,
              chainId: findChainByEnum(chain.enum)?.id || 0,
              from: currentAccount!.address,
              to: formData.recipient,
              token: formData.token,
              amount: Number(amount),
              status: 'pending',
              createdAt: Date.now(),
            } as SendTxHistoryItem,
            'send'
          );

        wallet.setLastTimeSendToken(formData.token).catch((error) => {
          console.error('[FullSign] setLastTimeSendToken error', error);
        });

        console.log('[DEBUG] Calling wallet.sendRequest with params:', params);
        const promise = wallet.sendRequest({
          method: 'eth_sendTransaction',
          params: [params],
          $ctx: {
            ga: {
              category: 'Send',
              source: 'sendToken',
              trigger: filterRbiSource('sendToken', rbisource) && rbisource,
            },
          },
        });

        console.log(
          '[DEBUG] wallet.sendRequest called, isTab:',
          isTab,
          'isDesktop:',
          isDesktop
        );

        if (isTab || isDesktop) {
          console.log('[DEBUG] Awaiting promise (tab/desktop mode)');
          await promise;
          console.log('[DEBUG] Promise resolved');
          setFormData((prev) => ({ ...prev, amount: '' }));
          message.success('Transaction sent successfully!');
          setTimeout(() => {
            setStep('recipient');
            setFormData({ token: null, recipient: '', amount: '' });
          }, 1000);
        } else {
          console.log('[DEBUG] Not in tab/desktop mode, closing window');
          message.success('Transaction submitted!');
          setFormData((prev) => ({ ...prev, amount: '' }));
          // Close after a short delay to show success message
          setTimeout(() => {
            console.log('[DEBUG] Closing window');
            window.close();
          }, 1500);
        }
      } catch (e: any) {
        console.error('[DEBUG] Transaction failed with error:', e);
        message.error(e?.message || 'Transaction failed');
        console.error(e);
      }
    },
    {
      manual: true,
    }
  );

  const handleMiniSignResolve = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        try {
          setMiniSignLoading(false);
          prefetch({
            txs: [],
          });
          setFormData((prev) => ({ ...prev, amount: '' }));
          setRefreshId((e) => e + 1);
          resolve();
        } catch (err) {
          console.error(err);
          reject();
        }
      }, 500);
    });
  }, [prefetch]);

  return (
    <UIContainer>
      <Container>
        <HeaderNavPage handleBack={handleBack}>
          <div className="text-primary-foreground text-xl font-normal">
            Send
          </div>
        </HeaderNavPage>
        <Content>
          {step === 'recipient' && (
            <RecipientAddress
              value={formData.recipient}
              onChange={handleRecipientChange}
              onNext={handleRecipientNext}
              isValid={canProceedToToken}
            />
          )}
          {step === 'token' && (
            <TokenSelection
              onSelect={handleTokenSelect}
              selectedToken={formData.token}
              loading={tokensLoading}
              tokens={tokenList}
              recipientAddress={formData.recipient}
            />
          )}
          {step === 'amount' && (
            <AmountEntry
              value={formData.amount}
              onChange={handleAmountChange}
              token={formData.token}
              onTokenChange={handleTokenSelect}
              balanceNumText={balanceNumText}
              handleClickMaxButton={handleClickMaxButton}
              insufficientError={insufficientError}
              gasList={gasList}
              onGasChange={handleGasChange}
              isLoading={gasLoading}
              recipientAddress={formData.recipient}
            />
          )}
        </Content>
      </Container>
      <Action>
        <Button
          disabled={
            (step === 'recipient' && !canProceedToToken) ||
            (step === 'token' && !canProceedToAmount) ||
            (step === 'amount' &&
              (!formData.amount ||
                insufficientError ||
                !selectedGasLevel ||
                isSubmitLoading ||
                miniSignLoading ||
                loadingGasList)) ||
            (step !== 'amount' && (isSubmitLoading || miniSignLoading))
          }
          onClick={
            step === 'recipient'
              ? handleRecipientNext
              : step === 'token'
              ? () => {
                  const token = formData.token;
                  if (token) handleTokenSelect(token);
                }
              : () => {
                  console.log('[DEBUG] Send button clicked, state:', {
                    step,
                    hasAmount: !!formData.amount,
                    amount: formData.amount,
                    insufficientError,
                    hasGasLevel: !!selectedGasLevel,
                    gasLevel: selectedGasLevel?.level,
                    isSubmitting: isSubmitLoading,
                    loadingGas: loadingGasList,
                    miniSigning: miniSignLoading,
                    tokenSymbol: formData.token?.symbol,
                  });
                  handleAmountNext();
                }
          }
          className="w-full"
        >
          {miniSignLoading
            ? 'Authorizing...'
            : isSubmitLoading
            ? 'Sending...'
            : loadingGasList && step === 'amount'
            ? 'Estimating...'
            : step === 'amount'
            ? 'Send'
            : 'Next'}
        </Button>
      </Action>

      {chainItem && (
        <SendReserveGasPopup
          selectedItem={selectedGasLevelType}
          chain={chain as CHAINS_ENUM}
          limit={Math.max(chainTokenGasFees.gasLimit, MINIMUM_GAS_LIMIT)}
          onGasChange={handleGasLevelChanged}
          gasList={gasList || []}
          open={reserveGasOpen}
          isLoading={loadingGasList}
          rawHexBalance={formData.token?.raw_amount_hex_str || '0'}
          onClose={() => handleReserveGasClose()}
        />
      )}
    </UIContainer>
  );
};

// Add styling to ensure proper scrolling and button visibility
const styles = `
  .send-token-content {
    padding-bottom: 100px !important;
  }
`;

export default SendToken;
