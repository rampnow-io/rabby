import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content, useEventRef } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import { getUiType } from 'ui/utils';
import { Button } from '@repo/ui/primitives';
import TokenSelect from '@/ui/component/TokenSelect';
import { ReactComponent as RcIconWarningCC } from '@/ui/assets/warning-cc.svg';
import {
  tokenPriceImpact,
  useBridge,
  useSetQuoteVisible,
  useSetRefreshId,
  useSetSettingVisible,
  useSettingVisible,
} from './hooks';
import {  X } from 'lucide-react';
import { RabbyFeePopup } from '../Swap/Component/RabbyFeePopup';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { useCss, useAsync } from 'react-use';
import { useHistory } from 'react-router-dom';
import { useRabbySelector } from '@/ui/store';
import { CHAINS_ENUM } from '@/types/chain';
import { useExternalSwapBridgeDapps } from '@/ui/component/ExternalSwapBridgeDappPopup/hooks';
import { useTranslation } from 'react-i18next';
import {
  isSameAddress,
  useWallet,
  formatUsdValue,
  formatTokenAmount,
} from '@/ui/utils';
import { useRbiSource } from '@/ui/utils/ga-event';
import pRetry, { AbortError } from 'p-retry';
import stats from '@/stats';
import { findChain, findChainByEnum } from '@/utils/chain';
import { useMemoizedFn, useRequest } from 'ahooks';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { supportedDirectSign } from '@/ui/hooks/useMiniApprovalDirectSign';
import { useMiniSigner } from '@/ui/hooks/useSigner';
import { MINI_SIGN_ERROR } from '@/ui/component/MiniSignV2/state/SignatureManager';
import BigNumber from 'bignumber.js';
import AssetInput from './components/asset-input';
import { tokenAmountBn } from '@/ui/utils/token';
import { DirectSignToConfirmBtn } from '@/ui/component/ToConfirmButton';
import { DbkButton } from '../Ecology/dbk-chain/components/DbkButton';
import clsx from 'clsx';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { DBK_CHAIN_ID, DEX_WITH_WRAP } from '@/constant';

import { Alert } from 'antd';
import {
  BridgeShowMore,
  BridgeInfoSummary,
  BridgeInlineWarnings,
  DirectSignGasInfo,
  RecommendFromToken,
} from './components/bridge/BridgeShowMore';
import { BridgePendingTxItem } from './components/bridge/PendingTxItem';
import { QuoteList } from './components/bridge/BridgeQuotes';

import { PendingTxItem } from './components/swap/PendingTxItem';
import ReviewSwapBridge from './components/ReviewSwapBridge';
import RouteSelectorModal, {
  type Route as RouteOption,
} from './components/route-selector-modal';

const isTab = getUiType().isTab;
const isDesktop = getUiType().isDesktop;

const getContainer = isTab
  ? '.js-rabby-popup-container'
  : isDesktop
  ? '.js-rabby-desktop-swap-container'
  : undefined;

