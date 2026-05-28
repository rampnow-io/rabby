import { useEffect, useMemo, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { useHistory, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Image } from 'antd';
import { ExternalLink } from 'lucide-react';

import { UIContainer } from '@/ui/provider';
import {
  Container,
  Content,
  Action,
  TimeLine,
  TimelineStep,
  TransactionHash,
} from '@repo/ui';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Copy,
  Link,
  LinkType,
} from '@repo/ui/primitives';
import { HeaderNavPage } from '@/ui/component';
import { useWallet, getUiType, formatUsdValue } from '@/ui/utils';
import { findChain } from '@/utils/chain';
import { formatTokenAmount } from '@/ui/utils/number';
import { getTokenSymbol } from '@/ui/utils/token';
import IconUnknown from '@/ui/assets/token-default.svg';

import { TimelineStatus } from '@repo/ui';

import type {
  SwapTxHistoryItem,
  BridgeTxHistoryItem,
} from '@/background/service/transactionHistory';
import type { SwapStatusResponse } from './api';
import { numericIdToServerId } from './api';
import { usePollSwapStatus } from './hooks/history';
import { Button } from '@repo/ui/primitives';
import { cn, truncate } from '@repo/utils';

const isDesktop = getUiType().isDesktop;
type TxData = SwapTxHistoryItem | BridgeTxHistoryItem;

export interface TxStatusPageState {
  txHash: string;
  isSwap: boolean;
  hadApproval: boolean;
  fromToken: any;
  toToken: any;
  fromAmount: number;
  toAmount: number;
  fromChainNumericId?: string;
  toChainNumericId?: string;
}

