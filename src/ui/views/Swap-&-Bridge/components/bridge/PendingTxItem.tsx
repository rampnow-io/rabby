import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { HypermidBridgeHistoryItem } from '../../api';
import { fetchBridgeHistoryList, fetchDepositStatus } from '../../api';
import { useTranslation } from 'react-i18next';
import { useInterval, useMemoizedFn } from 'ahooks';
import clsx from 'clsx';
import { findChain } from '@/utils/chain';
import { formatTokenAmount, formatUsdValue } from '@/ui/utils/number';
import { getTokenSymbol } from '@/ui/utils/token';
import BigNumber from 'bignumber.js';
import { useWallet } from '@/ui/utils';
import IconUnknown from '@/ui/assets/token-default.svg';
import { ReactComponent as RcIconQueuedCC } from '@/ui/assets/bridge/IconQueuedCC.svg';
import { ReactComponent as RcIconFailedCC } from '@/ui/assets/bridge/IconFailedCC.svg';
import { useHistory, useLocation } from 'react-router-dom';
import { useRabbySelector } from '@/ui/store';
import { SvgIcPending, SvgIcSuccess, SvgIcWarning } from 'ui/assets';
import { FailedIcon, ProcessingIcon, SuccessIcon } from '@repo/ui';
import BottomDrawer from '@repo/ui/components/bottom-drawer';

import type {
  SwapTxHistoryItem,
  SendTxHistoryItem,
  BridgeTxHistoryItem,
  SendNftTxHistoryItem,
  ApproveTokenTxHistoryItem,
} from '@/background/service/transactionHistory';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { Image } from 'antd';
import { getUiType } from '@/ui/utils';
import { UI_TYPE } from '@/constant/ui';
import { getChain } from '@/utils';

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

const isDesktop = getUiType().isDesktop;
type PendingTxData = BridgeTxHistoryItem;

// Step status icon component
type StepStatusType = 'loading' | 'success' | 'failed' | 'queued' | 'dash';
const StepStatusIcon = ({
  status,
  step = 1,
}: {
  status: StepStatusType;
  step: 1 | 2;
}) => {
  switch (status) {
    case 'loading':
      return <ProcessingIcon />;
    case 'success':
      return <SuccessIcon />;
    case 'failed':
      return <FailedIcon />;
    case 'queued':
      return (
        <div className="flex items-center justify-center">
          <span className="text-15 font-medium text-r-neutral-foot mr-2">
            {step}.{' '}
          </span>
          <RcIconQueuedCC className="w-16 h-16 text-r-neutral-foot" />
        </div>
      );
    case 'dash':
      return (
        <div className="flex items-center justify-center">
          <span className="text-15 font-medium text-r-neutral-foot mr-2">
            {step}.{' '}
          </span>
          <span className="text-15 font-medium text-r-neutral-foot">-</span>
        </div>
      );
    default:
      return null;
  }
};

// Two-step status indicator component
const StepStatusIndicator = ({
  step1Status,
  step2Status,
}: {
  step1Status: StepStatusType;
  step2Status: StepStatusType;
}) => {
  return (
    <div className="flex items-center gap-4">
      <StepStatusIcon step={1} status={step1Status} />
      <span className="text-15 font-medium text-r-neutral-foot">→</span>
      <StepStatusIcon step={2} status={step2Status} />
    </div>
  );
};

const TokenWithChain = ({ token, chain }: { token: string; chain: string }) => {
  const chainItem = findChain({ serverId: chain }) || null;

  return (
    <div className="relative w-10 h-10">
      <Image
        className="w-10 h-10 rounded-full"
        src={token}
        fallback={IconUnknown}
        preview={false}
      />
      <TooltipWithMagnetArrow
        title={chainItem?.name}
        className="rectangle w-[max-content]"
      >
        <img
          className="w-4 h-4 absolute right-[-2px] top-[-2px] rounded-full"
          src={chainItem?.logo || IconUnknown}
          alt={chainItem?.name}
        />
      </TooltipWithMagnetArrow>
    </div>
  );
};