const SwapAndBridgeContainer = () => {
  const wallet = useWallet();
  const { userAddress } = useRabbySelector((state) => ({
    userAddress: state.account.currentAccount?.address || '',
  }));

  const {
    fromChain,
    fromToken,
    setFromToken,
    switchFromChain,
    toChain,
    toToken,
    setToToken,
    switchToChain: setToChain,
    switchToken,
    amount,
    handleAmountChange,

    recommendFromToken,
    fillRecommendFromToken,

    inSufficient,

    quoteLoading,
    quoteList,
    setQuotesList,

    bestQuoteId,
    selectedBridgeQuote,

    setSelectedBridgeQuote,

    slippage,
    slippageState,
    setSlippage,
    setSlippageChanged,
    isSlippageHigh,
    isSlippageLow,

    autoSlippage,
    isCustomSlippage,
    setAutoSlippage,
    setIsCustomSlippage,

    clearExpiredTimer,
    maxNativeTokenGasPrice,
    setMaxNativeTokenGasPrice,
    inSufficientCanGetQuote,
    isSwap,
  } = useBridge();

  const [historyVisible, setHistoryVisible] = useState(false);
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const isSettingMaxRef = useRef(false);

  const currentAccount = useCurrentAccount();
  const allSupportedChains = useRabbySelector((s) => s.bridge.supportedChains);

  // Fetch user's assets across all chains to determine which chains have liquidity for "from" selection
  const {
    value: chainsWithLiquidity = new Set<string>(),
  } = useAsync(async () => {
    if (!currentAccount?.address) {
      return new Set();
    }

    const chainsWithAssets = new Set<string>();

    try {
      for (const chainEnum of allSupportedChains) {
        const chainObj = findChainByEnum(chainEnum);
        if (!chainObj?.serverId) continue;

        try {
          const tokenList = await wallet.openapi.listToken(
            currentAccount.address,
            chainObj.serverId
          );
          const hasLiquidity =
            tokenList &&
            tokenList.some((t) =>
              new BigNumber(t.raw_amount_hex_str || 0, 16).gt(0)
            );
          if (hasLiquidity) {
            chainsWithAssets.add(chainEnum);
          }
        } catch (e) {
          console.error(`Failed to fetch tokens for chain ${chainEnum}:`, e);
        }
      }
    } catch (e) {
      console.error('Failed to fetch chains with liquidity:', e);
    }

    return chainsWithAssets;
  }, [currentAccount?.address, allSupportedChains, wallet]);

  // Filter supported chains to only show chains with liquidity for "from" chain selection
  const supportedFromChains = useMemo(() => {
    return allSupportedChains.filter((chain) => chainsWithLiquidity.has(chain));
  }, [allSupportedChains, chainsWithLiquidity]);

  const chains = useMemo(
    () => [toChain, fromChain].filter((e) => !!e) as CHAINS_ENUM[],
    [toChain, fromChain]
  );

  const {
    isSupportedChain,
    data: externalDapps,
    loading: externalDappsLoading,
  } = useExternalSwapBridgeDapps(chains, 'bridge');
  const [externalDappOpen, setExternalDappOpen] = useState(false);

  const showExternalDappTips = useMemo(
    () => !isSupportedChain && !!fromChain && !!toChain,
    [isSupportedChain, fromChain, toChain]
  );

  const amountAvailable = useMemo(() => Number(amount) > 0, [amount]);

  const [openQuote, openQuoteRef] = useEventRef();

  const setVisible = useSetQuoteVisible();

  const refresh = useSetRefreshId();

  const { t } = useTranslation();

  const btnText = useMemo(() => {
    if (showExternalDappTips) {
      return t('component.externalSwapBrideDappPopup.bridgeOnDapp');
    }
    if (selectedBridgeQuote?.shouldApproveToken) {
      return isSwap ? 'Review & Swap' : 'Review & Bridge';
    }
    return isSwap ? 'Review & Swap' : 'Review & Bridge';
  }, [
    selectedBridgeQuote?.shouldApproveToken,
    showExternalDappTips,
    externalDapps,
    isSwap,
  ]);

  const rbiSource = useRbiSource();

  // const {
  //   pendingNumber,
  //   historyList,
  // } = usePollBridgePendingNumber();

  const [fetchingBridgeQuote, setFetchingBridgeQuote] = useState(false);

  const normalizeLogo = useCallback((logo: unknown): string => {
    if (!logo) {
      return '';
    }

    if (typeof logo === 'string') {
      return logo;
    }

    if (typeof logo === 'object') {
      const maybeLogo = logo as { default?: string; src?: string };
      return maybeLogo.default || maybeLogo.src || '';
    }

    return '';
  }, []);

  const resolveSwapLogo = useCallback(
    (
      dexName?: string,
      aggregatorLogo?: string,
      quoteProviderLogo?: string,
      aggregatorId?: string
    ) => {
      const providerLogo = normalizeLogo(quoteProviderLogo);
      if (providerLogo) {
        return providerLogo;
      }

      const aggLogo = normalizeLogo(aggregatorLogo);
      if (aggLogo) {
        return aggLogo;
      }

      if (!dexName) {
        const fromAggIdOnly = normalizeLogo(
          (DEX_WITH_WRAP as Record<string, { logo?: unknown }>)[
            aggregatorId || ''
          ]?.logo
        );
        return fromAggIdOnly;
      }

      const byKey = normalizeLogo(
        (DEX_WITH_WRAP as Record<string, { logo?: unknown }>)[dexName]?.logo
      );
      if (byKey) {
        return byKey;
      }

      const byAggregatorId = normalizeLogo(
        (DEX_WITH_WRAP as Record<string, { logo?: unknown }>)[
          aggregatorId || ''
        ]?.logo
      );
      if (byAggregatorId) {
        return byAggregatorId;
      }

      const lowerDexName = dexName.toLowerCase();
      const lowerAggregatorId = (aggregatorId || '').toLowerCase();

      const matchedDex = Object.values(
        DEX_WITH_WRAP as Record<string, { id?: string; name?: string; logo?: unknown }>
      ).find((dex) => {
        const dexId = (dex.id || '').toLowerCase();
        const dexLabel = (dex.name || '').toLowerCase();
        return (
          dexId === lowerDexName ||
          dexLabel === lowerDexName ||
          (lowerAggregatorId && (dexId === lowerAggregatorId || dexLabel === lowerAggregatorId))
        );
      });

      return normalizeLogo(matchedDex?.logo);
    },
    [normalizeLogo]
  );

  const routes = useMemo<RouteOption[]>(() => {
    return (quoteList || []).map((quote) => {
      const isSwapQuote = quote.type === 'swap';
      const id = isSwapQuote
        ? `${quote.aggregator?.id || 'unknown'}-${
            quote.dexQuote?.name || 'unknown'
          }`
        : `${quote.aggregator?.id || 'unknown'}-${
            quote.bridge_id || 'unknown'
          }`;

      const isBest =
        !!bestQuoteId &&
        bestQuoteId?.aggregatorId === quote.aggregator?.id &&
        (isSwapQuote
          ? bestQuoteId?.bridgeId === quote.dexQuote?.name
          : bestQuoteId?.bridgeId === quote.bridge_id);

      const outputAmount =
        toToken && quote.to_token_amount
          ? isSwapQuote
            ? new BigNumber(quote.to_token_amount)
                .div(10 ** toToken.decimals)
                .toString(10)
            : String(quote.to_token_amount)
          : undefined;

      const usdValue =
        outputAmount && toToken?.price
          ? formatUsdValue(
              new BigNumber(outputAmount).times(toToken.price).toNumber()
            )
          : undefined;

      return {
        id,
        name: isSwapQuote
          ? quote.dexQuote?.name ||
            (quote.aggregator as any)?.name ||
            'Unknown DEX'
          : (quote.aggregator as any)?.name || 'Unknown Bridge',
        logo: isSwapQuote
          ? resolveSwapLogo(
              quote.dexQuote?.name,
              quote.aggregator?.logo,
              (quote as any)?.dexQuote?.quoteProviderInfo?.logo ||
                (quote as any)?.quoteProviderInfo?.logo,
              quote.aggregator?.id
            )
          : quote.aggregator?.logo_url || '',
        fee:
          !isSwapQuote && quote.rabby_fee
            ? formatUsdValue(
                new BigNumber(quote.rabby_fee.usd_value || 0).toNumber()
              )
            : undefined,
        duration:
          !isSwapQuote && quote.duration ? String(quote.duration) : undefined,
        type: quote.type,
        isBest,
        outputAmount: outputAmount ? formatTokenAmount(outputAmount) : undefined,
        usdValue,
      };
    });
  }, [quoteList, bestQuoteId, toToken, resolveSwapLogo]);

  const selectedRouteId = useMemo(() => {
    if (!selectedBridgeQuote) return undefined;

    if (selectedBridgeQuote.type === 'swap') {
      return `${selectedBridgeQuote.aggregator?.id || 'unknown'}-${
        selectedBridgeQuote.dexQuote?.name || 'unknown'
      }`;
    }

    return `${selectedBridgeQuote.aggregator?.id || 'unknown'}-${
      selectedBridgeQuote.bridge_id || 'unknown'
    }`;
  }, [selectedBridgeQuote]);

  const handleSelectRoute = useCallback(
    (route: RouteOption) => {
      const nextQuote = quoteList?.find((quote) => {
        const isSwapQuote = quote.type === 'swap';
        const id = isSwapQuote
          ? `${quote.aggregator?.id || 'unknown'}-${
              quote.dexQuote?.name || 'unknown'
            }`
          : `${quote.aggregator?.id || 'unknown'}-${
              quote.bridge_id || 'unknown'
            }`;
        return id === route.id;
      });

      if (nextQuote) {
        setSelectedBridgeQuote(nextQuote);
      }
    },
    [quoteList, setSelectedBridgeQuote]
  );

  const gotoBridge = useCallback(async () => {
    if (!inSufficient && fromToken && toToken && selectedBridgeQuote) {
      try {
        setFetchingBridgeQuote(true);

        // Branch: Execute DEX swap for same-chain transactions
        if (selectedBridgeQuote.type === 'swap') {
          const swapQuote = selectedBridgeQuote;
          const dexQuote = swapQuote.dexQuote;

          if (!dexQuote.data || !fromChain) {
            throw new Error('Invalid swap quote data');
          }

          const promise = wallet.dexSwap(
            {
              swapPreferMEVGuarded: false,
              chain: fromChain,
              quote: dexQuote.data,
              needApprove: swapQuote.shouldApproveToken || false,
              spender: dexQuote.data.tx.to || '',
              pay_token_id: fromToken.id,
              unlimited: false,
              shouldTwoStepApprove: swapQuote.shouldTwoStepApprove || false,
              gasPrice: maxNativeTokenGasPrice,
              postSwapParams: {
                quote: {
                  pay_token_id: fromToken.id,
                  pay_token_amount: Number(amount),
                  receive_token_id: toToken.id,
                  receive_token_amount: new BigNumber(
                    dexQuote.data.toTokenAmount
                  )
                    .div(
                      10 ** (dexQuote.data.toTokenDecimals || toToken.decimals)
                    )
                    .toNumber(),
                  slippage: new BigNumber(slippage).div(100).toNumber(),
                },
                dex_id: dexQuote.name,
              },
              addHistoryData: {
                address: userAddress,
                chainId: findChain({ enum: fromChain })?.id || 0,
                fromToken: fromToken,
                toToken: toToken,
                fromAmount: Number(amount),
                toAmount: new BigNumber(dexQuote.data.toTokenAmount)
                  .div(
                    10 ** (dexQuote.data.toTokenDecimals || toToken.decimals)
                  )
                  .toNumber(),
                slippage: new BigNumber(slippage).div(100).toNumber(),
                dexId: dexQuote.name,
                status: 'pending',
                createdAt: Date.now(),
              },
            },
            {
              ga: {
                category: 'Swap',
                source: 'swap-bridge-same-chain',
                trigger: rbiSource,
              },
            }
          );

          if (!(isTab || isDesktop)) {
            window.close();
          } else {
            await promise;
            handleAmountChange('');
            setFetchingBridgeQuote(false);
          }
          return;
        }

        // Branch: Execute bridge transaction for cross-chain
        if (
          selectedBridgeQuote.type === 'bridge' &&
          selectedBridgeQuote.bridge_id
        ) {
          const bridgeQuote = selectedBridgeQuote;

          const tx = await pRetry(
            () =>
              wallet.openapi
                .buildBridgeTx({
                  aggregator_id: bridgeQuote.aggregator.id,
                  bridge_id: bridgeQuote.bridge_id,
                  from_token_id: fromToken.id,
                  user_addr: userAddress,
                  from_chain_id: fromToken.chain,
                  from_token_raw_amount: new BigNumber(amount)
                    .times(10 ** fromToken.decimals)
                    .toFixed(0, 1)
                    .toString(),
                  to_chain_id: toToken.chain,
                  to_token_id: toToken.id,
                  slippage: new BigNumber(slippageState).div(100).toString(10),
                  quote_key: JSON.stringify(bridgeQuote.quote_key || {}),
                })
                .catch((e) => {
                  throw new AbortError(e?.message || String(e));
                }),
            { retries: 1 }
          );

          stats.report('bridgeQuoteResult', {
            aggregatorIds: bridgeQuote.aggregator.id,
            bridgeId: bridgeQuote.bridge_id,
            fromChainId: fromToken.chain,
            fromTokenId: fromToken.id,
            toTokenId: toToken.id,
            toChainId: toToken.chain,
            status: tx ? 'success' : 'fail',
          });

          const promise = wallet.bridgeToken(
            {
              to: tx.to,
              value: tx.value,
              data: tx.data,
              payTokenRawAmount: new BigNumber(amount)
                .times(10 ** fromToken.decimals)
                .toFixed(0, 1)
                .toString(),
              chainId: tx.chainId,
              shouldApprove: !!bridgeQuote.shouldApproveToken,
              shouldTwoStepApprove: !!bridgeQuote.shouldTwoStepApprove,
              payTokenId: fromToken.id,
              payTokenChainServerId: fromToken.chain,
              gasPrice: maxNativeTokenGasPrice,
              info: {
                aggregator_id: bridgeQuote.aggregator.id,
                bridge_id: bridgeQuote.bridge_id,
                from_chain_id: fromToken.chain,
                from_token_id: fromToken.id,
                from_token_amount: amount,
                to_chain_id: toToken.chain,
                to_token_id: toToken.id,
                to_token_amount: bridgeQuote.to_token_amount,
                tx: tx,
                rabby_fee: bridgeQuote.rabby_fee.usd_value,
                slippage: new BigNumber(slippageState).div(100).toNumber(),
              },
              addHistoryData: {
                address: userAddress,
                fromChainId: findChain({ serverId: fromToken.chain })?.id || 0,
                toChainId: findChain({ serverId: toToken.chain })?.id || 0,
                fromToken: fromToken,
                estimatedDuration: bridgeQuote.duration,
                toToken: toToken,
                fromAmount: Number(amount),
                toAmount: Number(bridgeQuote.to_token_amount),
                slippage: new BigNumber(slippageState).div(100).toNumber(),
                dexId: bridgeQuote.aggregator.id,
                status: 'pending',
                createdAt: Date.now(),
              },
            },
            {
              ga: {
                category: 'Bridge',
                source: 'bridge',
                trigger: rbiSource,
              },
            }
          );

          if (!(isTab || isDesktop)) {
            window.close();
          } else {
            await promise;
            handleAmountChange('');
            setFetchingBridgeQuote(false);
          }
        }
      } catch (error) {
        setFetchingBridgeQuote(false);
        console.error(error);
      }
    }
  }, [
    inSufficient,
    fromToken,
    toToken,
    fromChain,
    selectedBridgeQuote,
    userAddress,
    amount,
    slippage,
    slippageState,
    wallet,
    maxNativeTokenGasPrice,
    rbiSource,
    isTab,
    isDesktop,
    handleAmountChange,
  ]);

  const buildTxs = useMemoizedFn(async () => {
    // Handle swap type (same-chain swap via DEX)
    if (
      selectedBridgeQuote &&
      selectedBridgeQuote.type === 'swap' &&
      !inSufficient &&
      fromToken &&
      toToken
    ) {
      const swapQuote = selectedBridgeQuote;
      const dexQuote = swapQuote.dexQuote;

      if (!dexQuote?.data || !fromChain) {
        throw new Error('Invalid swap quote data');
      }

      try {
        return await wallet.buildDexSwap(
          {
            swapPreferMEVGuarded: false,
            chain: fromChain,
            quote: dexQuote.data,
            needApprove: swapQuote.shouldApproveToken || false,
            spender: dexQuote.data.tx.to || '',
            pay_token_id: fromToken.id,
            unlimited: false,
            shouldTwoStepApprove: swapQuote.shouldTwoStepApprove || false,
            gasPrice: maxNativeTokenGasPrice,
            postSwapParams: {
              quote: {
                pay_token_id: fromToken.id,
                pay_token_amount: Number(amount),
                receive_token_id: toToken.id,
                receive_token_amount: new BigNumber(dexQuote.data.toTokenAmount)
                  .div(
                    10 ** (dexQuote.data.toTokenDecimals || toToken.decimals)
                  )
                  .toNumber(),
                slippage: new BigNumber(slippage).div(100).toNumber(),
              },
              dex_id: dexQuote.name,
            },
            addHistoryData: {
              address: userAddress,
              chainId: findChain({ enum: fromChain })?.id || 0,
              fromToken: fromToken,
              toToken: toToken,
              fromAmount: Number(amount),
              toAmount: new BigNumber(dexQuote.data.toTokenAmount)
                .div(10 ** (dexQuote.data.toTokenDecimals || toToken.decimals))
                .toNumber(),
              slippage: new BigNumber(slippage).div(100).toNumber(),
              dexId: dexQuote.name,
              status: 'pending',
              createdAt: Date.now(),
            },
          },
          {
            ga: {
              category: 'Swap',
              source: 'swap-bridge-same-chain',
              trigger: rbiSource,
            },
          }
        );
      } catch (error) {
        console.error('Error building dex swap:', error);
        throw error;
      }
    }

    // Handle bridge type (cross-chain bridge)
    if (
      !inSufficient &&
      fromToken &&
      toToken &&
      selectedBridgeQuote &&
      selectedBridgeQuote.type === 'bridge' &&
      selectedBridgeQuote.bridge_id
    ) {
      const bridgeQuote = selectedBridgeQuote;
      try {
        const tx = await pRetry(
          () =>
            wallet.openapi
              .buildBridgeTx({
                aggregator_id: bridgeQuote.aggregator.id,
                bridge_id: bridgeQuote.bridge_id,
                from_chain_id: fromToken.chain,
                from_token_id: fromToken.id,
                user_addr: userAddress,
                from_token_raw_amount: new BigNumber(amount)
                  .times(10 ** fromToken.decimals)
                  .toFixed(0, 1)
                  .toString(),
                to_chain_id: toToken.chain,
                to_token_id: toToken.id,
                slippage: new BigNumber(slippageState).div(100).toString(10),
                quote_key: JSON.stringify(bridgeQuote.quote_key || {}),
              })
              .catch((e) => {
                throw new AbortError(e?.message || String(e));
              }),
          { retries: 1 }
        );
        stats.report('bridgeQuoteResult', {
          aggregatorIds: bridgeQuote.aggregator.id,
          bridgeId: bridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: tx ? 'success' : 'fail',
        });
        return wallet.buildBridgeToken(
          {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            payTokenRawAmount: new BigNumber(amount)
              .times(10 ** fromToken.decimals)
              .toFixed(0, 1)
              .toString(),
            chainId: tx.chainId,
            shouldApprove: !!bridgeQuote.shouldApproveToken,
            shouldTwoStepApprove: !!bridgeQuote.shouldTwoStepApprove,
            payTokenId: fromToken.id,
            payTokenChainServerId: fromToken.chain,
            gasPrice: maxNativeTokenGasPrice,
            info: {
              aggregator_id: bridgeQuote.aggregator.id,
              bridge_id: bridgeQuote.bridge_id,
              from_chain_id: fromToken.chain,
              from_token_id: fromToken.id,
              from_token_amount: amount,
              to_chain_id: toToken.chain,
              to_token_id: toToken.id,
              to_token_amount: bridgeQuote.to_token_amount,
              tx: tx,
              rabby_fee: bridgeQuote.rabby_fee.usd_value,
              slippage: new BigNumber(slippage).div(100).toNumber(),
            },
            addHistoryData: {
              address: userAddress,
              fromChainId: findChain({ serverId: fromToken.chain })?.id || 0,
              toChainId: findChain({ serverId: toToken.chain })?.id || 0,
              fromToken: fromToken,
              toToken: toToken,
              estimatedDuration: bridgeQuote.duration,
              fromAmount: Number(amount),
              toAmount: Number(bridgeQuote.to_token_amount),
              slippage: new BigNumber(slippage).div(100).toNumber(),
              dexId: bridgeQuote.aggregator.id,
              status: 'pending',
              createdAt: Date.now(),
            },
          },
          {
            ga: {
              category: 'Bridge',
              source: 'bridge',
              trigger: rbiSource,
            },
          }
        );
      } catch (error) {
        setQuotesList((pre) =>
          pre?.filter(
            (item) =>
              !(
                item.type === 'bridge' &&
                item.aggregator?.id === bridgeQuote.aggregator?.id &&
                item.bridge_id === bridgeQuote.bridge_id
              )
          )
        );
        stats.report('bridgeQuoteResult', {
          aggregatorIds: bridgeQuote.aggregator.id,
          bridgeId: bridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: 'fail',
        });
        console.error(error);
        throw error;
      }
    }
  });

  const {
    data: txs,
    runAsync: runBuildSwapTxs,
    mutate: mutateTxs,
  } = useRequest(buildTxs, {
    manual: true,
  });

  const showLoss = useMemo(() => {
    // For swap quotes, to_token_amount is RAW and needs decimal adjustment
    // For bridge quotes, to_token_amount is already decimal-adjusted
    const toAmount =
      toToken && selectedBridgeQuote?.to_token_amount
        ? selectedBridgeQuote.type === 'swap'
          ? new BigNumber(selectedBridgeQuote.to_token_amount)
              .div(10 ** toToken.decimals)
              .toString(10)
          : String(selectedBridgeQuote.to_token_amount)
        : selectedBridgeQuote?.to_token_amount;

    const impact = tokenPriceImpact(fromToken, toToken, amount, toAmount);
    return !!impact?.showLoss;
  }, [
    fromToken,
    amount,
    selectedBridgeQuote?.to_token_amount,
    toToken,
    selectedBridgeQuote?.type,
  ]);

  const runBuildSwapTxsRef = useRef<
    ReturnType<typeof runBuildSwapTxs> | undefined
  >(undefined);

  const noQuote =
    inSufficientCanGetQuote &&
    !!fromToken &&
    !!toToken &&
    Number(amount) > 0 &&
    !quoteLoading &&
    !quoteList?.length;

  const btnDisabled =
    inSufficient ||
    !fromToken ||
    !toToken ||
    !amountAvailable ||
    !selectedBridgeQuote ||
    quoteLoading ||
    !quoteList?.length;

  const canUseDirectSubmitTx = useMemo(
    () => isSupportedChain && supportedDirectSign(currentAccount?.type || ''),

    [isSupportedChain, currentAccount?.type]
  );

  const noRiskSign =
    !toToken?.low_credit_score &&
    !toToken?.is_suspicious &&
    toToken?.is_verified !== false &&
    !isSlippageHigh &&
    !isSlippageLow &&
    !showLoss;

  const showRiskTips = isSlippageHigh || isSlippageLow || showLoss;

  const [miniSignLoading, setMiniSignLoading] = useState(false);

  const { openDirect, prefetch, close: closeSign } = useMiniSigner({
    account: currentAccount!,
    chainServerId: findChainByEnum(fromChain)?.serverId || '',
    autoResetGasStoreOnChainChange: true,
  });

  const handleBridge = useMemoizedFn(async () => {
    if (canUseDirectSubmitTx) {
      setMiniSignLoading(true);
      setFetchingBridgeQuote(true);
      try {
        const buildPromise = runBuildSwapTxsRef.current || runBuildSwapTxs();
        runBuildSwapTxsRef.current = buildPromise;
        const builtTxs = await buildPromise;
        setFetchingBridgeQuote(false);
        if (!builtTxs?.length) {
          throw MINI_SIGN_ERROR.PREFETCH_FAILURE;
        }
        clearExpiredTimer();
        await openDirect({
          txs: builtTxs,
          getContainer,
          ga: {
            category: 'Bridge',
            source: 'bridge',
            trigger: rbiSource,
          },
          onPreExecError: () => {
            gotoBridge();
          },
        });
        mutateTxs([]);
        handleAmountChange('');
      } catch (error) {
        setFetchingBridgeQuote(false);
        if (error == MINI_SIGN_ERROR.USER_CANCELLED) {
          refresh((e) => e + 1);
          mutateTxs([]);
        } else if (error === MINI_SIGN_ERROR.CANT_PROCESS) {
          setTimeout(() => {
            refresh((e) => e + 1);
          }, 10 * 1000);
        } else {
          gotoBridge();
        }
        console.error('bridge direct sign error', error);
      } finally {
        setMiniSignLoading(false);
      }
    } else {
      gotoBridge();
    }
  });

  const history = useHistory();

  useEffect(() => {
    if (!btnDisabled && selectedBridgeQuote) {
      mutateTxs([]);
      runBuildSwapTxsRef.current = runBuildSwapTxs();
    }
  }, [canUseDirectSubmitTx, btnDisabled, selectedBridgeQuote]);

  useEffect(() => {
    if (!canUseDirectSubmitTx) return;
    closeSign();
    prefetch({
      txs: txs || [],
      getContainer,
      ga: {
        category: 'Bridge',
        source: 'bridge',
        trigger: rbiSource,
      },
    });
  }, [closeSign, prefetch, txs, canUseDirectSubmitTx, rbiSource]);

  const feePopupVisible = useSettingVisible();
  const switchFeePopup = useSetSettingVisible();

  const openFeePopup = useCallback(() => {
    switchFeePopup(true);
  }, [switchFeePopup]);

  const closeFeePopup = useCallback(() => {
    switchFeePopup(false);
  }, [switchFeePopup]);

  const openInfoSheet = useCallback(() => {
    setInfoSheetOpen(true);
  }, []);

  const closeInfoSheet = useCallback(() => {
    setInfoSheetOpen(false);
  }, []);

  const isFromNativeToken = useMemo(() => {
    if (!fromToken || !fromChain) return false;
    const chainInfo = findChainByEnum(fromChain);
    if (!chainInfo?.nativeTokenAddress) return false;
    return isSameAddress(fromToken.id, chainInfo.nativeTokenAddress);
  }, [fromToken, fromChain]);

  const handleMaxFromToken = useCallback(async () => {
    if (!fromToken || !fromChain) return;

    const chainInfo = findChainByEnum(fromChain);
    if (!chainInfo?.serverId) return;

    if (!isFromNativeToken) {
      isSettingMaxRef.current = true;
      setMaxNativeTokenGasPrice(undefined);
      handleAmountChange(tokenAmountBn(fromToken).toString(10));
      return;
    }

    try {
      const gasList = await wallet.gasMarketV2({
        chainId: chainInfo.serverId,
      });
      const normalPrice = gasList?.find((e) => e.level === 'normal')?.price;
      const gasLimit = fromChain === CHAINS_ENUM.ETH ? 1000000 : 2000000;
      const nativeTokenDecimals = chainInfo.nativeTokenDecimals || 18;

      if (
        normalPrice &&
        new BigNumber(fromToken.raw_amount_hex_str || 0, 16).gte(
          new BigNumber(gasLimit).times(normalPrice)
        )
      ) {
        const val = tokenAmountBn(fromToken).minus(
          new BigNumber(gasLimit)
            .times(normalPrice)
            .div(10 ** nativeTokenDecimals)
        );

        if (!val.lt(0)) {
          // Apply formatting to avoid long decimal strings
          const isTooSmall = val.lt(0.0001);
          const formattedVal = isTooSmall
            ? val.toString(10)
            : new BigNumber(val.toFixed(4, 1)).toString(10);

          isSettingMaxRef.current = true;
          handleAmountChange(formattedVal);
          setMaxNativeTokenGasPrice(normalPrice);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch gas for max:', error);
    }

    // Fallback: use full balance if gas unavailable or result would be negative
    isSettingMaxRef.current = true;
    setMaxNativeTokenGasPrice(undefined);
    handleAmountChange(tokenAmountBn(fromToken).toString(10));
  }, [
    fromToken,
    fromChain,
    wallet,
    isFromNativeToken,
    handleAmountChange,
    setMaxNativeTokenGasPrice,
  ]);

  // Store filtered chains for use in child components
  const fromChainProps = useMemo(
    () => ({
      supportedChains: supportedFromChains,
    }),
    [supportedFromChains]
  );
  return (
    <UIContainer>
      <Container>
         <HeaderNavPage
          handleBack={() =>
            history.goBack() 
          }
        >
          <div className="text-primary-foreground text-xl font-medium">
          Exchange
          </div>
        </HeaderNavPage>
        <Content>
          {/* Asset Input Section */}
          <div className="flex flex-col bg-[#FAFAFA] min-h-[240px] max-h-[240px] border rounded-[18px] p-1">
            <AssetInput
              variant="source"
              assetTitle="From Token"
              value={{ amount: amount, currency: fromToken, chain: fromChain }}
              onChange={(value) => {
                if (value.amount !== undefined) {
                  if (isSettingMaxRef.current) {
                    isSettingMaxRef.current = false;
                  } else {
                    setMaxNativeTokenGasPrice(undefined);
                  }
                  handleAmountChange(value.amount);
                }
                if (value.currency) setFromToken(value.currency);
                if (value.chain) switchFromChain(value.chain);
              }}
              onChainChange={switchFromChain}
              onTokenChange={setFromToken}
              selectionType="from"
              showMax
              onMax={handleMaxFromToken}
              maxAmount={
                fromToken
                  ? new BigNumber(fromToken.raw_amount_hex_str || 0, 16)
                      .div(10 ** (fromToken.decimals || 18))
                      .toString(10)
                  : '0'
              }
            />
            <AssetInput
              assetTitle="To Token"
              variant="destination"
              readOnly
              value={{
                amount:
                  toToken && selectedBridgeQuote?.to_token_amount
                    ? selectedBridgeQuote.type === 'swap'
                      ? // For swap quotes: toTokenAmount is RAW, needs decimal division
                        new BigNumber(selectedBridgeQuote.to_token_amount)
                          .div(10 ** toToken.decimals)
                          .toString(10)
                      : // For bridge quotes: to_token_amount is already decimal-adjusted
                        String(selectedBridgeQuote.to_token_amount)
                    : String(selectedBridgeQuote?.to_token_amount || ''),
                currency: toToken,
                chain: toChain,
              }}
              onChange={(value) => {
                if (value.currency) setToToken(value.currency);
                if (value.chain) setToChain(value.chain);
              }}
              onChainChange={setToChain}
              onTokenChange={setToToken}
              selectionType="to"
              fromChain={fromChain}
              fromToken={fromToken}
            />
          </div>

          {!inSufficientCanGetQuote || (noQuote && !recommendFromToken) ? (
            <span
                  className={clsx(
                    'text-sm font-medium',
                    'text-rabby-red-default'
                  )}
                >
                  {!inSufficientCanGetQuote
                    ? t('page.bridge.insufficient-balance')
                    : t('page.bridge.no-quote-found')}
                </span>) : null}

          {/* Bridge Info Summary & Quote Details */}
          

          {routes.length ? (
            <div className="mt-4">
              <RouteSelectorModal
                routes={routes}
                value={selectedRouteId}
                onChange={handleSelectRoute}
                disabled={routes.length <= 1}
                toToken={toToken}
                toAmount={
                  toToken && selectedBridgeQuote?.to_token_amount
                    ? selectedBridgeQuote.type === 'swap'
                      ? new BigNumber(selectedBridgeQuote.to_token_amount)
                          .div(10 ** toToken.decimals)
                          .toString(10)
                      : String(selectedBridgeQuote.to_token_amount)
                    : '0'
                }
              />
            </div>
          ) : null}
          {selectedBridgeQuote && (
            <>
              <div className="mt-4">
                <BridgeInfoSummary
                  sourceName={
                    selectedBridgeQuote.type === 'bridge'
                      ? selectedBridgeQuote.aggregator.name || ''
                      : selectedBridgeQuote.dexQuote.name || ''
                  }
                  sourceLogo={
                    selectedBridgeQuote.type === 'bridge'
                      ? selectedBridgeQuote.aggregator.logo_url || ''
                      : resolveSwapLogo(
                          selectedBridgeQuote.dexQuote?.name,
                          selectedBridgeQuote.aggregator.logo,
                          (selectedBridgeQuote as any)?.dexQuote
                            ?.quoteProviderInfo?.logo ||
                            (selectedBridgeQuote as any)?.quoteProviderInfo
                              ?.logo,
                          selectedBridgeQuote.aggregator?.id
                        )
                  }
                  duration={
                    selectedBridgeQuote.type === 'bridge'
                      ? selectedBridgeQuote.duration || 0
                      : 0
                  }
                  type={selectedBridgeQuote.type === 'swap' ? 'swap' : 'bridge'}
                  isBestQuote={
                    !!bestQuoteId &&
                    !!selectedBridgeQuote &&
                    bestQuoteId?.aggregatorId ===
                      selectedBridgeQuote.aggregator.id &&
                    (selectedBridgeQuote.type === 'bridge'
                      ? bestQuoteId?.bridgeId === selectedBridgeQuote.bridge_id
                      : bestQuoteId?.bridgeId ===
                        selectedBridgeQuote.dexQuote.name)
                  }
                  quoteLoading={quoteLoading}
                  openQuotesList={openQuote}
                  onOpenInfo={openInfoSheet}
                  fromToken={fromToken}
                  toToken={toToken}
                  amount={amount || 0}
                  toAmount={selectedBridgeQuote?.to_token_amount}
                />
              </div>
              <BridgeInlineWarnings
                fromToken={fromToken}
                toToken={toToken}
                amount={amount || 0}
                toAmount={selectedBridgeQuote?.to_token_amount}
                quoteLoading={quoteLoading}
                slippageError={isSlippageHigh || isSlippageLow}
                supportDirectSign={canUseDirectSubmitTx}
                chainServeId={fromToken?.chain}
              />
            </>
          )}
          {!selectedBridgeQuote && !recommendFromToken && (
            <div className="mt-20 mx-20">
              {isSwap ? <PendingTxItem type="swap" /> : <BridgePendingTxItem />}
            </div>
          )}

          {/* Recommend From Token */}
          {noQuote && recommendFromToken && (
            <div className="mt-4">
              <RecommendFromToken
                token={recommendFromToken}
                onOk={fillRecommendFromToken}
              />
            </div>
          )}
        </Content>

        {/* Action Buttons */}
        <Action className='flex flex-col gap-2'>
          {fromToken && canUseDirectSubmitTx ? (
            <DirectSignGasInfo
              supportDirectSign={canUseDirectSubmitTx}
              loading={!!quoteLoading}
              openShowMore={() => {}}
              noQuote={noQuote}
              chainServeId={fromToken.chain}
            />
          ) : null}
          
          {selectedBridgeQuote && (fromChain as string) !== 'DBK' && (
            <Button
              onClick={() => {
                if (fetchingBridgeQuote) return;
                if (!selectedBridgeQuote) {
                  refresh((e) => e + 1);
                  return;
                }
                setReviewModalOpen(true);
              }}
              disabled={btnDisabled}
            >
              {selectedBridgeQuote.type === 'swap'
                ? 'Review & Swap'
                : 'Review & Bridge'}
            </Button>
          )}
          {(fromChain as string) === 'DBK' && (
            <DbkButton
              className="h-[48px] w-full text-[16px] font-medium bg-r-orange-DBK border-transparent rounded-[6px]"
              onClick={() => {
                history.push(
                  `/ecology/${DBK_CHAIN_ID}/bridge?activeTab=withdraw`
                );
              }}
            >
          {selectedBridgeQuote?.type === 'swap'? 'Review & Swap' : 'Review & Bridge'}
            </DbkButton>
          )}
        </Action>
      </Container>

      <RabbyFeePopup
        type="bridge"
        visible={feePopupVisible}
        onClose={closeFeePopup}
      />

      <QuoteList
        list={quoteList}
        loading={quoteLoading}
        actionRef={openQuoteRef}
        onClose={() => {
          setVisible(false);
        }}
        userAddress={userAddress}
        payToken={fromToken}
        payAmount={amount}
        receiveToken={toToken}
        inSufficient={inSufficient}
        setSelectedBridgeQuote={setSelectedBridgeQuote}
      />

      <BottomFloatingSheet
        contentClassName="px-4 py-4"
        open={infoSheetOpen}
        hideCloseButton
        onClose={closeInfoSheet}
        header={<div className="flex justify-between items-center w-full min-h-7">
                    <div className="font-medium text-primary-foreground text-base leading-7 text-center">
                    Your Order
                    </div>
                    <button
                      type="button"
                      className="flex items-center justify-end cursor-pointer"
                      onClick={() => closeInfoSheet()}
                      aria-label="Close rename wallet modal"
                    >
                      <X size={16} />
                    </button>
                  </div>} >
        {selectedBridgeQuote && (
          <BridgeShowMore
            supportDirectSign={canUseDirectSubmitTx}
            openFeePopup={openFeePopup}
            open
            setOpen={() => {}}
            showHeader={false}
            selectedQuote={selectedBridgeQuote}
            sourceName={
              selectedBridgeQuote.type === 'bridge'
                ? selectedBridgeQuote.aggregator.name || ''
                : selectedBridgeQuote.dexQuote.name || ''
            }
            sourceLogo={
              selectedBridgeQuote.type === 'bridge'
                ? selectedBridgeQuote.aggregator.logo_url || ''
                : resolveSwapLogo(
                    selectedBridgeQuote.dexQuote?.name,
                      selectedBridgeQuote.aggregator.logo,
                      (selectedBridgeQuote as any)?.dexQuote?.quoteProviderInfo
                        ?.logo ||
                      (selectedBridgeQuote as any)?.quoteProviderInfo?.logo,
                    selectedBridgeQuote.aggregator?.id
                  )
            }
            duration={
              selectedBridgeQuote.type === 'bridge'
                ? selectedBridgeQuote.duration || 0
                : 0
            }
            slippage={slippageState}
            displaySlippage={slippage}
            onSlippageChange={(e) => {
              setSlippageChanged(true);
              setSlippage(e);
            }}
            fromToken={fromToken}
            toToken={toToken}
            amount={amount || 0}
            toAmount={selectedBridgeQuote?.to_token_amount}
            openQuotesList={openQuote}
            quoteLoading={quoteLoading}
            slippageError={isSlippageHigh || isSlippageLow}
            autoSlippage={autoSlippage}
            isCustomSlippage={isCustomSlippage}
            setAutoSlippage={setAutoSlippage}
            setIsCustomSlippage={setIsCustomSlippage}
            type={selectedBridgeQuote.type === 'swap' ? 'swap' : 'bridge'}
            isBestQuote={
              !!bestQuoteId &&
              !!selectedBridgeQuote &&
              bestQuoteId?.aggregatorId ===
                selectedBridgeQuote.aggregator.id &&
              (selectedBridgeQuote.type === 'bridge'
                ? bestQuoteId?.bridgeId === selectedBridgeQuote.bridge_id
                : bestQuoteId?.bridgeId ===
                  selectedBridgeQuote.dexQuote.name)
            }
          />
        )}
      </BottomFloatingSheet>

      {/* Review Swap/Bridge Modal */}
      <BottomFloatingSheet
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        hideCloseButton
        header={<div className="flex justify-between items-center w-full min-h-7">
                    <div className="font-medium text-primary-foreground text-base leading-7 text-center">
                    Review Your Order
                    </div>
                    <button
                      type="button"
                      className="flex items-center justify-end cursor-pointer"
                      onClick={() => setReviewModalOpen(false)}
                      aria-label="Close review modal"
                    >
                      <X size={16} />
                    </button>
                  </div>}

      >
        {selectedBridgeQuote && fromToken && toToken && (
          <ReviewSwapBridge

            fromToken={fromToken}
            toToken={toToken}
            fromAmount={amount}
            toAmount={
              selectedBridgeQuote.type === 'swap'
                ? new BigNumber(selectedBridgeQuote.to_token_amount)
                    .div(10 ** toToken.decimals)
                    .toString(10)
                : String(selectedBridgeQuote.to_token_amount)
            }
            fromPrice={fromToken.price}
            toPrice={toToken.price}
            selectedQuote={selectedBridgeQuote}
            loading={fetchingBridgeQuote || miniSignLoading}
            onConfirm={() => {
              if (!canUseDirectSubmitTx) {
                setReviewModalOpen(false);
              }
              handleBridge();
            }}
            type={selectedBridgeQuote.type === 'swap' ? 'swap' : 'bridge'}
            btnText={btnText}
            btnDisabled={btnDisabled}
            showRiskTips={showRiskTips && !btnDisabled}
            accountType={currentAccount?.type}
            riskReset={btnDisabled}
            canUseDirectSubmitTx={canUseDirectSubmitTx}
            isSupportedChain={isSupportedChain}
            fromChain={fromChain}
            toChain={toChain}
            rabbyFeeDisplay={
              selectedBridgeQuote.type === 'bridge' &&
              (selectedBridgeQuote as any).rabby_fee
                ? formatUsdValue(
                    new BigNumber(
                      (selectedBridgeQuote as any).rabby_fee.usd_value || 0
                    ).toNumber()
                  )
                : '$0'
            }
            networkFeeDisplay={
              maxNativeTokenGasPrice
                ? '$' + maxNativeTokenGasPrice
                : 'calculating...'
            }
            estimatedTimeDisplay={
              selectedBridgeQuote.type === 'bridge' &&
              (selectedBridgeQuote as any).duration
                ? String((selectedBridgeQuote as any).duration)
                : undefined
            }
          />
        )}
      </BottomFloatingSheet>
    </UIContainer>
  );
};

export default SwapAndBridgeContainer;
