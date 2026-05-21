import { CHAINS_ENUM, ETH_USDT_CONTRACT, EVENTS } from '@/constant';
import {
  type HypermidBridgeQuoteBase,
  type HypermidBridgeTokenItem,
  fetchBridgeRoutes,
  fetchRecommendBridgeToChain,
  fetchBridgeHistoryList,
  fetchIsSameBridgeToken,
  fetchSuggestSlippage,
  fetchRecommendFromToken,
} from '../api';
import { useAsyncInitializeChainList } from '@/ui/hooks/useChain';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { formatUsdValue, isSameAddress, useWallet } from '@/ui/utils';
import { findChain, findChainByEnum, findChainByServerID } from '@/utils/chain';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { WrapTokenAddressMap } from '@rabby-wallet/rabby-swap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAsyncFn, useDebounce } from 'react-use';
import useAsync from 'react-use/lib/useAsync';
import { useRefreshId, useSetQuoteVisible, useSetRefreshId } from './context';
import { getChainDefaultToken, tokenAmountBn } from '@/ui/utils/token';
import BigNumber from 'bignumber.js';
import stats from '@/stats';
import { isNaN } from 'lodash';
import { useBridgeSlippage, useSwapSlippageForUnified } from './slippage';
import { useLocation } from 'react-router-dom';
import { query2obj } from '@/ui/utils/url';
import eventBus from '@/eventBus';
import {
  isSwapWrapToken,
  useQuoteMethods,
  TDexQuoteData,
} from '../../Swap/hooks/quote';
import { getSwapAutoSlippageValue } from '../../Swap/hooks/slippage';

export const enableInsufficientQuote = true;

// Bridge quote type
export interface SelectedBridgeQuote extends HypermidBridgeQuoteBase {
  shouldApproveToken?: boolean;
  shouldTwoStepApprove?: boolean;
  loading?: boolean;
  manualClick?: boolean;
  type: 'bridge';
}

// Swap/DEX quote type - wraps TDexQuoteData with additional UI state
export interface SelectedSwapQuote {
  shouldApproveToken?: boolean;
  shouldTwoStepApprove?: boolean;
  loading?: boolean;
  manualClick?: boolean;
  type: 'swap';
  dexQuote: TDexQuoteData;
  // Bridge-compatible fields for UI consistency
  aggregator: { id: string; logo: string };
  to_token_amount: string;
}

// Unified quote type that can represent either bridge or swap
export type UnifiedQuote = SelectedBridgeQuote | SelectedSwapQuote;

export const tokenPriceImpact = (
  fromToken?: TokenItem,
  toToken?: TokenItem,
  fromAmount?: string | number,
  toAmount?: string | number
) => {
  const notReady = [fromToken, toToken, fromAmount, toAmount].some((e) =>
    isNaN(e)
  );

  if (notReady) {
    return;
  }

  const fromUsdBn = new BigNumber(fromAmount || 0).times(fromToken?.price || 0);
  const toUsdBn = new BigNumber(toAmount || 0).times(toToken?.price || 0);

  const cut = toUsdBn.minus(fromUsdBn).div(fromUsdBn).times(100);

  return {
    showLoss: cut.lte(-5),
    lossUsd: formatUsdValue(toUsdBn.minus(fromUsdBn).abs().toString()),
    diff: cut.abs().toFixed(2),
    fromUsd: formatUsdValue(fromUsdBn.toString(10)),
    toUsd: formatUsdValue(toUsdBn.toString(10)),
  };
};

