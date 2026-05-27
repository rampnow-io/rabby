import React, { useEffect, useState } from 'react';
import { useTimeout, useMemoizedFn } from 'ahooks';
import clsx from 'clsx';
import { Image } from 'antd';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { Button } from '@repo/ui/primitives';
import { FailedIcon, ProcessingIcon, SuccessIcon } from '@repo/ui';
import { fetchDepositStatus } from '../../api';
import IconUnknown from '@/ui/assets/token-default.svg';

type OverallStatus = 'pending' | 'fromSuccess' | 'allSuccess' | 'failed';
type StepState = 'loading' | 'success' | 'failed' | 'queued';

interface SubmitDepositStatusProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  chainId: string;
  fromTokenSymbol?: string;
  toTokenSymbol?: string;
  fromAmount?: string;
  toAmount?: string;
  title?: string;
  fromChainName?: string;
  toChainName?: string;
  fromTokenLogo?: string;
  toTokenLogo?: string;
}

const STATUS_META: Record<
  OverallStatus,
  { label: string; step1: StepState; step2: StepState }
> = {
  pending: { label: 'Processing', step1: 'loading', step2: 'queued' },
  fromSuccess: {
    label: 'Source confirmed',
    step1: 'success',
    step2: 'loading',
  },
  allSuccess: { label: 'Completed', step1: 'success', step2: 'success' },
  failed: { label: 'Failed', step1: 'failed', step2: 'failed' },
};

const StepIcon = ({ state }: { state: StepState }) => {
  if (state === 'success') return <SuccessIcon />;
  if (state === 'failed') return <FailedIcon />;
  if (state === 'loading') return <ProcessingIcon />;
  return <span className="text-12 text-r-neutral-foot">—</span>;
};

const TokenLogo = ({ logo, symbol }: { logo?: string; symbol?: string }) => (
  <Image
    className="w-9 h-9 rounded-full border border-r-neutral-line"
    src={logo || IconUnknown}
    fallback={IconUnknown}
    preview={false}
    alt={symbol}
  />
);

export const SubmitDepositStatus: React.FC<SubmitDepositStatusProps> = ({
  isOpen,
  onClose,
  txHash,
  chainId,
  fromTokenSymbol = 'Token',
  toTokenSymbol = 'Token',
  fromAmount = '0',
  toAmount = '0',
  title = 'Bridge Status',
  fromChainName = '',
  toChainName = '',
  fromTokenLogo = '',
  toTokenLogo = '',
}) => {
  const [status, setStatus] = useState<OverallStatus>('pending');
  const [initialising, setInitialising] = useState(true);

  const applyStatus = (str?: string) => {
    const up = (str ?? '').toUpperCase();
    if (up === 'DONE' || up === 'COMPLETED') setStatus('allSuccess');
    else if (up === 'FAILED') setStatus('failed');
    else if (up === 'FROMSUCCESS') setStatus('fromSuccess');
    else setStatus('pending');
  };

  const pollStatus = useMemoizedFn(async () => {
    if (!txHash || !chainId) return;
    try {
      const result = await fetchDepositStatus({ txHash, fromChain: chainId });
      if (result?.status) applyStatus(result.status);
    } catch {
      // ignore transient errors
    }
  });

  useEffect(() => {
    if (isOpen && txHash && chainId) {
      setStatus('pending');
      setInitialising(true);
    } else if (isOpen) {
      setInitialising(false);
    }
  }, [isOpen, txHash, chainId]);

  useTimeout(
    pollStatus,
    status === 'allSuccess' || status === 'failed' ? undefined : 60000
  );

  const meta = STATUS_META[status];
  const isDone = status === 'allSuccess' || status === 'failed';
  const isPending = !isDone;
  const shortHash = txHash ? `${txHash.slice(0, 6)}…${txHash.slice(-6)}` : '';

  return (
    <BottomFloatingSheet
      open={isOpen}
      onClose={onClose}
      header={
        <span className="text-[15px] font-medium text-r-neutral-title-1">
          {title}
        </span>
      }
      footer={
        <Button disabled={isPending} onClick={onClose} className="w-full">
          {isPending ? 'Processing…' : 'Go to Dashboard'}
        </Button>
      }
    >
      {initialising ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <ProcessingIcon />
          <span className="text-13 text-r-neutral-foot">Submitting…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* ── Token pair ── */}
          <div className="bg-r-neutral-card-1 rounded-[12px] px-4 py-4 flex items-center gap-3">
            {/* From */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <TokenLogo logo={fromTokenLogo} symbol={fromTokenSymbol} />
              <span className="text-13 font-semibold text-r-neutral-title-1 truncate w-full text-center">
                {fromAmount} {fromTokenSymbol}
              </span>
              {fromChainName ? (
                <span className="text-11 text-r-neutral-foot truncate w-full text-center">
                  {fromChainName}
                </span>
              ) : null}
            </div>

            <span className="text-r-neutral-foot text-18 shrink-0">→</span>

            {/* To */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <TokenLogo logo={toTokenLogo} symbol={toTokenSymbol} />
              <span
                className={clsx(
                  'text-13 font-semibold truncate w-full text-center',
                  status === 'allSuccess'
                    ? 'text-r-green-default'
                    : isPending
                    ? 'text-r-neutral-foot'
                    : 'text-r-red-default'
                )}
              >
                {toAmount} {toTokenSymbol}
              </span>
              {toChainName ? (
                <span className="text-11 text-r-neutral-foot truncate w-full text-center">
                  {toChainName}
                </span>
              ) : null}
            </div>
          </div>

          {/* ── Info rows ── */}
          <div className="bg-r-neutral-card-1 rounded-[12px] overflow-hidden">
            {/* Status row */}
            <div className="flex items-center justify-between px-4 py-[12px] border-b border-r-neutral-line">
              <span className="text-13 text-r-neutral-foot">Status</span>
              <div className="flex items-center gap-1.5">
                {status === 'allSuccess' ? (
                  <SuccessIcon />
                ) : status === 'failed' ? (
                  <FailedIcon />
                ) : (
                  <ProcessingIcon />
                )}
                <span
                  className={clsx(
                    'text-13 font-medium',
                    status === 'allSuccess'
                      ? 'text-r-green-default'
                      : status === 'failed'
                      ? 'text-r-red-default'
                      : 'text-r-neutral-title-1'
                  )}
                >
                  {meta.label}
                </span>
              </div>
            </div>

            {/* Step 1 */}
            <div className="flex items-center justify-between px-4 py-[12px] border-b border-r-neutral-line">
              <span className="text-13 text-r-neutral-foot">
                Step 1 · Sending
              </span>
              <StepIcon state={meta.step1} />
            </div>

            {/* Step 2 */}
            <div
              className={clsx(
                'flex items-center justify-between px-4 py-[12px]',
                shortHash && 'border-b border-r-neutral-line'
              )}
            >
              <span className="text-13 text-r-neutral-foot">
                Step 2 · Receiving
              </span>
              <StepIcon state={meta.step2} />
            </div>

            {/* Tx hash */}
            {shortHash && (
              <div className="flex items-center justify-between px-4 py-[12px]">
                <span className="text-13 text-r-neutral-foot">
                  Transaction ID
                </span>
                <span className="text-13 font-medium text-r-neutral-title-1 font-mono">
                  {shortHash}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </BottomFloatingSheet>
  );
};

export default SubmitDepositStatus;
