import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useInterval, useMemoizedFn } from 'ahooks';
import clsx from 'clsx';
import { findChain } from '@/utils/chain';
import { formatTokenAmount } from '@/ui/utils/number';
import { getTokenSymbol } from '@/ui/utils/token';
import { useWallet } from '@/ui/utils';
import IconUnknown from '@/ui/assets/token-default.svg';
import { useHistory } from 'react-router-dom';
import { transactionHistoryService } from '@/background/service';
import { useRabbySelector } from '@/ui/store';
import {
  SvgPendingSpin,
  SvgIcPending,
  SvgIcSuccess,
  SvgIcWarning,
} from 'ui/assets';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';

import type {
  SwapTxHistoryItem,
  SendTxHistoryItem,
  BridgeTxHistoryItem,
  SendNftTxHistoryItem,
  ApproveTokenTxHistoryItem,
} from '@/background/service/transactionHistory';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { Image } from 'antd';
import { BridgeHistory, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { getUiType } from '@/ui/utils';

import { UI_TYPE } from '@/constant/ui';
import { Button, Copy } from '@repo/ui/primitives';
import { FailedIcon, ProcessingIcon, SuccessIcon } from '@repo/ui';
import { truncate } from '@repo/utils';

const isDesktop = getUiType().isDesktop;
type PendingTxData =
  | SwapTxHistoryItem
  | SendNftTxHistoryItem
  | SendTxHistoryItem
  | BridgeTxHistoryItem
  | ApproveTokenTxHistoryItem;

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'pending' || status === 'fromSuccess') {
    return <ProcessingIcon />;
  }
  if (status === 'failed') {
    return <FailedIcon />;
  }

  return <SuccessIcon />;
};

const TokenWithChain = ({ token, chain }: { token: string; chain: string }) => {
  const chainItem = findChain({ serverId: chain }) || null;

  return (
    <div className="relative w-10 h-10 shrink-0">
      <Image
        className="w-10 h-10 rounded-full border border-r-neutral-line"
        src={token}
        fallback={IconUnknown}
        preview={false}
      />
      <TooltipWithMagnetArrow
        title={chainItem?.name}
        className="rectangle w-[max-content]"
      >
        <img
          className="w-4 h-4 absolute right-[-2px] bottom-[-2px] rounded-full border border-white"
          src={chainItem?.logo || IconUnknown}
          alt={chainItem?.name}
        />
      </TooltipWithMagnetArrow>
    </div>
  );
};

export const PendingTxItem = forwardRef<
  { fetchHistory: () => void },
  {
    type:
      | 'send'
      | 'swap'
      | 'bridge'
      | 'sendNft'
      | 'approveSwap'
      | 'approveBridge';
    bridgeHistoryList?: BridgeHistory[];
    openBridgeHistory?: () => void;
    onFulfilled?: () => void;
  }
