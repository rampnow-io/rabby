import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useInterval, useMemoizedFn } from 'ahooks';
import { useTranslation } from 'react-i18next';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { FailedIcon, ProcessingIcon, SuccessIcon } from '@repo/ui';
import { fetchSubmitDeposit, fetchDepositStatus } from '../../api';
import { ReactComponent as RcIconQueuedCC } from '@/ui/assets/bridge/IconQueuedCC.svg';
import clsx from 'clsx';

type StepStatusType = 'loading' | 'success' | 'failed' | 'queued' | 'dash';

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

// Step status icon component
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

// Two-step status indicator
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
  fromChainName = 'Source Chain',
  toChainName = 'Destination Chain',
  fromTokenLogo = '',
  toTokenLogo = '',
}) => {
  const { t } = useTranslation();

  const [depositId, setDepositId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    'pending' | 'fromSuccess' | 'allSuccess' | 'failed'
  >('pending');
  const [step1Status, setStep1Status] = useState<StepStatusType>('loading');
  const [step2Status, setStep2Status] = useState<StepStatusType>('dash');
  const [loading, setLoading] = useState(true);

  // Submit deposit and get initial status
  const submitDeposit = useMemoizedFn(async () => {
    try {
      console.log('[SubmitDepositStatus] Submitting deposit:', {
        txHash,
        chainId,
      });

      let result;
      try {
        result = await fetchSubmitDeposit(chainId, txHash);
      } catch (apiError) {
        console.error('[SubmitDepositStatus] API call error:', apiError);
        throw new Error(
          `API error: ${
            apiError instanceof Error ? apiError.message : String(apiError)
          }`
        );
      }

      console.log(
        '[SubmitDepositStatus] Submit result:',
        result,
        'type:',
        typeof result
      );

      if (!result) {
        throw new Error('API returned empty response');
      }

      if (!result.deposit_id) {
        console.warn(
          '[SubmitDepositStatus] Missing deposit_id in response:',
          result
        );
        throw new Error(
          `Invalid API response: missing deposit_id. Response: ${JSON.stringify(
            result
          )}`
        );
      }

      console.log(
        '[SubmitDepositStatus] Setting deposit ID:',
        result.deposit_id
      );
      setDepositId(result.deposit_id);
      setLoading(false);

      // Apply initial status based on API response
      const statusUpper = result.status?.toUpperCase();
      if (statusUpper === 'DONE') {
        setStatus('allSuccess');
        setStep1Status('success');
        setStep2Status('success');
      } else if (statusUpper === 'FAILED') {
        setStatus('failed');
        setStep1Status('failed');
        setStep2Status('dash');
      } else if (statusUpper === 'NOT_FOUND') {
        setStatus('pending');
        setStep1Status('loading');
        setStep2Status('dash');
      } else {
        // PENDING or default
        setStatus('pending');
        setStep1Status('loading');
        setStep2Status('dash');
      }
    } catch (err) {
      console.error('[SubmitDepositStatus] Error submitting deposit:', err);
      setLoading(false);
    }
  });

  // Poll for status updates
  const pollStatus = useMemoizedFn(async () => {
    if (!txHash || !chainId) return;

    try {
      console.log('[SubmitDepositStatus] Polling status for:', txHash);
      const result = await fetchDepositStatus({
        txHash: txHash,
        fromChain: chainId,
      });
      console.log('[SubmitDepositStatus] Status update:', result);

      const statusUpper = result.status?.toUpperCase();

      if (statusUpper === 'DONE') {
        setStatus('allSuccess');
        setStep1Status('success');
        setStep2Status('success');
      } else if (statusUpper === 'FAILED') {
        setStatus('failed');
        setStep1Status('failed');
        setStep2Status('dash');
      } else if (statusUpper === 'NOT_FOUND') {
        setStatus('pending');
        setStep1Status('loading');
        setStep2Status('dash');
      } else {
        // PENDING or default
        setStatus('pending');
        setStep1Status('loading');
        setStep2Status('dash');
      }
    } catch (err) {
      console.error('[SubmitDepositStatus] Error polling status:', err);
    }
  });

  // Initial submit on mount when drawer opens
  useEffect(() => {
    if (isOpen && txHash && chainId) {
      console.log(
        '[SubmitDepositStatus] Drawer opened, submitting deposit with:',
        {
          txHash,
          chainId,
        }
      );
      submitDeposit();
    } else if (isOpen) {
      console.warn(
        '[SubmitDepositStatus] Drawer opened but missing required props:',
        {
          txHash,
          chainId,
          isOpen,
        }
      );
      setLoading(false);
    }
  }, [isOpen, txHash, chainId, submitDeposit]);

  // Poll for status updates every 5 seconds
  useInterval(
    pollStatus,
    status === 'allSuccess' || status === 'failed' ? undefined : 5000
  );

  const getStatusLabel = (stepStatus: StepStatusType) => {
    switch (stepStatus) {
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
              Queued
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

  return (
    <>
      {isOpen && (
        <BottomFloatingSheet open={isOpen} onClose={onClose} hideCloseButton>
          <div className="flex flex-col gap-6 px-16 py-16">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <ProcessingIcon />
                <span className="text-15 font-medium text-r-neutral-foot">
                  {t('page.bridge.submitting') || 'Submitting...'}
                </span>
              </div>
            )}

            {/* Status Content */}
            {!loading && (
              <>
                {/* Status header */}
                <div className="flex flex-col items-center gap-3 pt-2 mb-16">
                  <div className="flex items-center justify-center">
                    {status === 'pending' && <ProcessingIcon />}
                    {status === 'fromSuccess' && <ProcessingIcon />}
                    {(status === 'allSuccess' || status === 'failed') &&
                      (status === 'allSuccess' ? (
                        <SuccessIcon />
                      ) : (
                        <FailedIcon />
                      ))}
                  </div>
                  <h2
                    className={clsx('text-18 font-semibold', {
                      'text-r-neutral-title-1':
                        status === 'pending' || status === 'fromSuccess',
                      'text-r-green-default': status === 'allSuccess',
                      'text-r-red-default': status === 'failed',
                    })}
                  >
                    {status === 'pending' && 'Transaction Processing…'}
                    {status === 'fromSuccess' && 'Source Confirmed'}
                    {status === 'allSuccess' && 'Transaction Complete'}
                    {status === 'failed' && 'Transaction Failed'}
                  </h2>
                </div>

                {/* Token route with chains */}
                {fromTokenSymbol && toTokenSymbol && (
                  <div className="flex flex-col gap-4">
                    {/* From Token and Chain */}
                    <div className="px-4 py-4 bg-r-neutral-card-1 rounded-[8px]">
                      <div className="text-12 text-r-neutral-foot mb-4">
                        From
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                          {fromTokenLogo && (
                            <img
                              src={fromTokenLogo}
                              alt={fromTokenSymbol}
                              className="w-[32px] h-[32px] rounded-full flex-shrink-0"
                            />
                          )}
                          <div className="flex flex-col gap-2">
                            <span className="text-13 font-semibold text-r-neutral-title-1">
                              {fromAmount} {fromTokenSymbol}
                            </span>
                            <span className="text-11 text-r-neutral-foot">
                              {fromChainName}
                            </span>
                          </div>
                        </div>
                        {status === 'allSuccess' && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <span className="text-13 text-r-neutral-foot">↓</span>
                    </div>

                    {/* To Token and Chain */}
                    <div
                      className={clsx(
                        'px-4 py-4 bg-r-neutral-card-1 rounded-[8px]',
                        {
                          'opacity-50': status === 'pending',
                        }
                      )}
                    >
                      <div className="text-12 text-r-neutral-foot mb-4">To</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                          {toTokenLogo && (
                            <img
                              src={toTokenLogo}
                              alt={toTokenSymbol}
                              className="w-[32px] h-[32px] rounded-full flex-shrink-0"
                            />
                          )}
                          <div className="flex flex-col gap-2">
                            <span
                              className={clsx(
                                'text-13 font-semibold',
                                status === 'pending'
                                  ? 'text-r-neutral-foot'
                                  : 'text-r-neutral-title-1'
                              )}
                            >
                              {toAmount} {toTokenSymbol}
                            </span>
                            <span className="text-11 text-r-neutral-foot">
                              {toChainName}
                            </span>
                          </div>
                        </div>
                        {status === 'allSuccess' && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction hash - using txHash since we have it */}
                {txHash && (
                  <div className="px-12 py-12 flex items-center justify-between bg-r-neutral-card-1 rounded-[8px] mb-16">
                    <span className="text-12 text-r-neutral-foot">Tx Hash</span>
                    <span className="text-12 text-r-neutral-title-1 font-medium">
                      {txHash.substring(0, 6)}...
                      {txHash.substring(txHash.length - 6)}
                    </span>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={onClose}
                  disabled={status === 'pending' || status === 'fromSuccess'}
                  className={clsx(
                    'w-full px-12 py-12 rounded-[8px] font-medium text-15 transition-all',
                    {
                      'bg-r-blue-default text-white':
                        status === 'pending' || status === 'fromSuccess',
                      'bg-r-green-default text-white': status === 'allSuccess',
                      'bg-r-red-default text-white': status === 'failed',
                      'opacity-50 cursor-not-allowed':
                        status === 'pending' || status === 'fromSuccess',
                    }
                  )}
                >
                  {status === 'pending' || status === 'fromSuccess'
                    ? 'Processing…'
                    : 'Go to Dashboard'}
                </button>
              </>
            )}
          </div>
        </BottomFloatingSheet>
      )}
    </>
  );
};

export default SubmitDepositStatus;