function HashItem({
  hash,
  link,
  className,
}: {
  hash: string;
  link?: string;
  className?: string;
}) {
  const isExternal = link && link !== 'fiat';

  return (
    <div
      className={cn(
        'flex w-full gap-3 text-[14px] items-center font-medium',
        className
      )}
    >
      <span>{truncate(hash, [10, 10])}</span>
      <div className="flex items-center gap-2">
        <Copy value={hash} />
        {isExternal && <Link href={link} linkType={LinkType.EXTERNAL} />}
      </div>
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

const renderIcon = (tokenLogo: string, chainLogo: string) => {
  if (!tokenLogo && !chainLogo) return undefined;
  return (
    <div className="relative w-9 h-9">
      {tokenLogo && (
        <Image
          className="w-9 h-9 rounded-full object-cover"
          src={tokenLogo}
          fallback={IconUnknown}
          preview={false}
        />
      )}
      {chainLogo && (
        <img
          className="w-[14px] h-[14px] absolute right-[-2px] bottom-[-2px] rounded-full border border-white"
          src={chainLogo}
          alt=""
        />
      )}
    </div>
  );
};

// ─── accordion step utilities ──────────────────────────────────────────────────

interface AccordionStepDef {
  title: string;
  triggerLabel: string;
  details: { label: string; value: string }[];
}

const getSendingStepDetails = (
  data: TxData | null,
  isSwap: boolean,
  txHash?: string
): AccordionStepDef | null => {
  // Show accordion even while loading if we have txHash
  if (!data && !txHash) return null;

  const details: { label: string; value: string }[] = [];

  // Transaction hash
  const hash = data?.hash || txHash;
  if (hash) {
    details.push({
      label: 'Transaction hash',
      value: `${hash.slice(0, 10)}……${hash.slice(-8)}`,
    });
  }

  // Gas fee
  if ((data as any)?.sending?.gas_amount_usd) {
    details.push({
      label: 'Gas fee',
      value: `$${(data as any).sending.gas_amount_usd}`,
    });
  }

  // Amount sent
  if ((data as any)?.sending?.amount_usd) {
    details.push({
      label: 'Amount sent',
      value: `$${(data as any).sending.amount_usd}`,
    });
  }

  return {
    title: isSwap ? 'Swap Details' : 'Source Chain',
    triggerLabel: isSwap ? 'Swap Details' : 'Source Chain',
    details,
  };
};

const getReceivingStepDetails = (
  data: TxData | null,
  txHash?: string
): AccordionStepDef | null => {
  // Show accordion even while loading if we have txHash
  if (!data && !txHash) return null;

  const details: { label: string; value: string }[] = [];

  // Amount received
  if ((data as any)?.receiving?.amount_usd) {
    details.push({
      label: 'Amount received',
      value: `$${(data as any).receiving.amount_usd}`,
    });
  }

  // Protocol Fee
  if ((data as any)?.fee_costs?.[0]?.amount_usd) {
    details.push({
      label: 'Protocol fee',
      value: `$${(data as any).fee_costs[0].amount_usd}`,
    });
  }

  // Total cost
  if (
    (data as any)?.sending?.gas_amount_usd &&
    (data as any)?.fee_costs?.[0]?.amount_usd
  ) {
    const total = (
      parseFloat((data as any).sending.gas_amount_usd || 0) +
      parseFloat((data as any).fee_costs[0].amount_usd || 0)
    ).toFixed(4);
    details.push({
      label: 'Total cost',
      value: `$${total}`,
    });
  }

  return {
    title: 'Destination Chain',
    triggerLabel: (data as any)?.receiving?.amount_usd
      ? `Receiving: $${(data as any).receiving.amount_usd}`
      : 'Destination Chain',
    details,
  };
};

// ─── status → timeline helpers ───────────────────────────────────────────────

const swapStatusToTimelineStatus = (
  status: string | undefined
): TimelineStatus => {
  switch (status?.toUpperCase()) {
    case 'DONE':
      return TimelineStatus.SUCCESS;
    case 'FAILED':
      return TimelineStatus.FAILED;
    default:
      return TimelineStatus.PROCESSING; // NOT_FOUND, PENDING, undefined
  }
};

const subStatusToTimelineStatus = (
  subStatus: string | undefined,
  status: string | undefined
): TimelineStatus => {
  switch (subStatus?.toUpperCase()) {
    case 'COMPLETED':
      return TimelineStatus.SUCCESS;
    case 'PARTIAL':
    case 'REFUNDED':
      return TimelineStatus.FAILED;
    case 'BRIDGE_IN_PROGRESS':
    case 'WAIT_DESTINATION_TRANSACTION':
      return TimelineStatus.PROCESSING;
    case 'WAIT_SOURCE_CONFIRMATIONS':
      return TimelineStatus.PENDING;
    default:
      if (status?.toUpperCase() === 'DONE') return TimelineStatus.SUCCESS;
      if (status?.toUpperCase() === 'FAILED') return TimelineStatus.FAILED;
      return TimelineStatus.PENDING;
  }
};

// ─── main page ────────────────────────────────────────────────────────────────

const TxStatusPage = () => {
  const history = useHistory();

  const wallet = useWallet();

  const location = useLocation();

  const [accordionValue, setAccordionValue] = useState<string>('item-1');

  // Parse query parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const txHash = searchParams.get('txHash');
  const isSwap = searchParams.get('isSwap') === 'true';
  const hadApproval = searchParams.get('hadApproval') === 'true';

  // For objects, parse from JSON
  const fromTokenInit = searchParams.get('fromToken')
    ? JSON.parse(searchParams.get('fromToken')!)
    : null;
  const toTokenInit = searchParams.get('toToken')
    ? JSON.parse(searchParams.get('toToken')!)
    : null;

  // For numbers
  const fromAmountInit = searchParams.get('fromAmount')
    ? Number(searchParams.get('fromAmount'))
    : undefined;
  const toAmountInit = searchParams.get('toAmount')
    ? Number(searchParams.get('toAmount'))
    : undefined;
  const fromChainNumericId =
    searchParams.get('fromChainNumericId') || undefined;
  const toChainNumericId = searchParams.get('toChainNumericId') || undefined;

  const [data, setData] = useState<TxData | null>(() => {
    if (!txHash) return null;
    return {
      hash: txHash,
      status: 'pending',
      createdAt: Date.now(),
      fromToken: fromTokenInit,
      toToken: toTokenInit,
      fromAmount: fromAmountInit,
      toAmount: toAmountInit,
      ...(isSwap ? {} : { estimatedDuration: 300 }),
    } as BridgeTxHistoryItem;
  });

  const { swapStatus } = usePollSwapStatus({
    txHash: txHash || null,
    fromChain: fromChainNumericId,
    toChain: toChainNumericId,
  });

  // ─── status application ─────────────────────────────────────────────────

  const applyApiStatus = useMemoizedFn(
    (current: TxData, status: string, subStatus: string) => {
      const s = status?.toUpperCase();
      const sub = subStatus?.toUpperCase();
      if (s === 'NOT_FOUND') return;
      if (s === 'DONE' || s === 'COMPLETED') {
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

  // Apply API status when polling response arrives
  useEffect(() => {
    if (!swapStatus || !data) return;
    const s = data.status;
    if (s !== 'pending' && s !== 'fromSuccess') return;
    applyStatusResponse(data, swapStatus);
  }, [swapStatus, data, applyStatusResponse]);

  // Redirect if navigated to without state
  useEffect(() => {
    if (!txHash) {
      history.replace('/swap-and-bridge');
    }
  }, [txHash, history]);

  // ─── derived state ────────────────────────────────────────────────────────

  const txStatus = data?.status ?? 'pending';
  const isPending = txStatus === 'pending' || txStatus === 'fromSuccess';
  const isFailed = txStatus === 'failed' || txStatus === 'fromFailed';
  const isComplete = !isPending && !isFailed;

  const fromToken = (data as any)?.fromToken ?? fromTokenInit ?? null;
  const toToken = (data as any)?.toToken ?? toTokenInit ?? null;
  const fromAmount = (data as any)?.fromAmount ?? fromAmountInit;
  const toAmount = (data as any)?.toAmount ?? toAmountInit;
  const fromChain = findChain({ serverId: fromToken?.chain || '' });
  const toChain = findChain({ serverId: toToken?.chain || '' });

  const explorerUrl = useMemo(() => {
    if (!data?.hash || !fromChain?.scanLink) return undefined;
    return fromChain.scanLink.replace('_s_', data.hash);
  }, [data?.hash, fromChain?.scanLink]);

  const priceRatio = useMemo(() => {
    if (!fromAmount || !toAmount || !toToken) return null;
    return `${formatTokenAmount(toAmount / fromAmount)} ${getTokenSymbol(
      toToken
    )}`;
  }, [fromAmount, toAmount, toToken]);

  // Generate accordion steps based on transaction data
  const sendingStep = useMemo(
    () => getSendingStepDetails(data, isSwap, txHash || undefined),
    [data, isSwap, txHash]
  );
  const receivingStep = useMemo(
    () => getReceivingStepDetails(data, txHash || undefined),
    [data, txHash]
  );

  const handleGoToDashboard = useMemoizedFn(() => {
    if (isFailed) {
      history.push('/swap-and-bridge');
      return;
    }
    if (isDesktop) {
      const base = history.location.pathname.startsWith('/desktop/profile')
        ? history.location.pathname
        : '/desktop/profile';
      history.push(`${base}?action=activities`);
    } else {
      history.push('/dashboard');
    }
  });

  if (!txHash) return null;

  const fromUsdValue =
    fromAmount != null && fromToken?.price
      ? fromAmount * fromToken.price
      : null;
  const fromSymbol = getTokenSymbol(fromToken);

  const toUsdValue =
    toAmount != null && toToken?.price ? toAmount * toToken.price : null;
  const toSymbol = getTokenSymbol(toToken);

  const timeLineSteps: TimelineStep[] = [
    {
      title: fromAmount ? formatTokenAmount(fromAmount) : '–',
      description: (
        <div className="flex items-center gap-1 text-12 text-r-neutral-foot mt-0.5">
          {fromUsdValue != null && <span>{formatUsdValue(fromUsdValue)}</span>}
          {fromUsdValue != null && fromSymbol && (
            <span className="text-r-neutral-line">·</span>
          )}
          {fromSymbol && <span>{fromSymbol}</span>}
          {fromChain?.name && (
            <>
              <span>on</span>
              {fromChain?.logo && (
                <img
                  className="w-3 h-3 rounded-full"
                  src={fromChain.logo}
                  alt=""
                />
              )}
              <span>{fromChain.name}</span>
            </>
          )}
        </div>
      ),

      image: renderIcon(fromToken?.logo_url || '', fromChain?.logo || ''),
    },

    {
      title: isSwap ? 'Swapping' : 'Bridging',
      description: explorerUrl ? (
        <HashItem hash={data?.hash || txHash || ''} link={explorerUrl} />
      ) : undefined,
      status: swapStatusToTimelineStatus(swapStatus?.status),
    },
    {
      title: isSwap
        ? 'Receiving'
        : `Receiving on ${toChain?.name || 'destination'}`,
      description: isSwap ? '' : undefined,
      status: subStatusToTimelineStatus(
        swapStatus?.sub_status,
        swapStatus?.status
      ),
    },
    {
      title: toAmount ? formatTokenAmount(toAmount) : '–',
      description: (
        <div className="flex items-center gap-1 text-12 text-r-neutral-foot mt-0.5">
          {toUsdValue != null && <span>{formatUsdValue(toUsdValue)}</span>}
          {toUsdValue != null && toSymbol && (
            <span className="text-r-neutral-line">·</span>
          )}
          {toSymbol && <span>{toSymbol}</span>}
          {toChain?.name && (
            <>
              <span>on</span>
              {toChain?.logo && (
                <img
                  className="w-3 h-3 rounded-full"
                  src={toChain.logo}
                  alt=""
                />
              )}
              <span>{toChain.name}</span>
            </>
          )}
        </div>
      ),
      image: renderIcon(toToken?.logo_url || '', toChain?.logo || ''),
    },
  ];

  return (
    <UIContainer>
      <Container>
        <HeaderNavPage handleBack={() => history.push('/swap-and-bridge')}>
          <div className="text-primary-foreground text-xl font-medium">
            {isSwap ? 'Swap' : 'Bridge'}
          </div>
        </HeaderNavPage>

        <Content>
          <TimeLine steps={timeLineSteps} />
        </Content>

        {!isPending && (
          <Action>
            <Button
              className={clsx(
                'w-full',
                isComplete &&
                  '!bg-[#B8FF43] !text-black !border-[#B8FF43] hover:!bg-[#a0e83a]'
              )}
              onClick={handleGoToDashboard}
            >
              {isFailed ? 'Try Again' : 'Done'}
            </Button>
          </Action>
        )}
      </Container>
    </UIContainer>
  );
};

export default TxStatusPage;