// Bridge Status Detail Component
const PendingStatusDetail = ({
  data,
  status,
  step1Status,
  step2Status,
}: {
  data: BridgeTxHistoryItem;
  status: 'pending' | 'fromSuccess' | 'fromFailed' | 'allSuccess' | 'failed';
  step1Status: StepStatusType;
  step2Status: StepStatusType;
}) => {
  const history = useHistory();
  const { t } = useTranslation();
  const [refreshEstTime, setRefreshEstTime] = useState(0);

  const fromChain = findChain({ serverId: data.fromToken?.chain || '' });
  const toChain = findChain({ serverId: data.toToken?.chain || '' });

  // Calculate USD values
  const payUsdValue = useMemo(() => {
    if (!data.fromToken?.price || !data.fromAmount) return '0';
    return new BigNumber(data.fromAmount)
      .times(data.fromToken.price)
      .toString();
  }, [data.fromToken?.price, data.fromAmount]);

  const receiveUsdValue = useMemo(() => {
    if (!data.toToken?.price || !data.toAmount) return '0';
    return new BigNumber(data.toAmount)
      .multipliedBy(data.toToken?.price || 0)
      .toString();
  }, [data.toToken?.price, data.toAmount]);

  // Get estimated duration from bridge history
  const estimatedDuration = useMemo(() => {
    // Fallback: calculate from create time if step 2 is loading
    if (step2Status === 'loading' && data.fromTxCompleteTs) {
      const elapsed = Date.now() - data.fromTxCompleteTs;
      const estimatedDuration = data.estimatedDuration * 1000;
      const remainingDuration = estimatedDuration - elapsed;
      if (elapsed > estimatedDuration * 2 && elapsed > 2 * ONE_MINUTE_MS) {
        return -1;
      }
      if (remainingDuration <= 0) {
        return null;
      }
      const estimated = Math.max(Math.round(remainingDuration / 60000), 1);
      return estimated;
    }
    return null;
  }, [step2Status, data, refreshEstTime]);

  useInterval(async () => {
    if (data?.status === 'fromSuccess') {
      setRefreshEstTime((e) => e + 1);
    }
  }, 1000);

  const receiveItem = useMemo(() => {
    const token = data.actualToToken || data.toToken;
    const amount = data.actualToAmount || data.toAmount;
    const usdValue = new BigNumber(amount)
      .multipliedBy(token?.price || 0)
      .toString();
    return {
      token,
      amount,
      usdValue,
    };
  }, [data.toToken, data.toAmount, receiveUsdValue, status]);

  const receiveItemNeedOpacity = useMemo(() => {
    return (
      status === 'fromFailed' ||
      status === 'pending' ||
      (!data.actualToToken && status === 'failed')
    );
  }, [status, data.actualToToken]);

  const location = useLocation();
  const desktopPathname = location.pathname.startsWith('/desktop/profile')
    ? location.pathname
    : '/desktop/profile';

  const ReceiveBottomArea = useMemo(() => {
    if (status === 'failed') {
      const showSwap = data.actualToToken?.chain === data.toToken?.chain;
      const isReturn =
        data.actualToToken?.chain === data.fromToken?.chain &&
        data.actualToToken?.id === data.fromToken?.id;
      const isReturnSourceChain =
        data.actualToToken?.chain === data.fromToken?.chain;

      return (
        <div className="flex items-center justify-between mx-12 py-14 border-t-[0.5px] border-solid border-rabby-neutral-line gap-12">
          {isReturn ? (
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 flex items-center justify-center">
                <RcIconFailedCC className="w-16 h-16 text-r-red-default" />
              </div>
              <span className="text-13 leading-[16px] font-medium text-r-red-default">
                {t('page.bridge.pendingItem.beReturnFailed')}
              </span>
            </div>
          ) : showSwap ? (
            <>
              <div className="flex items-start gap-4 flex-1">
                <div className="w-20 h-20 flex items-center justify-center">
                  <RcIconFailedCC className="w-20 h-20 text-r-red-default" />
                </div>
                <div className="text-13 leading-[16px] font-medium text-r-red-default">
                  {t('page.bridge.pendingItem.receivedDifferentTokenNeedSwap')}
                </div>
              </div>
              <div
                style={{ height: 26 }}
                className="px-10 flex items-center justify-center rounded-[4px] text-12 font-medium bg-r-blue-light-1 text-13  text-r-blue-default cursor-pointer"
                onClick={() => {
                  if (isDesktop) {
                    history.push(
                      `${desktopPathname}?rbisource=tokendetail&action=swap&chain=${data.toToken?.chain}&payTokenId=${data.actualToToken?.id}&receiveTokenId=${data.toToken?.id}`
                    );
                  } else {
                    history.push(
                      `/dex-swap?rbisource=tokendetail&chain=${data.toToken?.chain}&payTokenId=${data.actualToToken?.id}&receiveTokenId=${data.toToken?.id}`
                    );
                  }
                }}
              >
                {t('page.bridge.pendingItem.swap')}
              </div>
            </>
          ) : isReturnSourceChain ? (
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 flex items-center justify-center">
                <RcIconFailedCC className="w-16 h-16 text-r-red-default" />
              </div>
              <span className="text-13 leading-[16px] font-medium text-r-red-default">
                {t('page.bridge.pendingItem.receivedDifferentTokenFromSource')}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 flex items-center justify-center">
                <RcIconFailedCC className="w-16 h-16 text-r-red-default" />
              </div>
              <span className="text-13 leading-[16px] font-medium text-r-red-default">
                {t('page.bridge.pendingItem.BridgeStatusUnavailable')}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (estimatedDuration) {
      return (
        <div className="flex items-center justify-between mx-12 py-12 border-t-[0.5px] border-solid border-rabby-neutral-line">
          {estimatedDuration === -1 ? (
            <div className="flex items-start gap-4">
              <RcIconFailedCC className="w-20 h-20 text-r-neutral-foot" />
              <span className="text-13 leading-[16px] font-medium text-r-neutral-foot">
                {t('page.bridge.pendingItem.longTimeNoReceive')}
              </span>
            </div>
          ) : (
            <>
              <span className="text-13 font-medium text-r-neutral-foot">
                {t('page.bridge.pendingItem.estimatedTime')}
              </span>
              <span className="text-13 font-medium text-r-neutral-foot">
                {' '}
                {estimatedDuration}min
              </span>
            </>
          )}
        </div>
      );
    }

    return null;
  }, [status, estimatedDuration, t, data]);

  const getStatusLabel = (status: StepStatusType) => {
    switch (status) {
      case 'loading':
        return <ProcessingIcon />;
      case 'success':
        return <SuccessIcon />;
      case 'failed':
        return <FailedIcon />;
      case 'queued':
        return (
          <div className="flex items-center justify-center text-r-neutral-foot bg-r-neutral-bg-2 text-13 font-medium px-8 py-6 rounded-[4px] gap-4">
            <RcIconQueuedCC className="w-16 h-16 text-r-neutral-foot" />
            <span className="text-r-neutral-foot text-13 font-medium">
              {t('page.bridge.pendingItem.queued')}
            </span>
          </div>
        );
      case 'dash':
        return (
          <span className="text-r-neutral-foot text-13 font-medium">-</span>
        );
      default:
        return null;
    }
  };

  const receiveNotRightToken = useMemo(() => {
    return (
      data.actualToToken &&
      (data.actualToToken?.id !== data.toToken?.id ||
        data.actualToToken?.chain !== data.toToken?.chain)
    );
  }, [data.actualToToken, data.toToken]);

  return (
    <div className="flex flex-col px-20 w-full pt-12">
      <div className="flex items-center mb-12 justify-center">
        <span className="text-20 font-medium text-r-neutral-title-1">
          {t('page.bridge.pendingItem.bridgeStatus')}
        </span>
      </div>
      {/* Step 1: Sending from chain */}
      <div className="flex flex-col bg-r-neutral-card-1 rounded-[8px] w-full">
        <div className="border-b-[0.5px] border-solid border-rabby-neutral-line">
          <div className="flex items-center justify-between px-12 py-8">
            <div className="flex items-center gap-6">
              <span className="text-24 font-bold text-r-neutral-title-1">
                1
              </span>
              <span className="text-15 font-bold text-r-neutral-title-1">
                {t('page.bridge.pendingItem.sendingFrom', {
                  chain: fromChain?.name || '',
                })}
              </span>
            </div>
            {getStatusLabel(step1Status)}
          </div>
        </div>
        <div className="flex items-center justify-between px-12 py-14">
          <div className="flex gap-8">
            <TokenWithChain
              token={(data as BridgeTxHistoryItem)?.fromToken?.logo_url}
              chain={(data as BridgeTxHistoryItem)?.fromToken?.chain || ''}
            />
            <span className="text-13 font-bold text-r-neutral-title-1">
              {'- '}
              {formatTokenAmount(data.fromAmount || 0)}{' '}
              {getTokenSymbol(data.fromToken)}
            </span>
          </div>
          <span className="text-13 text-r-neutral-foot">
            -{formatUsdValue(payUsdValue)}
          </span>
        </div>
        {status === 'fromFailed' && (
          <div className="flex items-center py-12 gap-4 border-t-[0.5px] mx-12 border-solid border-rabby-neutral-line">
            <RcIconFailedCC className="w-16 h-16 text-r-red-default" />
            <span className="text-13 font-medium text-r-red-default">
              {t('page.bridge.pendingItem.fromFailed')}
            </span>
          </div>
        )}
      </div>

      {/* Step 2: Receiving on chain */}
      <div
        className={`flex flex-col bg-r-neutral-card-1 rounded-[8px] w-full ${
          status === 'failed' ? 'mb-32' : ''
        }`}
      >
        <div className="border-b-[0.5px] border-solid border-rabby-neutral-line">
          <div className="flex items-center justify-between px-12 py-8">
            <div className="flex items-center gap-6">
              <span
                className={`text-24 font-bold ${
                  receiveItemNeedOpacity
                    ? 'text-r-neutral-foot'
                    : 'text-r-neutral-title-1'
                }`}
              >
                2
              </span>
              <span
                className={`text-15 font-bold ${
                  receiveItemNeedOpacity
                    ? 'text-r-neutral-foot'
                    : 'text-r-neutral-title-1'
                }`}
              >
                {t('page.bridge.pendingItem.receivingTo', {
                  chain: toChain?.name || '',
                })}
              </span>
            </div>
            {getStatusLabel(step2Status)}
          </div>
        </div>
        {status === 'failed' && receiveNotRightToken && (
          <div className="flex items-center justify-between px-12 py-14">
            <div className="flex gap-8">
              <TokenWithChain
                token={data.toToken?.logo_url}
                chain={data.toToken?.chain || ''}
              />
              <span
                style={{
                  opacity: 0.4,
                  textDecoration: 'line-through',
                }}
                className={'text-13 font-bold text-r-neutral-title-1'}
              >
                {'+ '}
                {formatTokenAmount(data.toAmount || 0)}{' '}
                {getTokenSymbol(data.toToken)}
              </span>
            </div>
            <span
              style={{
                opacity: 0.4,
                textDecoration: 'line-through',
              }}
              className={'text-13 text-r-neutral-foot'}
            >
              +{formatUsdValue(data.toAmount * data.toToken.price)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between px-12 py-14">
          <div className="flex gap-8">
            <TokenWithChain
              token={receiveItem.token?.logo_url}
              chain={receiveItem.token?.chain || ''}
            />
            <span
              className={`text-13 font-bold text-r-neutral-title-1 ${
                receiveItemNeedOpacity ? 'opacity-40' : ''
              }`}
            >
              {'+ '}
              {formatTokenAmount(receiveItem.amount || 0)}{' '}
              {getTokenSymbol(receiveItem.token)}
            </span>
          </div>
          <span
            className={`text-13 text-r-neutral-foot ${
              receiveItemNeedOpacity ? 'opacity-40' : ''
            }`}
          >
            +{formatUsdValue(receiveItem.usdValue)}
          </span>
        </div>
        {ReceiveBottomArea}
      </div>
    </div>
  );
};

export const BridgePendingTxItem = ({
  historyList,
  pendingTxHash,
}: {
  historyList?: HypermidBridgeHistoryItem[];
  pendingTxHash?: string;
}) => {
  const type = 'bridge';
  const { t } = useTranslation();
  const wallet = useWallet();
  const [detailVisible, setDetailVisible] = useState(false);
  const history = useHistory();
  const [data, setData] = useState<PendingTxData | null>(null);
  const { userAddress } = useRabbySelector((state) => ({
    userAddress: state.account.currentAccount?.address || '',
  }));

  const applyHistoryList = useMemoizedFn(
    (currentData: BridgeTxHistoryItem, list: HypermidBridgeHistoryItem[]) => {
      const findTx = list.find(
        (item) => item.from_tx?.tx_id === currentData.hash
      );
      if (!findTx) {
        if (Date.now() - currentData.createdAt > ONE_HOUR_MS) {
          wallet.completeBridgeTxHistory(
            currentData.hash,
            currentData.fromChainId!,
            'failed'
          );
          setData(null);
        }
      } else if (findTx.status === 'completed' || findTx.status === 'failed') {
        const status = findTx.status === 'completed' ? 'allSuccess' : 'failed';
        setData({
          ...currentData,
          status,
          completedAt: Date.now(),
        } as BridgeTxHistoryItem);
        wallet.completeBridgeTxHistory(
          currentData.hash,
          currentData.fromChainId!,
          status
        );
      }
    }
  );

  const applyDepositStatus = useMemoizedFn(
    (currentData: BridgeTxHistoryItem, status: string) => {
      const s = status?.toLowerCase();
      if (s === 'done' || s === 'completed') {
        setData({
          ...currentData,
          status: 'allSuccess',
          completedAt: Date.now(),
        } as BridgeTxHistoryItem);
        wallet.completeBridgeTxHistory(
          currentData.hash,
          currentData.fromChainId!,
          'allSuccess'
        );
      } else if (s === 'failed') {
        setData({
          ...currentData,
          status: 'failed',
          completedAt: Date.now(),
        } as BridgeTxHistoryItem);
        wallet.completeBridgeTxHistory(
          currentData.hash,
          currentData.fromChainId!,
          'failed'
        );
      } else if (s === 'fromsuccess') {
        setData({
          ...currentData,
          status: 'fromSuccess',
        } as BridgeTxHistoryItem);
      }
    }
  );

  const fetchHistory = useCallback(async () => {
    if (!userAddress) return;
    console.log(
      '[BridgePendingTxItem] fetchHistory called with pendingTxHash:',
      pendingTxHash
    );
    const historyData = (await wallet.getRecentPendingTxHistory(
      userAddress,
      'bridge'
    )) as BridgeTxHistoryItem;
    console.log(
      '[BridgePendingTxItem] Got history data:',
      historyData?.hash,
      'pendingTxHash:',
      pendingTxHash
    );

    // tx create time is more than one day, set this tx failed and no show in loading pendingTxItem
    if (
      historyData?.createdAt &&
      Date.now() - historyData.createdAt > ONE_DAY_MS
    ) {
      wallet.completeBridgeTxHistory(
        historyData.hash,
        historyData.fromChainId!,
        'failed'
      );
      return;
    }

    setData(historyData);
    if (
      historyData?.hash &&
      (historyData.status === 'pending' || historyData.status === 'fromSuccess')
    ) {
      const fromChain = String(
        findChain({ serverId: historyData.fromToken?.chain || '' })?.id || ''
      );
      const toChain = String(
        findChain({ serverId: historyData.toToken?.chain || '' })?.id || ''
      );
      try {
        const statusRes = await fetchDepositStatus({
          txHash: historyData.hash,
          fromChain: fromChain || undefined,
          toChain: toChain || undefined,
        });
        applyDepositStatus(historyData, statusRes.status);
      } catch {
        // fall back to history list if status endpoint fails
        const res = await fetchBridgeHistoryList({
          user_addr: userAddress,
          start: 0,
          limit: 10,
          is_all: true,
        });
        if (res.history_list?.length > 0) {
          applyHistoryList(historyData, res.history_list);
        }
      }
    }
  }, [userAddress, applyHistoryList, applyDepositStatus]);

  useEffect(() => {
    console.log('[BridgePendingTxItem] useEffect running, fetching history');
    fetchHistory();
  }, [fetchHistory, pendingTxHash]);

  // When pendingTxHash is provided directly, create a minimal data object immediately
  // This ensures the status component shows up even if wallet history hasn't updated yet
  useEffect(() => {
    if (pendingTxHash && !data) {
      console.log(
        '[BridgePendingTxItem] Creating minimal tx data for pendingTxHash:',
        pendingTxHash
      );
      // Create a minimal transaction object to display status while polling updates it
      const minimalData: Partial<BridgeTxHistoryItem> = {
        hash: pendingTxHash,
        status: 'pending',
        createdAt: Date.now(),
        fromTxCompleteTs: undefined,
        estimatedDuration: 300, // Default 5 minute estimate
      };
      setData(minimalData as BridgeTxHistoryItem);
    }
  }, [pendingTxHash, data]);

  // React to historyList prop changes (parent-level polling) to update status
  useEffect(() => {
    if (!historyList?.length || !data) return;
    const bridgeData = data as BridgeTxHistoryItem;
    if (bridgeData.status !== 'pending' && bridgeData.status !== 'fromSuccess')
      return;
    applyHistoryList(bridgeData, historyList);
  }, [historyList, data, applyHistoryList]);

  const fetchRefreshLocalData = useMemoizedFn(async (data: PendingTxData) => {
    if (!data || data.status !== 'pending') {
      // has done or no data
      return;
    }

    const address = data.address;
    const chainId = data.fromChainId;
    const hash = data.hash;
    const newData = await wallet.getRecentTxHistory(
      address,
      hash,
      chainId!,
      'bridge'
    );

    if (newData?.status !== 'pending') {
      return newData;
    }
  });

  // Only self-poll the API when historyList is not provided by the parent
  useInterval(
    async () => {
      if (!data) return;
      const bridgeData = data as BridgeTxHistoryItem;
      if (
        bridgeData.status !== 'pending' &&
        bridgeData.status !== 'fromSuccess'
      )
        return;
      const fromChain = String(
        findChain({ serverId: bridgeData.fromToken?.chain || '' })?.id || ''
      );
      const toChain = String(
        findChain({ serverId: bridgeData.toToken?.chain || '' })?.id || ''
      );
      try {
        const statusRes = await fetchDepositStatus({
          txHash: bridgeData.hash,
          fromChain: fromChain || undefined,
          toChain: toChain || undefined,
        });
        applyDepositStatus(bridgeData, statusRes.status);
      } catch {
        const res = await fetchBridgeHistoryList({
          user_addr: userAddress,
          start: 0,
          limit: 10,
          is_all: true,
        });
        if (res.history_list?.length > 0) {
          applyHistoryList(bridgeData, res.history_list);
        }
      }
    },
    historyList ? undefined : 10 * 1000
  );

  useInterval(async () => {
    if (data?.status === 'pending' || data?.status === 'fromSuccess') {
      const refreshTx = await fetchRefreshLocalData(data);
      if (refreshTx) {
        setData(refreshTx as PendingTxData);
      }
    }
  }, 1000);

  const status = data?.status || 'pending';
  // Determine step statuses based on bridge status and history
  const { step1Status, step2Status } = useMemo(() => {
    let step1Status: StepStatusType = 'loading';
    let step2Status: StepStatusType = 'queued';
    switch (status) {
      case 'fromSuccess':
        step1Status = 'success';
        step2Status = 'loading';
        break;
      case 'fromFailed':
        step1Status = 'failed';
        step2Status = 'dash';
        break;
      case 'allSuccess':
        step1Status = 'success';
        step2Status = 'success';
        break;
      case 'failed':
        step1Status = 'success';
        step2Status = 'failed';
        break;
      case 'pending':
      default:
        step1Status = 'loading';
        step2Status = 'queued';
        break;
    }
    return { step1Status, step2Status };
  }, [status]);

  const handlePress = useMemoizedFn(async () => {
    setDetailVisible(true);
  });

  if (!data) {
    return null;
  }

  return (
    <div>
      <div
        className={clsx(
          'flex items-center justify-between cursor-pointer rounded-[8px] px-[16px] py-[14px]',
          'hover:bg-blue-light hover:bg-opacity-[0.1] hover:border-rabby-blue-default border border-transparent',
          'bg-r-neutral-card-1'
        )}
        onClick={handlePress}
      >
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-6">
            <>
              <TokenWithChain
                token={(data as BridgeTxHistoryItem)?.fromToken?.logo_url}
                chain={(data as BridgeTxHistoryItem)?.fromToken?.chain || ''}
              />
              <span className="text-15 font-medium text-r-neutral-title-1">
                {getTokenSymbol((data as BridgeTxHistoryItem)?.fromToken)}
              </span>
              <span className="text-15 font-medium text-r-neutral-foot mx-2">
                →
              </span>
              <TokenWithChain
                token={(data as BridgeTxHistoryItem)?.toToken?.logo_url}
                chain={(data as BridgeTxHistoryItem)?.toToken?.chain || ''}
              />
              <span className="text-15 font-medium text-r-neutral-title-1">
                {getTokenSymbol((data as BridgeTxHistoryItem)?.toToken)}
              </span>
            </>
          </div>
        </div>

        <StepStatusIndicator
          step1Status={step1Status}
          step2Status={step2Status}
        />
      </div>
      {detailVisible && (
        <BottomDrawer
          variant="semi"
          rootSelector=".js-rabby-popup-container"
          close={() => setDetailVisible(false)}
        >
          <div className="flex flex-col min-h-[360px] max-h-[480px] h-auto bg-r-neutral-bg2 rounded-t-[16px]">
            {data && (
              <PendingStatusDetail
                data={data}
                status={status}
                step1Status={step1Status}
                step2Status={step2Status}
              />
            )}
          </div>
        </BottomDrawer>
      )}
    </div>
  );
};
