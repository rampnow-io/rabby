import React, { useEffect, useMemo, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx';
import { Image } from 'antd';
import { ChevronDown, ExternalLink } from 'lucide-react';

import { useWallet, getUiType, formatUsdValue } from '@/ui/utils';
import { findChain } from '@/utils/chain';
import { formatTokenAmount } from '@/ui/utils/number';
import { getTokenSymbol } from '@/ui/utils/token';
import IconUnknown from '@/ui/assets/token-default.svg';

import { Button } from '@repo/ui/primitives';
import { FailedIcon, ProcessingIcon, SuccessIcon } from '@repo/ui';

import type {
  SwapTxHistoryItem,
  BridgeTxHistoryItem,
} from '@/background/service/transactionHistory';
import type { SwapStatusResponse } from '../api';
import { numericIdToServerId } from '../api';

const isDesktop = getUiType().isDesktop;
type TxData = SwapTxHistoryItem | BridgeTxHistoryItem;
type StepStatus = 'loading' | 'success' | 'failed' | 'queued';

interface StepDef {
  label: string;
  status: StepStatus;
  explorerUrl?: string;
}

const TokenDisplay = ({
  logo,
  amount,
  price,
  symbol,
  chainName,
  chainLogo,
}: {
  logo?: string;
  amount?: number;
  price?: number;
  symbol?: string;
  chainName?: string;
  chainLogo?: string;
}) => {
  const usdValue = amount && price ? amount * price : undefined;
  return (
    <div className="flex items-center gap-3 py-4 px-4">
      <div className="relative w-9 h-9 shrink-0">
        <Image
          className="w-9 h-9 rounded-full object-cover"
          src={logo}
          fallback={IconUnknown}
          preview={false}
        />
        {chainLogo && (
          <img
            className="w-[14px] h-[14px] absolute right-[-2px] bottom-[-2px] rounded-full border border-white"
            src={chainLogo}
            alt=""
          />
        )}
      </div>
      <div>
        <div className="text-[20px] font-bold text-r-neutral-title-1 leading-tight">
          {amount != null ? formatTokenAmount(amount) : '–'}
        </div>
        <div className="flex items-center gap-1 text-12 text-r-neutral-foot mt-0.5">
          {usdValue != null && <span>{formatUsdValue(usdValue)}</span>}
          {usdValue != null && symbol && (
            <span className="text-r-neutral-line">·</span>
          )}
          {symbol && <span>{symbol}</span>}
          {chainName && (
            <>
              <span>on</span>
              {chainLogo && (
                <img
                  className="w-3 h-3 rounded-full"
                  src={chainLogo}
                  alt=""
                />
              )}
              <span>{chainName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StepRow = ({ label, status, explorerUrl }: StepDef) => (
  <div className="flex items-center gap-3 py-[10px] px-4">
    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
      {status === 'loading' && <ProcessingIcon />}
      {status === 'success' && <SuccessIcon />}
      {status === 'failed' && <FailedIcon />}
      {status === 'queued' && (
        <div className="w-5 h-5 rounded-full border-2 border-r-neutral-line" />
      )}
    </div>
    <span
      className={clsx(
        'text-14 flex-1',
        status === 'failed'
          ? 'text-r-red-default'
          : status === 'queued'
          ? 'text-r-neutral-foot'
          : 'text-r-neutral-title-1'
      )}
    >
      {label}
    </span>
    {explorerUrl && (status === 'success' || status === 'loading') && (
      <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={14} className="text-r-neutral-foot" />
      </a>
    )}
  </div>
);

export interface TxStatusItemProps {
  isSwap: boolean;
  hadApproval?: boolean;
  pendingTxHash?: string;
  swapStatus?: SwapStatusResponse | null;
  fromToken?: any;
  toToken?: any;
  fromAmount?: number;
  toAmount?: number;
}

export const TxStatusItem = ({
  isSwap,
  hadApproval = false,
  pendingTxHash,
  swapStatus,
  fromToken: fromTokenProp,
  toToken: toTokenProp,
  fromAmount: fromAmountProp,
  toAmount: toAmountProp,
}: TxStatusItemProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const [data, setData] = useState<TxData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const applyApiStatus = useMemoizedFn(
    (current: TxData, status: string, subStatus: string) => {
      const s = status?.toUpperCase();
      const sub = subStatus?.toUpperCase();
      if (s === 'NOT_FOUND') return;
      if (s === 'DONE') {
        const isRefundedOrPartial = sub === 'REFUNDED' || sub === 'PARTIAL';
        if (isRefundedOrPartial) {
          if (isSwap) {
            setData({ ...(current as SwapTxHistoryItem), status: 'failed' });
          } else {
            const bd = current as BridgeTxHistoryItem;
            setData({ ...bd, status: 'failed', completedAt: Date.now() });
            wallet.completeBridgeTxHistory(bd.hash, bd.fromChainId!, 'failed');
          }
        } else {
          if (isSwap) {
            setData({ ...(current as SwapTxHistoryItem), status: 'success' });
          } else {
            const bd = current as BridgeTxHistoryItem;
            setData({ ...bd, status: 'allSuccess', completedAt: Date.now() });
            wallet.completeBridgeTxHistory(
              bd.hash,
              bd.fromChainId!,
              'allSuccess'
            );
          }
        }
      } else if (s === 'FAILED') {
        if (isSwap) {
          setData({ ...(current as SwapTxHistoryItem), status: 'failed' });
        } else {
          const bd = current as BridgeTxHistoryItem;
          setData({ ...bd, status: 'failed', completedAt: Date.now() });
          wallet.completeBridgeTxHistory(bd.hash, bd.fromChainId!, 'failed');
        }
      } else if (s === 'PENDING' && !isSwap) {
        const bd = current as BridgeTxHistoryItem;
        if (
          sub === 'BRIDGE_IN_PROGRESS' ||
          sub === 'WAIT_DESTINATION_TRANSACTION'
        ) {
          setData({ ...bd, status: 'fromSuccess' });
        }
      }
    }
  );

  const applyStatusResponse = useMemoizedFn(
    (d: TxData, res: SwapStatusResponse) => {
      const enriched: TxData = { ...d } as TxData;
      if (res.sending?.token) {
        const t = res.sending.token;
        (enriched as any).fromToken = {
          id: t.address,
          chain: numericIdToServerId(t.chain_id),
          symbol: t.symbol,
          name: t.name || t.symbol,
          decimals: t.decimals,
          logo_url: t.logo_uri || '',
          price: 0,
          amount: 0,
        };
        (enriched as any).fromAmount =
          Number(res.sending.amount) / 10 ** t.decimals;
      }
      if (res.receiving?.token) {
        const t = res.receiving.token;
        (enriched as any).toToken = {
          id: t.address,
          chain: numericIdToServerId(t.chain_id),
          symbol: t.symbol,
          name: t.name || t.symbol,
          decimals: t.decimals,
          logo_url: t.logo_uri || '',
          price: 0,
          amount: 0,
        };
        (enriched as any).toAmount =
          Number(res.receiving.amount) / 10 ** t.decimals;
      }
      applyApiStatus(enriched, res.status, res.sub_status);
    }
  );

  useEffect(() => {
    if (pendingTxHash && !data) {
      setData({
        hash: pendingTxHash,
        status: 'pending',
        createdAt: Date.now(),
        fromToken: fromTokenProp,
        toToken: toTokenProp,
        fromAmount: fromAmountProp,
        toAmount: toAmountProp,
        ...(isSwap ? {} : { estimatedDuration: 300 }),
      } as BridgeTxHistoryItem);
    }
  }, [
    isSwap,
    pendingTxHash,
    data,
    fromTokenProp,
    toTokenProp,
    fromAmountProp,
    toAmountProp,
  ]);

  useEffect(() => {
    if (!swapStatus || !data) return;
    const s = data.status;
    if (s !== 'pending' && s !== 'fromSuccess') return;
    applyStatusResponse(data, swapStatus);
  }, [swapStatus, data, applyStatusResponse]);

  const txStatus = data?.status ?? 'pending';
  const isPending = txStatus === 'pending' || txStatus === 'fromSuccess';
  const isFailed = txStatus === 'failed' || txStatus === 'fromFailed';
  const isComplete = !isPending && !isFailed;

  const fromToken = (data as any)?.fromToken ?? fromTokenProp ?? null;
  const toToken = (data as any)?.toToken ?? toTokenProp ?? null;
  const fromAmount = (data as any)?.fromAmount ?? fromAmountProp;
  const toAmount = (data as any)?.toAmount ?? toAmountProp;
  const fromChain = findChain({ serverId: fromToken?.chain || '' });
  const toChain = findChain({ serverId: toToken?.chain || '' });

  const explorerUrl = useMemo(() => {
    if (!data?.hash || !fromChain?.scanLink) return undefined;
    return fromChain.scanLink.replace('_s_', data.hash);
  }, [data?.hash, fromChain?.scanLink]);

  const steps = useMemo<StepDef[]>(() => {
    const result: StepDef[] = [];
    const fromSymbol = getTokenSymbol(fromToken);

    if (hadApproval) {
      result.push({
        label: `${fromSymbol} spending approved`,
        status: 'success',
      });
    }

    if (isSwap) {
      if (isFailed) {
        result.push({ label: 'Swap failed', status: 'failed', explorerUrl });
      } else if (isComplete) {
        result.push({
          label: 'Swap successful',
          status: 'success',
          explorerUrl,
        });
      } else {
        result.push({
          label: 'Swap transaction pending',
          status: 'loading',
          explorerUrl,
        });
      }
    } else {
      if (txStatus === 'fromSuccess') {
        result.push({
          label: 'Source confirmed',
          status: 'success',
          explorerUrl,
        });
        result.push({
          label: `Receiving on ${toChain?.name || 'destination'}`,
          status: 'loading',
        });
      } else if (isComplete) {
        result.push({
          label: 'Bridge successful',
          status: 'success',
          explorerUrl,
        });
        result.push({
          label: `Received on ${toChain?.name || 'destination'}`,
          status: 'success',
        });
      } else if (isFailed) {
        result.push({
          label: 'Bridge failed',
          status: 'failed',
          explorerUrl,
        });
        result.push({
          label: `Receiving on ${toChain?.name || 'destination'}`,
          status: 'failed',
        });
      } else {
        result.push({
          label: 'Bridge in progress',
          status: 'loading',
          explorerUrl,
        });
        result.push({
          label: `Receiving on ${toChain?.name || 'destination'}`,
          status: 'queued',
        });
      }
    }

    return result;
  }, [
    hadApproval,
    isSwap,
    txStatus,
    isFailed,
    isComplete,
    fromToken,
    toChain,
    explorerUrl,
  ]);

  const priceRatio = useMemo(() => {
    if (!fromAmount || !toAmount || !toToken) return null;
    return `${formatTokenAmount(toAmount / fromAmount)} ${getTokenSymbol(toToken)}`;
  }, [fromAmount, toAmount, toToken]);

  const handleGoToDashboard = useMemoizedFn(() => {
    if (isDesktop) {
      const base = history.location.pathname.startsWith('/desktop/profile')
        ? history.location.pathname
        : '/desktop/profile';
      history.push(`${base}?action=activities`);
    } else {
      history.push('/dashboard');
    }
  });

  if (!data) return null;

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* From token */}
      <TokenDisplay
        logo={fromToken?.logo_url}
        amount={fromAmount}
        price={fromToken?.price}
        symbol={getTokenSymbol(fromToken)}
        chainName={fromChain?.name}
        chainLogo={fromChain?.logo || undefined}
      />

      {/* Steps */}
      <div className="py-2">
        {steps.map((step, i) => (
          <StepRow key={i} {...step} />
        ))}
      </div>

      {/* To token */}
      <TokenDisplay
        logo={toToken?.logo_url}
        amount={toAmount}
        price={toToken?.price}
        symbol={getTokenSymbol(toToken)}
        chainName={toChain?.name}
        chainLogo={toChain?.logo || undefined}
      />

      {/* Divider */}
      <div className="border-t border-r-neutral-line mx-4" />

      {/* Price ratio + details toggle */}
      <button
        className="flex items-center justify-between px-4 py-3 w-full text-left"
        onClick={() => setDetailsOpen((v) => !v)}
      >
        <span className="text-13 text-r-neutral-foot">
          {priceRatio ? `1 = ${priceRatio}` : '–'}
        </span>
        <div className="flex items-center gap-1 text-13 text-rabby-blue-default">
          <span>View details</span>
          <ChevronDown
            size={12}
            className={clsx(
              'transition-transform',
              detailsOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {detailsOpen && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {data?.hash && (
            <div className="flex justify-between items-center text-12 text-r-neutral-body">
              <span>Transaction hash</span>
              <span className="font-mono">
                {`${data.hash.slice(0, 10)}……${data.hash.slice(-8)}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom button — only shown when tx is complete or failed */}
      {!isPending && (
        <div className="px-4 pt-4 mt-auto pb-2">
          <Button
            className={clsx(
              'w-full',
              isComplete &&
                '!bg-[#B8FF43] !text-black !border-[#B8FF43] hover:!bg-[#a0e83a]'
            )}
            onClick={handleGoToDashboard}
          >
            {isComplete ? 'Contact support' : 'Go to Dashboard'}
          </Button>
        </div>
      )}
    </div>
  );
};
