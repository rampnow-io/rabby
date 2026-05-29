import {
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
import { useRabbySelector } from '@/ui/store';
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
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import type { HypermidBridgeHistoryItem } from '../../api';
import { getUiType } from '@/ui/utils';

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
    bridgeHistoryList?: HypermidBridgeHistoryItem[];
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
    // Try pending first; fall back to any tx created in the last 5 min so we
    // can show "Succeeded / Failed" even when the tx completed before this component mounted.
    const historyData =
      (await wallet.getRecentPendingTxHistory(userAddress, type)) ??
      (await wallet.getLatestTxHistory(userAddress, type));
    setData(historyData as PendingTxData | null);
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
    } else {
      // Re-check for a newly submitted tx in case it was recorded after mount
      await fetchHistory();
    }
  }, 1000);

  const isPending =
    data?.status === 'pending' || data?.status === 'fromSuccess';
  const isFailed = data?.status === 'failed';

  useEffect(() => {
    const isCurrentFulfilled = !isPending;
    if (isCurrentFulfilled && !preFulfilledRef.current) {
      onFulfilled?.();
    }
    preFulfilledRef.current = isCurrentFulfilled;
  }, [isPending, onFulfilled]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    if (data && !hasAutoOpenedRef.current) {
      setSheetOpen(true);
      hasAutoOpenedRef.current = true;
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
        history.push('/dashboard?force_fetch=true');
      }
    }
  });

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

  const fromToken =
    type === 'swap'
      ? (data as SwapTxHistoryItem)?.fromToken
      : type === 'bridge'
      ? (data as BridgeTxHistoryItem)?.fromToken
      : null;

  const toToken =
    type === 'swap'
      ? (data as SwapTxHistoryItem)?.toToken
      : type === 'bridge'
      ? (data as BridgeTxHistoryItem)?.toToken
      : null;

  return (
    <>
      {/* Inline status card — keeps the page from looking empty */}
      <div
        className={clsx(
          'flex items-center justify-between cursor-pointer rounded-[8px] px-[16px] py-[14px]',
          'hover:bg-blue-light hover:bg-opacity-[0.1] hover:border-rabby-blue-default border border-transparent',
          'bg-r-neutral-card-1'
        )}
        onClick={() => setSheetOpen(true)}
      >
        <div className="flex items-center gap-6">
          {fromToken && toToken ? (
            <>
              <TokenWithChain
                token={fromToken.logo_url}
                chain={fromToken.chain || ''}
              />
              <span className="text-15 font-medium text-r-neutral-title-1">
                {getTokenSymbol(fromToken)}
              </span>
              <span className="text-15 font-medium text-r-neutral-foot mx-2">
                →
              </span>
              <TokenWithChain
                token={toToken.logo_url}
                chain={toToken.chain || ''}
              />
              <span className="text-15 font-medium text-r-neutral-title-1">
                {getTokenSymbol(toToken)}
              </span>
            </>
          ) : null}
        </div>
        <StatusIcon status={data.status} />
      </div>

      <BottomFloatingSheet
        hideCloseButton
        open={sheetOpen}
        onClose={handleSheetClose}
      >
        <div className="flex flex-col gap-6">
          {/* Status header */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <StatusIcon status={data.status} />
            <h2 className={clsx('text-lg font-semibold', statusClassName)}>
              {isPending
                ? 'Transaction Processing…'
                : isFailed
                ? 'Transaction Failed'
                : 'Transaction Complete'}
            </h2>
          </div>

          {/* Token route */}
          {fromToken && toToken ? (
            <div className="flex items-center justify-between px-4 py-3 bg-r-neutral-card-1 rounded-lg">
              <div className="flex items-center gap-2">
                <TokenWithChain
                  token={fromToken.logo_url}
                  chain={fromToken.chain || ''}
                />
                <span className="text-sm font-medium text-r-neutral-title-1">
                  {getTokenSymbol(fromToken)}
                </span>
              </div>
              <span className="text-sm text-r-neutral-foot">→</span>
              <div className="flex items-center gap-2">
                <TokenWithChain
                  token={toToken.logo_url}
                  chain={toToken.chain || ''}
                />
                <span className="text-sm font-medium text-r-neutral-title-1">
                  {getTokenSymbol(toToken)}
                </span>
              </div>
            </div>
          ) : null}

          {/* Transaction hash */}
          {data.hash && (
            <div className="px-4 py-3 flex items-center justify-between bg-r-neutral-card-1 rounded-lg">
              <span className="text-xs text-r-neutral-foot">Tx Hash</span>
              <Copy
                key="txHash"
                value={`${data.hash}`}
                className="text-xs text-r-neutral-title-1"
              >
                {truncate(data.hash, [6, 6])}
              </Copy>
            </div>
          )}

          {/* Action */}
          <Button
            disabled={isPending}
            onClick={handleSheetPress}
            className="w-full"
          >
            {isPending ? 'Processing…' : 'Go to Dashboard'}
          </Button>
        </div>
      </BottomFloatingSheet>
    </>
  );
});
