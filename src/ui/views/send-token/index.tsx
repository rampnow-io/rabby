import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content } from '@repo/ui';
import { Button } from '@repo/ui/primitives';
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
import styled from 'styled-components';
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

const ReviewContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ReviewItem = styled.div`
  border: 1px solid var(--r-neutral-line, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  padding: 16px;
  background-color: var(--r-neutral-bg-1, rgba(255, 255, 255, 0.05));

  .review-label {
    font-size: 12px;
    color: var(--r-neutral-body, #b3b3b3);
    margin-bottom: 8px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .review-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--r-neutral-title-1, #fff);
    display: flex;
    align-items: center;
    gap: 8px;

    .token-symbol {
      font-size: 14px;
      color: var(--r-neutral-body, #b3b3b3);
    }
  }

  .review-address {
    font-size: 12px;
    font-family: monospace;
    color: var(--r-neutral-body, #b3b3b3);
    word-break: break-all;
    margin-top: 4px;
  }
`;

const GasInfoContainer = styled.div`
  padding: 12px 16px;
  background-color: var(--r-neutral-bg-2, rgba(255, 255, 255, 0.02));
  border-radius: 8px;
  border: 1px solid var(--r-neutral-line, rgba(255, 255, 255, 0.1));
  font-size: 12px;
  color: var(--r-neutral-body, #b3b3b3);

  .gas-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .gas-value {
      color: var(--r-neutral-title-1, #fff);
      font-weight: 600;
    }
  }
`;

const SendToken = () => {
  const history = useHistory();
  const location = useLocation();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  const [form] = Form.useForm();

  const [step, setStep] = useState<'recipient' | 'token' | 'amount' | 'review'>(
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
  const [clickedMax, setClickedMax] = useState(false);
  const [refreshId, setRefreshId] = useState(0);

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
        return {};
      }
      const chain = findChain({
        serverId: formData.token.chain,
      })!;
      const sendValue = new BigNumber(amount || 0)
        .multipliedBy(10 ** formData.token.decimals)
        .decimalPlaces(0, BigNumber.ROUND_DOWN);
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
        to: formData.token.id,
        value: '0x0',
        data: abiCoder.encodeFunctionCall(dataInput[0], dataInput[1]),
        isSend: true,
      };
      if (isNativeToken) {
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
    if (!formData.amount || !formData.token) return [];
    const params = getParams({ amount: formData.amount }) as Tx;

    const list: GasLevel[] = chainItem?.isTestnet
      ? await wallet.getCustomTestnetGasMarket({ chainId: chainItem.id })
      : params?.from
      ? await wallet.gasMarketV2({
          chain: chainItem!,
          tx: params,
        })
      : [];
    return list;
  }, [chainItem, formData.amount, formData.token, getParams, wallet]);

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
      currentAccount?.address,
      loadGasList,
      chainItem?.id,
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

  useEffect(() => {
    if (step === 'recipient' && formData.recipient) {
      setStep('token');
    }
  }, [step, formData.recipient]);

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
    setSelectedGasLevel(gasLevel);
  }, []);

  // Check if can use direct sign
  const canUseDirectSubmitTx = useMemo(() => {
    return (
      !!formData.token &&
      !!formData.recipient &&
      !!formData.amount &&
      supportedDirectSign(currentAccount?.type || '') &&
      !chainItem?.isTestnet
    );
  }, [
    formData.token,
    formData.recipient,
    formData.amount,
    chainItem,
    currentAccount?.type,
  ]);

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
            setSelectedGasLevel(gasLevel);
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
    if (canSubmit) {
      setStep('review');
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
    } else if (step === 'review') {
      setStep('amount');
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
        return;
      }
      const params = getParams({ amount });

      let shouldForceSignPage = !!forceSignPage;

      // Try direct sign first
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
          setFormData((prev) => ({ ...prev, amount: '' }));
          const hash = hashes[hashes.length - 1];
          if (hash) {
            message.success('Transaction sent successfully!');
            await handleMiniSignResolve();
            // Go back to start or close
            setTimeout(() => {
              setStep('recipient');
              setFormData({ token: null, recipient: '', amount: '' });
            }, 1000);
          } else {
            setMiniSignLoading(false);
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
        if (clickedMax && selectedGasLevel?.price) {
          params.gasPrice = selectedGasLevel?.price;
        }
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

        if (isTab || isDesktop) {
          await promise;
          setFormData((prev) => ({ ...prev, amount: '' }));
        } else {
          window.close();
        }
      } catch (e: any) {
        message.error(e.message);
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
            />
          )}
          {step === 'review' && (
            <ReviewContainer>
              <ReviewItem>
                <div className="review-label">From</div>
                <div className="review-address">{currentAccount?.address}</div>
              </ReviewItem>

              <ReviewItem>
                <div className="review-label">To</div>
                <div className="review-address">{formData.recipient}</div>
              </ReviewItem>

              <ReviewItem>
                <div className="review-label">Amount</div>
                <div className="review-value">
                  {formData.amount}
                  <span className="token-symbol">{formData.token?.symbol}</span>
                </div>
                {formData.token?.price && (
                  <div className="review-address">
                    ≈ $
                    {new BigNumber(formData.amount || 0)
                      .multipliedBy(formData.token.price)
                      .toFixed(2)}
                  </div>
                )}
              </ReviewItem>

              <GasInfoContainer>
                <div className="gas-row">
                  <span>Network Fee:</span>
                  <span className="gas-value">
                    {selectedGasLevel
                      ? `${new BigNumber(selectedGasLevel.price)
                          .div(1e9)
                          .toFixed(2)} Gwei`
                      : 'Estimating...'}
                  </span>
                </div>
                {selectedGasLevel && (
                  <div className="gas-row">
                    <span>Estimated Time:</span>
                    <span className="gas-value">
                      ~{Math.ceil(selectedGasLevel.estimated_seconds / 60)}m
                    </span>
                  </div>
                )}
                <div
                  className="gas-row"
                  style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Total:</span>
                  <span className="gas-value" style={{ fontSize: '14px' }}>
                    {formData.amount} {formData.token?.symbol}
                  </span>
                </div>
              </GasInfoContainer>
            </ReviewContainer>
          )}
        </Content>
      </Container>
      <Action>
        {step !== 'review' && (
          <Button
            disabled={
              (step === 'recipient' && !canProceedToToken) ||
              (step === 'token' && !canProceedToAmount) ||
              (step === 'amount' && (!formData.amount || insufficientError))
            }
            onClick={
              step === 'recipient'
                ? handleRecipientNext
                : step === 'token'
                ? () => {
                    const token = formData.token;
                    if (token) handleTokenSelect(token);
                  }
                : handleAmountNext
            }
          >
            {step === 'amount' ? 'Review' : 'Next'}
          </Button>
        )}
        {step === 'review' && (
          <Button
            onClick={() => handleSubmit({ amount: formData.amount })}
            disabled={isSubmitLoading || miniSignLoading || !selectedGasLevel}
          >
            {miniSignLoading
              ? 'Authorizing...'
              : isSubmitLoading
              ? 'Sending...'
              : 'Send'}
          </Button>
        )}
      </Action>
    </UIContainer>
  );
};

export default SendToken;