const useToken = (type: 'from' | 'to', refreshTokenId: number) => {
  const userAddress = useRabbySelector(
    (s) => s.account.currentAccount?.address
  );
  const wallet = useWallet();

  const lastSelectedToken = useRabbySelector((s) =>
    type === 'from' ? s.bridge.selectedFromToken : s.bridge.selectedToToken
  );

  const dispatch = useRabbyDispatch();

  const lastChainEnum = useMemo(
    () =>
      lastSelectedToken
        ? findChainByServerID(lastSelectedToken?.chain)?.enum
        : undefined,
    [lastSelectedToken?.chain]
  );
  const [chain, setChain] = useState<CHAINS_ENUM | undefined>(lastChainEnum);

  const [token, setToken] = useState<TokenItem | undefined>(lastSelectedToken);

  useEffect(() => {
    if (type === 'from') {
      dispatch.bridge.setSelectedFromToken(token);
    } else {
      dispatch.bridge.setSelectedToToken(token);
    }
  }, [token]);

  const switchChain: (
    changeChain?: CHAINS_ENUM,
    resetToken?: boolean
  ) => void = useCallback(
    (changeChain?: CHAINS_ENUM, resetToken = true) => {
      setChain(changeChain);
      if (resetToken) {
        if (type === 'from') {
          setToken(changeChain ? getChainDefaultToken(changeChain) : undefined);
        } else {
          setToken(undefined);
        }
      }
    },
    [type]
  );

  const { value, loading, error } = useAsync(async () => {
    if (userAddress && token?.id && chain) {
      const data = await wallet.openapi.getToken(
        userAddress,
        findChainByEnum(chain)!.serverId,
        token.id
      );
      return data;
    }
  }, [
    refreshTokenId,
    userAddress,
    token?.id,
    token?.raw_amount_hex_str,
    chain,
  ]);

  useDebounce(
    () => {
      if (value && !error && !loading) {
        setToken(value);
      }
    },
    300,
    [value, error, loading]
  );

  return [chain, token, setToken, switchChain] as const;
};

