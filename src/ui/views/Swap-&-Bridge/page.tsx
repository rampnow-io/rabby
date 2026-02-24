import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import { getUiType } from 'ui/utils';
import { Button } from '@repo/ui/primitives';
import AssetInput from './components/asset-input';
import {
  tokenPriceImpact,
  useBridge,
  useQuoteVisible,
  useSetQuoteVisible,
  useSetRefreshId,
  useSetSettingVisible,
} from './hooks';
import { useCss } from 'react-use';
import { useHistory } from 'react-router-dom';
import { useRabbySelector } from '@/ui/store';
import { CHAINS_ENUM } from '@/types/chain';
import { useExternalSwapBridgeDapps } from '@/ui/component/ExternalSwapBridgeDappPopup/hooks';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/ui/utils';
import { useRbiSource } from '@/ui/utils/ga-event';
import pRetry, { AbortError } from 'p-retry';
import stats from '@/stats';
import { findChain, findChainByEnum } from '@/utils/chain';
import { useMemoizedFn, useRequest } from 'ahooks';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { supportedDirectSign } from '@/ui/hooks/useMiniApprovalDirectSign';
import { useMiniSigner } from '@/ui/hooks/useSigner';
import { MINI_SIGN_ERROR } from '@/ui/component/MiniSignV2/state/SignatureManager';
import { Bridge } from '../Bridge';

const isTab = getUiType().isTab;
const isDesktop = getUiType().isDesktop;

const getContainer = isTab
  ? '.js-rabby-popup-container'
  : isDesktop
  ? '.js-rabby-desktop-swap-container'
  : undefined;

const SwapAndBridgeContainer = () => {
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

    openQuotesList,
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

  const visible = useQuoteVisible();

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

  const wallet = useWallet();
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

  const currentAccount = useCurrentAccount();

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

  const twoStepApproveCn = useCss({
    '& .ant-modal-content': {
      background: '#fff',
    },
    '& .ant-modal-body': {
      padding: '12px 8px 32px 16px',
    },
    '& .ant-modal-confirm-content': {
      padding: '4px 0 0 0',
    },
    '& .ant-modal-confirm-btns': {
      justifyContent: 'center',
      '.ant-btn-primary': {
        width: '260px',
        height: '40px',
      },
      'button:first-child': {
        display: 'none',
      },
    },
  });

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

  const [showMoreOpen, setShowMoreOpen] = useState(false);

  const switchFeePopup = useSetSettingVisible();

  const openFeePopup = useCallback(() => {
    switchFeePopup(true);
  }, [switchFeePopup]);
  return (
    <UIContainer>
      <Container>
        <div className="text-primary-foreground text-center text-xl font-normal p-6">
          Swap & Bridge
        </div>
        <Content>
          <div className="flex flex-col bg-[#FAFAFA] min-h-[240px] max-h-[240px] border rounded-[18px] p-1">
            <AssetInput
              variant="source"
              assetTitle="From Token"
              value={{ amount: amount, currency: fromToken, chain: fromChain }}
              onChange={(value) => {
                if (value.amount !== undefined)
                  handleAmountChange(value.amount);
                if (value.currency) setFromToken(value.currency);
                if (value.chain) switchFromChain(value.chain);
              }}
              onChainChange={switchFromChain}
              onTokenChange={setFromToken}
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
            />
          </div>
        </Content>
        <Action>
          <Button>Review</Button>
        </Action>
      </Container>
    </UIContainer>
  );
};

export default SwapAndBridgeContainer;
