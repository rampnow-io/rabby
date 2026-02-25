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

import { RabbyFeePopup } from '../Swap/Component/RabbyFeePopup';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { useCss, useAsync } from 'react-use';
import { useHistory } from 'react-router-dom';
import { useRabbySelector } from '@/ui/store';
import { CHAINS_ENUM } from '@/types/chain';
import { useExternalSwapBridgeDapps } from '@/ui/component/ExternalSwapBridgeDappPopup/hooks';
import { useTranslation } from 'react-i18next';
import { isSameAddress, useWallet } from '@/ui/utils';
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
import { DBK_CHAIN_ID } from '@/constant';

import { Alert } from 'antd';
import {
  BridgeShowMore,
  RecommendFromToken,
} from './components/bridge/BridgeShowMore';
import { BridgePendingTxItem } from './components/bridge/PendingTxItem';
import { QuoteList } from './components/bridge/BridgeQuotes';

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
  } = useBridge();

  const [historyVisible, setHistoryVisible] = useState(false);
  const [showMoreOpen, setShowMoreOpen] = useState(false);
  const [showTwoStepApproveModal, setShowTwoStepApproveModal] = useState(false);
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
      return t('page.bridge.approve-and-bridge');
    }
    return t('page.bridge.title');
  }, [
    selectedBridgeQuote?.shouldApproveToken,
    showExternalDappTips,
    externalDapps,
  ]);

  const rbiSource = useRbiSource();

  // const {
  //   pendingNumber,
  //   historyList,
  // } = usePollBridgePendingNumber();

  const [fetchingBridgeQuote, setFetchingBridgeQuote] = useState(false);

  const gotoBridge = useCallback(async () => {
    if (
      !inSufficient &&
      fromToken &&
      toToken &&
      selectedBridgeQuote?.bridge_id
    ) {
      try {
        setFetchingBridgeQuote(true);
        const tx = await pRetry(
          () =>
            wallet.openapi
              .buildBridgeTx({
                aggregator_id: selectedBridgeQuote.aggregator.id,
                bridge_id: selectedBridgeQuote.bridge_id,
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
                quote_key: JSON.stringify(selectedBridgeQuote.quote_key || {}),
              })
              .catch((e) => {
                throw new AbortError(e?.message || String(e));
              }),
          { retries: 1 }
        );
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
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
            shouldApprove: !!selectedBridgeQuote.shouldApproveToken,
            shouldTwoStepApprove: !!selectedBridgeQuote.shouldTwoStepApprove,
            payTokenId: fromToken.id,
            payTokenChainServerId: fromToken.chain,
            gasPrice: maxNativeTokenGasPrice,
            info: {
              aggregator_id: selectedBridgeQuote.aggregator.id,
              bridge_id: selectedBridgeQuote.bridge_id,
              from_chain_id: fromToken.chain,
              from_token_id: fromToken.id,
              from_token_amount: amount,
              to_chain_id: toToken.chain,
              to_token_id: toToken.id,
              to_token_amount: selectedBridgeQuote.to_token_amount,
              tx: tx,
              rabby_fee: selectedBridgeQuote.rabby_fee.usd_value,
              slippage: new BigNumber(slippage).div(100).toNumber(),
            },
            addHistoryData: {
              address: userAddress,
              fromChainId: findChain({ serverId: fromToken.chain })?.id || 0,
              toChainId: findChain({ serverId: toToken.chain })?.id || 0,
              fromToken: fromToken,
              estimatedDuration: selectedBridgeQuote.duration,
              toToken: toToken,
              fromAmount: Number(amount),
              toAmount: Number(selectedBridgeQuote.to_token_amount),
              slippage: new BigNumber(slippage).div(100).toNumber(),
              dexId: selectedBridgeQuote.aggregator.id,
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
        }
      } catch (error) {
        setQuotesList((pre) =>
          pre?.filter(
            (item) =>
              !(
                item?.aggregator?.id === selectedBridgeQuote?.aggregator?.id &&
                item?.bridge_id === selectedBridgeQuote?.bridge_id
              )
          )
        );
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: 'fail',
        });
        console.error(error);
      } finally {
        setFetchingBridgeQuote(false);
      }
    }
  }, [
    inSufficient,
    fromToken,
    toToken,
    selectedBridgeQuote?.tx,
    selectedBridgeQuote?.shouldApproveToken,
    selectedBridgeQuote?.shouldTwoStepApprove,
    selectedBridgeQuote?.aggregator.id,
    selectedBridgeQuote?.bridge_id,
    selectedBridgeQuote?.to_token_amount,
    wallet,
    amount,
    rbiSource,
    slippageState,
    maxNativeTokenGasPrice,
  ]);

  const buildTxs = useMemoizedFn(async () => {
    if (
      !inSufficient &&
      fromToken &&
      toToken &&
      selectedBridgeQuote?.bridge_id
    ) {
      try {
        // setFetchingBridgeQuote(true);
        const tx = await pRetry(
          () =>
            wallet.openapi
              .buildBridgeTx({
                aggregator_id: selectedBridgeQuote.aggregator.id,
                bridge_id: selectedBridgeQuote.bridge_id,
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
                quote_key: JSON.stringify(selectedBridgeQuote.quote_key || {}),
              })
              .catch((e) => {
                throw new AbortError(e?.message || String(e));
              }),
          { retries: 1 }
        );
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
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
            shouldApprove: !!selectedBridgeQuote.shouldApproveToken,
            shouldTwoStepApprove: !!selectedBridgeQuote.shouldTwoStepApprove,
            payTokenId: fromToken.id,
            payTokenChainServerId: fromToken.chain,
            gasPrice: maxNativeTokenGasPrice,
            info: {
              aggregator_id: selectedBridgeQuote.aggregator.id,
              bridge_id: selectedBridgeQuote.bridge_id,
              from_chain_id: fromToken.chain,
              from_token_id: fromToken.id,
              from_token_amount: amount,
              to_chain_id: toToken.chain,
              to_token_id: toToken.id,
              to_token_amount: selectedBridgeQuote.to_token_amount,
              tx: tx,
              rabby_fee: selectedBridgeQuote.rabby_fee.usd_value,
              slippage: new BigNumber(slippage).div(100).toNumber(),
            },
            addHistoryData: {
              address: userAddress,
              fromChainId: findChain({ serverId: fromToken.chain })?.id || 0,
              toChainId: findChain({ serverId: toToken.chain })?.id || 0,
              fromToken: fromToken,
              toToken: toToken,
              estimatedDuration: selectedBridgeQuote.duration,
              fromAmount: Number(amount),
              toAmount: Number(selectedBridgeQuote.to_token_amount),
              slippage: new BigNumber(slippage).div(100).toNumber(),
              dexId: selectedBridgeQuote.aggregator.id,
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
                item?.aggregator?.id === selectedBridgeQuote?.aggregator?.id &&
                item?.bridge_id === selectedBridgeQuote?.bridge_id
              )
          )
        );
        // message.error(error?.message || String(error));
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: 'fail',
        });
        console.error(error);
      } finally {
        // setFetchingBridgeQuote(false);
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
    const impact = tokenPriceImpact(
      fromToken,
      toToken,
      amount,
      selectedBridgeQuote?.to_token_amount
    );
    return !!impact?.showLoss;
  }, [fromToken, amount, selectedBridgeQuote?.to_token_amount, toToken]);

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

      if (
        normalPrice &&
        new BigNumber(fromToken.raw_amount_hex_str || 0, 16).gte(
          new BigNumber(gasLimit).times(normalPrice)
        )
      ) {
        const val = tokenAmountBn(fromToken).minus(
          new BigNumber(gasLimit)
            .times(normalPrice)
            .div(10 ** (chainInfo.nativeTokenDecimals || 1e18))
        );
        isSettingMaxRef.current = true;
        handleAmountChange(val.toString(10));
        setMaxNativeTokenGasPrice(normalPrice);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch gas for max:', error);
    }

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
        <div className="text-primary-foreground text-center text-xl font-normal p-6">
          Swap & Bridge
        </div>
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
            />
            <AssetInput
              assetTitle="To Token"
              variant="destination"
              readOnly
              value={{
                amount: String(selectedBridgeQuote?.to_token_amount || ''),
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
            <Alert
              className={clsx(
                'mx-[20px] rounded-[4px] px-0 py-[3px] bg-transparent mt-6'
              )}
              icon={
                <RcIconWarningCC
                  viewBox="0 0 16 16"
                  className={clsx(
                    'relative top-[3px] mr-2 self-start origin-center w-16 h-15',
                    'text-rabby-red-default'
                  )}
                />
              }
              banner
              message={
                <span
                  className={clsx(
                    'text-13 font-medium',
                    'text-rabby-red-default'
                  )}
                >
                  {!inSufficientCanGetQuote
                    ? t('page.bridge.insufficient-balance')
                    : t('page.bridge.no-quote-found')}
                </span>
              }
            />
          ) : null}

          {/* Bridge Show More & Quote Details */}
          {selectedBridgeQuote && (
            <div className="mt-4">
              <BridgeShowMore
                supportDirectSign={canUseDirectSubmitTx}
                openFeePopup={openFeePopup}
                open={showMoreOpen}
                setOpen={setShowMoreOpen}
                sourceName={selectedBridgeQuote?.aggregator.name || ''}
                sourceLogo={selectedBridgeQuote?.aggregator.logo_url || ''}
                duration={selectedBridgeQuote?.duration || 0}
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
                type="bridge"
                isBestQuote={
                  !!bestQuoteId &&
                  !!selectedBridgeQuote &&
                  bestQuoteId?.aggregatorId ===
                    selectedBridgeQuote.aggregator.id &&
                  bestQuoteId?.bridgeId === selectedBridgeQuote.bridge_id
                }
              />
            </div>
          )}
          {!selectedBridgeQuote && !recommendFromToken && (
            <div className="mt-20 mx-20">
              <BridgePendingTxItem />
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
        <Action>
          <div>
            {(fromChain as string) === 'DBK' ? (
              <DbkButton
                className="h-[48px] w-full text-[16px] font-medium bg-r-orange-DBK border-transparent rounded-[6px]"
                onClick={() => {
                  history.push(
                    `/ecology/${DBK_CHAIN_ID}/bridge?activeTab=withdraw`
                  );
                }}
              >
                {t('page.bridge.bridgeDbkBtn')}
              </DbkButton>
            ) : (
              <>
                {canUseDirectSubmitTx &&
                currentAccount?.type &&
                isSupportedChain ? (
                  <DirectSignToConfirmBtn
                    disabled={btnDisabled}
                    title={btnText}
                    onConfirm={handleBridge}
                    showRiskTips={showRiskTips && !btnDisabled}
                    accountType={currentAccount?.type}
                    riskReset={btnDisabled}
                    loading={miniSignLoading}
                    buttonClassName="h-[56px] rounded-full bg-[#B6E632] text-black text-lg font-semibold hover:bg-[#A5D32E] transition-colors"
                  />
                ) : (
                  <Button
                    className="h-[56px] rounded-full bg-[#B6E632] text-black text-lg font-semibold hover:bg-[#A5D32E] transition-colors"
                    onClick={() => {
                      if (showExternalDappTips && externalDapps.length > 0) {
                        setExternalDappOpen(true);
                        return;
                      }
                      if (fetchingBridgeQuote) return;
                      if (!selectedBridgeQuote) {
                        refresh((e) => e + 1);

                        return;
                      }
                      if (selectedBridgeQuote?.shouldTwoStepApprove) {
                        setShowTwoStepApproveModal(true);
                        return;
                      }
                      // gotoBridge();
                      handleBridge();
                    }}
                    disabled={
                      !isSupportedChain && externalDapps.length > 0
                        ? false
                        : canUseDirectSubmitTx
                        ? btnDisabled
                        : btnDisabled
                    }
                  >
                    {btnText}
                  </Button>
                )}
              </>
            )}
          </div>
        </Action>
      </Container>

      <RabbyFeePopup
        type="bridge"
        visible={feePopupVisible}
        onClose={closeFeePopup}
      />

      <BottomFloatingSheet
        open={showTwoStepApproveModal}
        onClose={() => setShowTwoStepApproveModal(false)}
      >
        <div className="px-16 pb-16">
          <div className="text-16 font-medium text-r-neutral-title-1 mb-18 text-center">
            Sign 2 transactions to change allowance
          </div>
          <div className="text-13 leading-[17px] text-r-neutral-body mb-20">
            Token {fromToken?.symbol || 'token'} requires 2 transactions to
            change allowance. First you would need to reset allowance to zero,
            and only then set new allowance value.
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 h-48 text-14 font-medium"
              onClick={() => setShowTwoStepApproveModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowTwoStepApproveModal(false);
                handleBridge();
              }}
            >
              Proceed with two step approve
            </Button>
          </div>
        </div>
      </BottomFloatingSheet>
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
    </UIContainer>
  );
};

export default SwapAndBridgeContainer;