export const useBridge = () => {
  const userAddress = useRabbySelector(
    (s) => s.account.currentAccount?.address
  );

  const refreshId = useRefreshId();

  const setRefreshId = useSetRefreshId();

  const [refreshTokenId, updateRefreshTokenId] = useState(0);

  const refreshTokensInfo = useCallback(
    () => updateRefreshTokenId((e) => e + 1),
    [updateRefreshTokenId]
  );
  useEffect(() => {
    const refreshToken = (params: { addressList: string[] }) => {
      if (
        userAddress &&
        params?.addressList?.find((item) => {
          return isSameAddress(item || '', userAddress || '');
        })
      ) {
        refreshTokensInfo();
      }
    };

    eventBus.addEventListener(EVENTS.RELOAD_TX, refreshToken);
    return () => {
      eventBus.removeEventListener(EVENTS.RELOAD_TX, refreshToken);
    };
  }, [refreshTokensInfo, userAddress]);

  const wallet = useWallet();
  const [fromChain, fromToken, setFromToken, switchFromChain] = useToken(
    'from',
    refreshTokenId
  );
  const [toChain, toToken, setToToken, switchToChain] = useToken(
    'to',
    refreshTokenId
  );

  const [amount, setAmount] = useState('');

  const [maxNativeTokenGasPrice, setMaxNativeTokenGasPrice] = useState<
    number | undefined
  >(undefined);

  // Use bridge slippage for bridge quotes, swap slippage for swap quotes
  const bridgeSlippageObj = useBridgeSlippage();
  const swapSlippageObj = useSwapSlippageForUnified();

  // Fee rate state (matches old Swap component)
  const [feeRate, setFeeRate] = useState<'0' | '0.25'>('0');

  const [recommendFromToken, setRecommendFromToken] = useState<TokenItem>();

  const fillRecommendFromToken = useCallback(() => {
    if (recommendFromToken) {
      const targetChain = findChainByServerID(recommendFromToken?.chain);
      if (targetChain) {
        switchFromChain(targetChain.enum, false);
        setFromToken(recommendFromToken);
        setAmount('');
      }
    }
  }, [recommendFromToken, switchFromChain, setFromToken]);

  const [selectedBridgeQuote, setOriSelectedBridgeQuote] = useState<
    UnifiedQuote | undefined
  >();

  const expiredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inSufficient = useMemo(
    () =>
      fromToken
        ? tokenAmountBn(fromToken).lt(amount)
        : new BigNumber(0).lt(amount),
    [fromToken, amount]
  );

  const inSufficientCanGetQuote = enableInsufficientQuote
    ? true
    : !inSufficient;

  // Detect if it's a same-chain swap instead of a cross-chain bridge
  const isSwap = useMemo(
    () => !!fromChain && !!toChain && fromChain === toChain,
    [fromChain, toChain]
  );

  const slippageForUi = isSwap ? swapSlippageObj : bridgeSlippageObj;

  const isWrapToken = useMemo(() => {
    if (!isSwap || !fromToken?.id || !toToken?.id || !fromChain) {
      return false;
    }
    return isSwapWrapToken(fromToken.id, toToken.id, fromChain);
  }, [isSwap, fromToken?.id, toToken?.id, fromChain]);

  const isStableCoin = useMemo(() => {
    if (!isSwap || !fromToken?.price || !toToken?.price) {
      return false;
    }
    return new BigNumber(fromToken.price)
      .minus(toToken.price)
      .div(fromToken.price)
      .abs()
      .lte(0.01);
  }, [isSwap, fromToken?.price, toToken?.price]);

  // Reset to auto-slippage when chain or tokens change
  useEffect(() => {
    if (isSwap) {
      swapSlippageObj.setAutoSlippage(true);
    }
  }, [fromChain, fromToken?.id, toToken?.id, isSwap]);

  useEffect(() => {
    if (!isSwap) {
      return;
    }
    if (isWrapToken) {
      setFeeRate('0');
    }
    if (swapSlippageObj.autoSlippage) {
      swapSlippageObj.setSlippage(getSwapAutoSlippageValue(isStableCoin));
    }
  }, [isSwap, isWrapToken, isStableCoin, swapSlippageObj.autoSlippage]);

  const getRecommendToChain = async (chain: CHAINS_ENUM) => {
    const useRemoteRecommendChain = async () => {
      const data = await fetchRecommendBridgeToChain({
        from_chain_id: findChainByEnum(chain)!.serverId,
      });
      switchToChain(findChainByServerID(data.to_chain_id)?.enum);
    };
    if (userAddress) {
      const latestTx = await fetchBridgeHistoryList({
        user_addr: userAddress,
        start: 0,
        limit: 1,
        is_all: true,
      });
      const latestToToken = latestTx?.history_list?.[0]?.to_token;
      if (latestToToken) {
        const lastBridgeChain = findChainByServerID(latestToToken.chain);
        if (lastBridgeChain && lastBridgeChain.enum !== chain) {
          switchToChain(lastBridgeChain.enum);
          setToToken((latestToToken as unknown) as TokenItem);
        } else {
          await useRemoteRecommendChain();
        }
      } else {
        await useRemoteRecommendChain();
      }
    }
  };

  const {
    value: isSameToken,
    loading: isSameTokenLoading,
  } = useAsync(async () => {
    if (fromChain && fromToken?.id && toChain && toToken?.id) {
      try {
        const data = await fetchIsSameBridgeToken({
          from_chain_id: findChainByEnum(fromChain)!.serverId,
          from_token_id: fromToken?.id,
          to_chain_id: findChainByEnum(toChain)!.serverId,
          to_token_id: toToken?.id,
        });
        return data?.every((e) => e.is_same);
      } catch (error) {
        return false;
      }
    }
    return false;
  }, [fromChain, fromToken?.id, toChain, toToken?.id]);

  useEffect(() => {
    // For bridges, adjust slippage based on whether it's the same token
    if (!isSwap && !isSameTokenLoading && bridgeSlippageObj.autoSlippage) {
      bridgeSlippageObj.setSlippage(isSameToken ? '0.5' : '1');
    }
  }, [
    bridgeSlippageObj?.autoSlippage,
    bridgeSlippageObj?.setSlippage,
    isSameToken,
    isSameTokenLoading,
    isSwap,
  ]);

  const supportedChains = useRabbySelector((s) => s.bridge.supportedChains);
  // the most worth chain is the first
  useAsyncInitializeChainList({
    supportChains: supportedChains,
    onChainInitializedAsync: (firstEnum) => {
      if (!(searchObj?.fromChain && searchObj?.fromTokenId) && !fromToken) {
        switchFromChain(firstEnum);
      }
      if (!(searchObj?.toTokenId && searchObj.toChain) && !toToken) {
        getRecommendToChain(firstEnum);
      }
    },
  });

  const handleAmountChange = useCallback((v: string) => {
    if (!/^\d*(\.\d*)?$/.test(v)) {
      return;
    }
    setAmount(v);
  }, []);

  const switchToken = useCallback(() => {
    switchFromChain(toChain, false);
    switchToChain(fromChain, false);
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  }, [
    setFromToken,
    toToken,
    setToToken,
    fromToken,
    switchFromChain,
    toChain,
    switchToChain,
    fromChain,
  ]);

  const [quoteList, setQuotesList] = useState<UnifiedQuote[]>([]);

  const setSelectedBridgeQuote = useCallback((quote?: UnifiedQuote) => {
    if (!quote?.manualClick && expiredTimer.current) {
      clearTimeout(expiredTimer.current);
    }
    if (!quote?.manualClick && quote) {
      expiredTimer.current = setTimeout(() => {
        setRefreshId((e) => e + 1);
      }, 1000 * 30);
    }
    setOriSelectedBridgeQuote(quote);
  }, []);

  useEffect(() => {
    setQuotesList([]);
    setRecommendFromToken(undefined);
    setSelectedBridgeQuote(undefined);
  }, [fromToken?.id, toToken?.id, fromChain, toChain]);

  useEffect(() => {
    if (!inSufficientCanGetQuote) {
      setQuotesList([]);
      setRecommendFromToken(undefined);
      setSelectedBridgeQuote(undefined);
    }
  }, [inSufficientCanGetQuote, setSelectedBridgeQuote]);

  useEffect(() => {
    if (
      !enableInsufficientQuote ||
      !amount ||
      Number(amount) === 0 ||
      quoteList.length < 1
    ) {
      setQuotesList([]);
      setRecommendFromToken(undefined);
      setSelectedBridgeQuote(undefined);
    }
  }, [amount, setSelectedBridgeQuote, quoteList.length]);

  const aggregatorsList = useRabbySelector(
    (s) => s.bridge.aggregatorsList || []
  );

  // useQuoteMethods kept for potential future use; currently same-chain swaps
  // use the bridge routes endpoint for reliability.
  const { getAllQuotes: _getSwapQuotes } = useQuoteMethods();

  const [pending, setPending] = useState(false);
  const fetchIdRef = useRef(0);
  const [
    { loading: quoteLoading, error: quotesError },
    getQuoteList,
  ] = useAsyncFn(async () => {
    fetchIdRef.current += 1;
    // For same-chain swaps, skip aggregators check since we'll use DEX APIs
    const shouldFetchQuotes = isSwap
      ? inSufficientCanGetQuote &&
        userAddress &&
        fromToken &&
        fromToken?.id &&
        toToken &&
        toToken?.id &&
        fromChain &&
        toChain &&
        Number(amount) > 0
      : inSufficientCanGetQuote &&
        userAddress &&
        fromToken &&
        fromToken?.id &&
        toToken &&
        toToken?.id &&
        fromChain &&
        toChain &&
        Number(amount) > 0 &&
        aggregatorsList.length > 0;

    if (shouldFetchQuotes) {
      // Type assertions for values guaranteed by shouldFetchQuotes condition
      const _fromToken = fromToken!;
      const _toToken = toToken!;
      const _userAddress = userAddress!;
      const _fromChain = fromChain!;

      refreshTokensInfo();
      const currentFetchId = fetchIdRef.current;

      let isEmpty = false;
      const result: UnifiedQuote[] = [];

      setQuotesList((e) => {
        if (!e.length) {
          isEmpty = true;
        }
        return e?.map((e) => ({ ...e, loading: true }));
      });

      // Branch: Fetch same-chain swap quotes via bridge routes endpoint.
      // The /v1/swap/dex_quote endpoint is not yet reliable; LI.FI-based
      // /v1/swap/routes supports same-chain DEX routes with fromChain === toChain
      // and goes through the existing, working bridge tx-build flow.
      if (isSwap) {
        setPending(true);

        try {
          const rawAmount = new BigNumber(amount)
            .times(10 ** _fromToken.decimals)
            .toFixed(0, 1)
            .toString();

          const slippageFraction = new BigNumber(
            swapSlippageObj.slippageState || '0.5'
          )
            .div(100)
            .toString(10);

          const routes = await fetchBridgeRoutes({
            user_addr: _userAddress,
            from_chain_id: _fromToken.chain,
            from_token_id: _fromToken.id,
            from_token_raw_amount: rawAmount,
            to_chain_id: _toToken.chain, // same chain for same-chain swaps
            to_token_id: _toToken.id,
            slippage: slippageFraction,
          }).catch(() => [] as HypermidBridgeQuoteBase[]);

          if (currentFetchId !== fetchIdRef.current) {
            setPending(false);
            return;
          }

          // Convert raw token amount to decimal-adjusted for display
          const toDecimals = _toToken.decimals || 18;
          const swapRoutes = routes.map(
            (q): HypermidBridgeQuoteBase => ({
              ...q,
              to_token_amount: q.to_token_raw_amount
                ? new BigNumber(q.to_token_raw_amount)
                    .div(10 ** toDecimals)
                    .toString(10)
                : '0',
            })
          );

          const validRoutes = swapRoutes.filter(
            (q) => q.bridge?.id && q.bridge?.name
          );

          if (validRoutes.length === 0) {
            setSelectedBridgeQuote(undefined);
            setPending(false);
            return;
          }

          if (!isEmpty) {
            setQuotesList(
              validRoutes.map((e) => ({
                ...e,
                type: 'bridge' as const,
                loading: true,
              }))
            );
          }

          await Promise.allSettled(
            validRoutes.map(async (quote) => {
              if (currentFetchId !== fetchIdRef.current) return;

              let tokenApproved = false;
              let allowance = '0';
              const fromChainObj = findChain({ serverId: _fromToken?.chain });
              if (_fromToken?.id === fromChainObj?.nativeTokenAddress) {
                tokenApproved = true;
              } else {
                allowance = await wallet.getERC20Allowance(
                  _fromToken.chain,
                  _fromToken.id,
                  quote.approve_contract_id
                );
                tokenApproved = new BigNumber(allowance).gte(
                  new BigNumber(amount).times(10 ** _fromToken.decimals)
                );
              }

              const shouldTwoStepApprove =
                fromChainObj?.enum === CHAINS_ENUM.ETH &&
                isSameAddress(_fromToken.id, ETH_USDT_CONTRACT) &&
                Number(allowance) !== 0 &&
                !tokenApproved;

              const finalQuote = {
                ...quote,
                type: 'bridge' as const,
                loading: false,
                shouldTwoStepApprove,
                shouldApproveToken: !tokenApproved,
              };

              if (isEmpty) {
                result.push(finalQuote);
              } else {
                if (currentFetchId === fetchIdRef.current) {
                  setQuotesList((e) => {
                    const filtered = e.filter(
                      (item) =>
                        item.type === 'swap' ||
                        (item.type === 'bridge' &&
                          (item.aggregator.id !== quote.aggregator.id ||
                            item.bridge.id !== quote.bridge.id))
                    );
                    return [...filtered, finalQuote];
                  });
                }
              }
            })
          );

          if (isEmpty && currentFetchId === fetchIdRef.current) {
            setQuotesList(result);
          }
        } catch (error) {
          console.error('Failed to fetch same-chain swap routes:', error);
        } finally {
          setPending(false);
        }

        return;
      }

      // Branch: Fetch bridge quotes for cross-chain
      const originData: HypermidBridgeQuoteBase[] = [];

      const getQUoteV2 = async (alternativeToken?: TokenItem) => {
        const fromChainId = alternativeToken?.chain || _fromToken.chain;
        const fromTokenId = alternativeToken?.id || _fromToken.id;
        const fromTokenRawAmount = alternativeToken
          ? new BigNumber(amount)
              .times(_fromToken.price)
              .div(alternativeToken.price)
              .times(10 ** alternativeToken.decimals)
              .toFixed(0, 1)
              .toString()
          : new BigNumber(amount)
              .times(10 ** _fromToken.decimals)
              .toFixed(0, 1)
              .toString();

        const data = await fetchBridgeRoutes({
          user_addr: _userAddress,
          from_chain_id: fromChainId,
          from_token_id: fromTokenId,
          from_token_raw_amount: fromTokenRawAmount,
          to_chain_id: _toToken.chain,
          to_token_id: _toToken.id,
          slippage: new BigNumber(bridgeSlippageObj.slippageState)
            .div(100)
            .toString(10),
        })
          .catch(() => {
            if (currentFetchId === fetchIdRef.current && !alternativeToken) {
              stats.report('bridgeQuoteResult', {
                aggregatorIds: '',
                fromChainId: _fromToken.chain,
                fromTokenId: _fromToken.id,
                toTokenId: _toToken.id,
                toChainId: _toToken.chain,
                status: 'fail',
              });
            }
            return undefined;
          });

        if (alternativeToken) {
          if (data?.length && currentFetchId === fetchIdRef.current) {
            setRecommendFromToken(alternativeToken);
            return;
          }
        }
        if (data?.length && currentFetchId === fetchIdRef.current) {
          originData.push(...data);
        }
        if (currentFetchId === fetchIdRef.current) {
          stats.report('bridgeQuoteResult', {
            aggregatorIds: data?.map((q) => q.aggregator?.id).filter(Boolean).join(',') || '',
            fromChainId: _fromToken.chain,
            fromTokenId: _fromToken.id,
            toTokenId: _toToken.id,
            toChainId: _toToken.chain,
            status: data?.length ? 'success' : 'none',
          });
        }
      };

      await getQUoteV2();

      const data = originData?.filter(
        (quote) => !!quote?.bridge && !!quote?.bridge?.id && !!quote.bridge.name
      );

      if (currentFetchId === fetchIdRef.current) {
        setPending(false);

        if (data.length < 1) {
          try {
            const recommendFromToken = await fetchRecommendFromToken({
              user_addr: _userAddress,
              from_chain_id: _fromToken.chain,
              from_token_id: _fromToken.id,
              from_token_amount: new BigNumber(amount)
                .times(10 ** _fromToken.decimals)
                .toFixed(0, 1)
                .toString(),
              to_chain_id: _toToken.chain,
              to_token_id: _toToken.id,
            });
            if (recommendFromToken?.token_list?.[0]) {
              await getQUoteV2(
                (recommendFromToken.token_list[0] as unknown) as TokenItem
              );
            } else {
              setRecommendFromToken(undefined);
            }
          } catch (error) {
            setRecommendFromToken(undefined);
          }

          setSelectedBridgeQuote(undefined);
        }

        stats.report('bridgeQuoteResult', {
          aggregatorIds: data?.map((q) => q?.aggregator?.id).filter(Boolean).join(',') || '',
          fromChainId: _fromToken.chain,
          fromTokenId: _fromToken.id,
          toTokenId: _toToken.id,
          toChainId: _toToken.chain,
          status: data ? (data?.length === 0 ? 'none' : 'success') : 'fail',
        });
      }

      if (data && currentFetchId === fetchIdRef.current) {
        if (!isEmpty) {
          setQuotesList(
            data.map((e) => ({ ...e, type: 'bridge' as const, loading: true }))
          );
        }

        await Promise.allSettled(
          data.map(async (quote) => {
            if (currentFetchId !== fetchIdRef.current) {
              return;
            }
            let tokenApproved = false;
            let allowance = '0';
            const fromChain = findChain({ serverId: _fromToken?.chain });
            if (_fromToken?.id === fromChain?.nativeTokenAddress) {
              tokenApproved = true;
            } else {
              allowance = await wallet.getERC20Allowance(
                _fromToken.chain,
                _fromToken.id,
                quote.approve_contract_id
              );
              tokenApproved = new BigNumber(allowance).gte(
                new BigNumber(amount).times(10 ** _fromToken.decimals)
              );
            }
            let shouldTwoStepApprove = false;
            if (
              fromChain?.enum === CHAINS_ENUM.ETH &&
              isSameAddress(_fromToken.id, ETH_USDT_CONTRACT) &&
              Number(allowance) !== 0 &&
              !tokenApproved
            ) {
              shouldTwoStepApprove = true;
            }

            if (isEmpty) {
              result.push({
                ...quote,
                type: 'bridge' as const,
                shouldTwoStepApprove,
                shouldApproveToken: !tokenApproved,
              });
            } else {
              if (currentFetchId === fetchIdRef.current) {
                setQuotesList((e) => {
                  const filteredArr = e.filter(
                    (item) =>
                      item.type === 'swap' ||
                      (item.type === 'bridge' &&
                        (item.aggregator.id !== quote.aggregator.id ||
                          item.bridge.id !== quote.bridge.id))
                  );
                  return [
                    ...filteredArr,
                    {
                      ...quote,
                      type: 'bridge' as const,
                      loading: false,
                      shouldTwoStepApprove,
                      shouldApproveToken: !tokenApproved,
                    },
                  ];
                });
              }
            }
          })
        );

        if (isEmpty && currentFetchId === fetchIdRef.current) {
          setQuotesList(result);
        }
      }
    }
  }, [
    inSufficientCanGetQuote,
    aggregatorsList,
    refreshId,
    userAddress,
    fromToken?.id,
    toToken?.id,
    fromChain,
    toChain,
    amount,
    slippageForUi.slippage,
    isSwap,
  ]);

  useEffect(() => {
    if (
      inSufficientCanGetQuote &&
      userAddress &&
      fromToken?.id &&
      toToken?.id &&
      toToken &&
      fromChain &&
      toChain &&
      Number(amount) > 0 &&
      aggregatorsList.length > 0
    ) {
      setPending(true);
    } else {
      setPending(false);
      setSelectedBridgeQuote(undefined);
    }
  }, [
    inSufficientCanGetQuote,
    userAddress,
    fromToken?.id,
    toToken?.id,
    toToken,
    fromChain,
    toChain,
    aggregatorsList.length,
    refreshId,
  ]);

  const [, cancelDebounce] = useDebounce(
    () => {
      getQuoteList();
    },
    300,
    [getQuoteList]
  );

  const [bestQuoteId, setBestQuoteId] = useState<
    | {
        bridgeId: string;
        aggregatorId: string;
      }
    | undefined
  >(undefined);

  const openQuote = useSetQuoteVisible();

  const openQuotesList = useCallback(() => {
    openQuote(true);
  }, [openQuote]);

  useEffect(() => {
    if (!quoteLoading && toToken && quoteList.every((e) => !e.loading)) {
      const sortedList = quoteList?.sort((b, a) => {
        const aValue = new BigNumber(a.to_token_amount).times(
          toToken.price || 1
        );
        const bValue = new BigNumber(b.to_token_amount).times(
          toToken.price || 1
        );

        // Subtract gas fees for bridge quotes, use preExecResult.gasUsdValue for DEX quotes
        const aGasFee =
          a.type === 'bridge'
            ? a.gas_fee.usd_value
            : (a.type === 'swap' && a.dexQuote.preExecResult?.gasUsdValue) || 0;
        const bGasFee =
          b.type === 'bridge'
            ? b.gas_fee.usd_value
            : (b.type === 'swap' && b.dexQuote.preExecResult?.gasUsdValue) || 0;

        return aValue.minus(aGasFee).minus(bValue.minus(bGasFee)).toNumber();
      });

      if (sortedList[0] && sortedList[0]?.aggregator?.id) {
        // Set best quote ID - handle both bridge and swap quotes
        if (sortedList[0].type === 'bridge') {
          setBestQuoteId({
            bridgeId: sortedList[0].bridge_id,
            aggregatorId: sortedList[0].aggregator.id,
          });
        } else if (sortedList[0].type === 'swap') {
          setBestQuoteId({
            bridgeId: sortedList[0].dexQuote.name, // Use DEX name as identifier
            aggregatorId: sortedList[0].aggregator.id,
          });
        }

        let useQuote = sortedList[0];

        setOriSelectedBridgeQuote((preItem) => {
          useQuote = preItem?.manualClick ? preItem : sortedList[0];
          return preItem;
        });

        setSelectedBridgeQuote(useQuote);
      }
    }
  }, [quoteList, quoteLoading, toToken]);

  if (quotesError) {
    console.error('quotesError', quotesError);
  }

  const showLoss = useMemo(() => {
    if (!selectedBridgeQuote) return false;

    const toAmount =
      toToken && selectedBridgeQuote?.to_token_amount
        ? selectedBridgeQuote.type === 'swap'
          ? new BigNumber(selectedBridgeQuote.to_token_amount)
              .div(10 ** toToken.decimals)
              .toString(10)
          : String(selectedBridgeQuote.to_token_amount)
        : selectedBridgeQuote?.to_token_amount;

    return !!tokenPriceImpact(fromToken, toToken, amount, toAmount)?.showLoss;
  }, [
    fromToken,
    toToken,
    amount,
    selectedBridgeQuote?.type,
    selectedBridgeQuote?.to_token_amount,
    toToken?.decimals,
  ]);

  const clearExpiredTimer = useCallback(() => {
    if (expiredTimer.current) {
      clearTimeout(expiredTimer.current);
    }
  }, []);

  const { search } = useLocation();
  const [searchObj] = useState<{
    fromChain?: CHAINS_ENUM;
    fromChainServerId?: string;
    fromTokenId?: string;
    inputAmount?: string;
    toChainServerId?: string;
    toChain?: CHAINS_ENUM;
    toTokenId?: string;
    maxNativeTokenGasPrice?: string;

    chain?: string; // for from swap switch to bridge use from token
    payTokenId?: string; // for from swap switch to bridge
  }>(query2obj(search));

  useEffect(() => {
    let active = true;

    if (!searchObj) {
      return;
    }
    const fromChainServerId = searchObj.fromChainServerId || searchObj.chain;
    const fromTokenId = searchObj.fromTokenId || searchObj.payTokenId;

    if ((searchObj.fromChain || fromChainServerId) && fromTokenId) {
      const fromChainItem = findChain({
        enum: searchObj.fromChain,
        serverId: fromChainServerId,
      });

      if (userAddress && fromChainItem) {
        wallet.openapi
          .getToken(userAddress, fromChainItem.serverId, fromTokenId)
          .then((token) => {
            if (active) {
              switchFromChain(fromChainItem.enum);
              setFromToken(token);
            }
          });
      }
      if (searchObj.inputAmount) {
        handleAmountChange(searchObj.inputAmount);
      }
    }
    if (
      (searchObj.toChain || searchObj.toChainServerId) &&
      searchObj.toTokenId
    ) {
      const toChain = findChain({
        enum: searchObj.toChain,
        serverId: searchObj.toChainServerId,
      });
      if (userAddress && toChain) {
        wallet.openapi
          .getToken(userAddress, toChain.serverId, searchObj.toTokenId)
          .then((token) => {
            if (active) {
              switchToChain(toChain.enum);
              setToToken(token);
            }
          });
      }
    }

    return () => {
      active = false;
    };
  }, [
    searchObj?.fromChain,
    searchObj?.fromTokenId,
    searchObj?.inputAmount,
    searchObj?.toChain,
    searchObj?.toTokenId,
    searchObj?.chain,
    searchObj?.payTokenId,
  ]);

  const isSetMaxRef = useRef(false);
  useEffect(() => {
    if (isSetMaxRef.current) {
      return;
    }
    if (amount === searchObj?.inputAmount && searchObj.maxNativeTokenGasPrice) {
      setMaxNativeTokenGasPrice(+searchObj.maxNativeTokenGasPrice || undefined);
      isSetMaxRef.current = true;
    }
  }, [amount, searchObj.inputAmount, searchObj.maxNativeTokenGasPrice]);

  return {
    clearExpiredTimer,

    fromChain,
    fromToken,
    setFromToken,
    switchFromChain,
    toChain,
    toToken,
    setToToken,
    switchToChain,
    switchToken,

    recommendFromToken,
    fillRecommendFromToken,

    inSufficient,
    inSufficientCanGetQuote,
    amount,
    handleAmountChange,
    showLoss,

    openQuotesList,
    quoteLoading: pending || quoteLoading,
    setQuotesList,
    quoteList,

    bestQuoteId,
    selectedBridgeQuote,

    setSelectedBridgeQuote,

    maxNativeTokenGasPrice,
    setMaxNativeTokenGasPrice,

    isSwap,

    ...slippageForUi,
  };
};