>(({ type, bridgeHistoryList, openBridgeHistory, onFulfilled }, ref) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const history = useHistory();
  const [data, setData] = useState<PendingTxData | null>(null);
  const { userAddress } = useRabbySelector((state) => ({
    userAddress: state.account.currentAccount?.address || '',
  }));
  const preFulfilledRef = useRef<boolean>(true);

  const fetchHistory = useCallback(async () => {
    if (!userAddress) return;
    const historyData = await wallet.getRecentPendingTxHistory(
      userAddress,
      type
    );
    setData(historyData);
  }, [type, userAddress]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const fetchRefreshLocalData = useMemoizedFn(
    async (
      data: PendingTxData,
      type:
        | 'send'
        | 'swap'
        | 'bridge'
        | 'sendNft'
        | 'approveSwap'
        | 'approveBridge'
    ) => {
      if (data.status !== 'pending') {
        // has done
        return;
      }

      const address = data.address;
      const chainId =
        'chainId' in data
          ? data.chainId
          : 'fromChainId' in data
          ? data.fromChainId
          : null;
      const hash = data.hash;
      const newData = await wallet.getRecentTxHistory(
        address,
        hash,
        chainId!,
        type
      );

      if (newData?.status !== 'pending') {
        return newData;
      }
    }
  );

  useInterval(async () => {
    if (data) {
      const refreshTx = await fetchRefreshLocalData(data, type);
      if (refreshTx) {
        setData(refreshTx);
      }
    }
  }, 1000);

  // not use in bridge, so no need
  // useEffect(() => {
  //   if (
  //     bridgeHistoryList &&
  //     bridgeHistoryList?.length > 0 &&
  //     type === 'bridge'
  //   ) {
  //     const recentlyTxHash = data?.hash;
  //     if (
  //       recentlyTxHash &&
  //       'fromChainId' in data && // only bridge logic
  //       data.status !== 'allSuccess'
  //     ) {
  //       const findTx = bridgeHistoryList.find(
  //         (item) => item.from_tx?.tx_id === recentlyTxHash
  //       );
  //       if (!findTx) {
  //         const currentTime = Date.now();
  //         const txCreateTime = data?.createdAt;
  //         if (currentTime - txCreateTime > 1000 * 60 * 60) {
  //           // tx create time is more than 60 minutes, set this tx failed
  //           wallet.completeBridgeTxHistory(
  //             recentlyTxHash,
  //             data?.fromChainId,
  //             'failed'
  //           );
  //           return;
  //         }
  //       }
  //       if (
  //         findTx &&
  //         (findTx.status === 'completed' || findTx.status === 'failed') &&
  //         data
  //       ) {
  //         const status =
  //           findTx.status === 'completed' ? 'allSuccess' : 'failed';
  //         setData({
  //           ...data,
  //           status,
  //           completedAt: Date.now(),
  //         });
  //         wallet.completeBridgeTxHistory(
  //           recentlyTxHash,
  //           data.fromChainId,
  //           status
  //         );
  //       }
  //     }
  //   }
  // }, [bridgeHistoryList, data, type, wallet]);

  const isPending =
    data?.status === 'pending' || data?.status === 'fromSuccess';
  const isFailed = data?.status === 'failed';
  const isSuccess = data?.status === 'success' || data?.status === 'allSuccess';

  useEffect(() => {
    const isCurrentFulfilled = !isPending;
    if (isCurrentFulfilled && !preFulfilledRef.current) {
      onFulfilled?.();
    }
    preFulfilledRef.current = isCurrentFulfilled;
  }, [isPending, onFulfilled]);

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setSheetOpen(true);
    }
  }, [data]);

  const handleSheetClose = useMemoizedFn(() => {
    setSheetOpen(false);
  });

  const handleSheetPress = useMemoizedFn(async () => {
    if (!isPending) {
      setSheetOpen(false);
    }
    if (type === 'bridge' && openBridgeHistory) {
      openBridgeHistory();
    } else {
      if (isDesktop) {
        history.push(
          `${
            history.location.pathname.startsWith('/desktop/profile')
              ? history.location.pathname
              : '/desktop/profile'
          }?action=activities`
        );
      } else {
        history.push('/dashboard');
      }
    }
  });

  const sendTitleTextStr = useMemo(() => {
    if ((type === 'send' || type === 'sendNft') && data) {
      const sendData = data as SendTxHistoryItem;
      const sendAmount = formatTokenAmount(sendData?.amount);
      if (type === 'sendNft') {
        return `-${sendAmount} NFT`;
      } else {
        return `-${sendAmount} ${getTokenSymbol(sendData?.token as TokenItem)}`;
      }
    }
    return '';
  }, [type, data]);

  const statusText = useMemo(() => {
    if (isPending) {
      return t('page.transactions.detail.Pending');
    }
    if (isFailed) {
      return t('page.transactions.detail.Failed');
    }
    return t('page.transactions.detail.Succeeded');
  }, [isPending, isFailed, t]);

  const statusClassName = useMemo(() => {
    if (isPending) {
      return 'text-r-orange-default';
    }
    if (isFailed) {
      return 'text-r-red-default';
    }
    return 'text-r-green-default';
  }, [isPending, isFailed]);

  useImperativeHandle(ref, () => ({
    fetchHistory: () => {
      fetchHistory();
    },
  }));

  if (!data) {
    return null;
  }

  return (
    <>
      <BottomFloatingSheet
        hideCloseButton
        open={sheetOpen}
        onClose={handleSheetClose}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="pb-4">
            <h2 className="text-base font-semibold text-r-neutral-title-1">
              Transaction Status
            </h2>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {/* Token Display */}
            <div className="flex items-center justify-between px-2 py-3 bg-r-neutral-card-1 rounded-lg">
              {type === 'swap' ? (
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <TokenWithChain
                      token={(data as SwapTxHistoryItem)?.fromToken?.logo_url}
                      chain={
                        (data as SwapTxHistoryItem)?.fromToken?.chain || ''
                      }
                    />
                    <div className="text-sm font-medium text-r-neutral-title-1">
                      {getTokenSymbol((data as SwapTxHistoryItem)?.fromToken)}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-r-neutral-foot">
                    →
                  </span>
                  <div className="flex items-center gap-3">
                    <TokenWithChain
                      token={(data as SwapTxHistoryItem)?.toToken?.logo_url}
                      chain={(data as SwapTxHistoryItem)?.toToken?.chain || ''}
                    />
                    <div className="text-sm font-medium text-r-neutral-title-1">
                      {getTokenSymbol((data as SwapTxHistoryItem)?.toToken)}
                    </div>
                  </div>
                </div>
              ) : type === 'bridge' ? (
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <TokenWithChain
                      token={(data as BridgeTxHistoryItem)?.fromToken?.logo_url}
                      chain={
                        (data as BridgeTxHistoryItem)?.fromToken?.chain || ''
                      }
                    />
                    <div className="text-sm font-medium text-r-neutral-title-1">
                      {getTokenSymbol((data as BridgeTxHistoryItem)?.fromToken)}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-r-neutral-foot">
                    →
                  </span>
                  <div className="flex items-center gap-3">
                    <TokenWithChain
                      token={(data as BridgeTxHistoryItem)?.toToken?.logo_url}
                      chain={
                        (data as BridgeTxHistoryItem)?.toToken?.chain || ''
                      }
                    />
                    <div className="text-sm font-medium text-r-neutral-title-1">
                      {getTokenSymbol((data as BridgeTxHistoryItem)?.toToken)}
                    </div>
                  </div>
                </div>
              ) : ['approveBridge', 'approveSwap'].includes(type) ? (
                <div className="flex items-center gap-3">
                  <TokenWithChain
                    token={(data as ApproveTokenTxHistoryItem)?.token?.logo_url}
                    chain={
                      (data as ApproveTokenTxHistoryItem)?.token?.chain || ''
                    }
                  />
                  <div className="text-sm font-medium text-r-neutral-title-1">
                    {t('page.swap.approve-x-symbol', {
                      symbol: `${
                        (data as ApproveTokenTxHistoryItem).amount
                      } ${getTokenSymbol(
                        (data as ApproveTokenTxHistoryItem)?.token
                      )}`,
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Status Text */}
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <StatusIcon status={data.status} />
              <div className={clsx('text-base font-semibold', statusClassName)}>
                {statusText}
              </div>
            </div>

            {/* Transaction Hash (if available) */}
            {data.hash && (
              <div className="px-4 py-3 flex items-center justify-between bg-r-neutral-card-1 rounded-lg">
                <div className="text-xs text-primary-foreground mb-1">
                  Transaction Hash
                </div>
                <div className="text-xs text-primary-foreground break-all">
                  <Copy
                    key="txHash"
                    value={`${data.hash}`}
                    className="text-sm text-primary-foreground"
                  >
                    {truncate(data.hash, [4, 4])}
                  </Copy>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            disabled={isPending}
            onClick={handleSheetPress}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </BottomFloatingSheet>
    </>
  );
});
