import React, { useMemo, useState } from 'react';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import { formatUsdValue } from '@/ui/utils';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { DirectSignToConfirmBtn } from '@/ui/component/ToConfirmButton';
import { Button } from '@repo/ui/primitives';

interface ReviewSwapBridgeProps {
  fromToken: TokenItem | undefined;
  toToken: TokenItem | undefined;
  fromAmount: string;
  toAmount: string;
  fromPrice?: number;
  toPrice?: number;
  selectedQuote: any;
  loading?: boolean;
  onConfirm: () => void;
  type: 'swap' | 'bridge';
  // DirectSignToConfirmBtn props
  btnText?: string;
  btnDisabled?: boolean;
  showRiskTips?: boolean;
  accountType?: string;
  riskReset?: boolean;
  canUseDirectSubmitTx?: boolean;
  isSupportedChain?: boolean;
  // Fee props
  rabbyFeeDisplay?: string;
  networkFeeDisplay?: string;
  estimatedTimeDisplay?: string;
  // Route selector props
  routes?: Array<{
    id: string;
    name: string;
    logo: string;
    fee?: string;
    duration?: string;
    type: 'swap' | 'bridge';
  }>;
  selectedRouteId?: string;
  onSelectRoute?: (route: any) => void;
}

const ReviewSwapBridge: React.FC<ReviewSwapBridgeProps> = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  fromPrice = 0,
  toPrice = 0,
  selectedQuote,
  loading = false,
  onConfirm,
  type,
  btnText = type === 'swap' ? 'Swap' : 'Bridge',
  btnDisabled = false,
  showRiskTips = false,
  accountType,
  riskReset = false,
  canUseDirectSubmitTx = false,
  isSupportedChain = false,
  rabbyFeeDisplay = '$0',
  networkFeeDisplay = '~15secs',
  estimatedTimeDisplay,
}) => {
  const { t } = useTranslation();

  const fromUsdValue = useMemo(() => {
    try {
      return new BigNumber(fromAmount).times(fromPrice || 0).toNumber();
    } catch {
      return 0;
    }
  }, [fromAmount, fromPrice]);

  const toUsdValue = useMemo(() => {
    try {
      return new BigNumber(toAmount).times(toPrice || 0).toNumber();
    } catch {
      return 0;
    }
  }, [toAmount, toPrice]);

  const sourceName = useMemo(() => {
    if (type === 'bridge' && selectedQuote?.aggregator) {
      return selectedQuote.aggregator.name || '';
    }
    if (type === 'swap' && selectedQuote?.dexQuote) {
      return selectedQuote.dexQuote.name || '';
    }
    return '';
  }, [selectedQuote, type]);

  const minimumReceived = useMemo(() => {
    if (!toToken || !selectedQuote) return '0';
    // For swap quotes, toAmount is RAW, needs decimal adjustment
    // For bridge quotes, toAmount is already decimal-adjusted
    const adjustedToAmount =
      type === 'swap'
        ? new BigNumber(selectedQuote.to_token_amount)
            .div(10 ** toToken.decimals)
            .toString(10)
        : String(selectedQuote.to_token_amount);

    return new BigNumber(adjustedToAmount)
      .times(0.99) // Assuming 1% slippage for display
      .toFixed(8)
      .toString();
  }, [toToken, selectedQuote, type]);

  return (
    <div className="w-full">
      <div className="text-center text-lg font-semibold mb-6">
        Review & {type === 'swap' ? 'Swap' : 'Bridge'}
      </div>

      <div className="flex items-center justify-between gap-3 mb-8 px-4">
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 w-full justify-center">
            {fromToken?.logo_url && (
              <img
                src={fromToken.logo_url}
                alt={fromToken.symbol}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            )}
            <span className="font-semibold text-gray-900 truncate">
              {fromAmount} {fromToken?.symbol}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {formatUsdValue(fromUsdValue)}
          </span>
        </div>

        <div className="text-2xl text-gray-400 flex-shrink-0">→</div>

        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 w-full justify-center">
            {toToken?.logo_url && (
              <img
                src={toToken.logo_url}
                alt={toToken?.symbol}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            )}
            <span className="font-semibold text-green-600 truncate">
              {toAmount} {toToken?.symbol}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {formatUsdValue(toUsdValue)}
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-8 px-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">Minimum received</span>
          <span className="text-sm font-medium text-gray-900">
            {minimumReceived} {toToken?.symbol}
          </span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            {type === 'swap' ? 'Swapping via' : 'Bridging via'}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {sourceName}
          </span>
        </div>

        {type === 'bridge' && selectedQuote?.duration ? (
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Estimated time</span>
            <span className="text-sm font-medium text-gray-900">
              ~{selectedQuote.duration}
            </span>
          </div>
        ) : null}

        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">Rabby fee</span>
          <span className="text-sm font-medium text-gray-900">
            {rabbyFeeDisplay}
          </span>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium">
          <span>Network fee</span>
          <span>{networkFeeDisplay}</span>
          {estimatedTimeDisplay && (
            <>
              <span>•</span>
              <span>{estimatedTimeDisplay}</span>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        {canUseDirectSubmitTx && accountType && isSupportedChain ? (
          <DirectSignToConfirmBtn
            disabled={btnDisabled}
            title={btnText}
            onConfirm={onConfirm}
            showRiskTips={showRiskTips && !btnDisabled}
            accountType={accountType}
            riskReset={riskReset}
            loading={loading}
            buttonClassName="h-[56px] rounded-full bg-[#B6E632] text-black text-lg font-semibold hover:bg-[#A5D32E] transition-colors"
          />
        ) : (
          <Button onClick={onConfirm} disabled={loading || btnDisabled}>
            <span>
              {loading
                ? `${type === 'swap' ? 'Swapping' : 'Bridging'}...`
                : `${type === 'swap' ? 'Swap' : 'Bridge'} ${
                    fromToken?.symbol
                  } to ${toToken?.symbol}`}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReviewSwapBridge;
