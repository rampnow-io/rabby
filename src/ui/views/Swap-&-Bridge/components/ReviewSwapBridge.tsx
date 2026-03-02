import React, { useMemo, useState } from 'react';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import { formatUsdValue } from '@/ui/utils';
import { useTranslation } from 'react-i18next';
import { DirectSignToConfirmBtn } from '@/ui/component/ToConfirmButton';
import { Button } from '@repo/ui/primitives';
import { Dropdown, Menu } from 'antd';
import { CHAINS_ENUM } from '@/types/chain';
import { findChainByEnum } from '@/utils/chain';
import { ReactComponent as RcIconSettings } from 'ui/assets/swap/settings.svg';
import { ReactComponent as RcIconArrowRight } from 'ui/assets/arrow-right-cc.svg';

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
  btnText?: string;
  btnDisabled?: boolean;
  showRiskTips?: boolean;
  accountType?: string;
  riskReset?: boolean;
  canUseDirectSubmitTx?: boolean;
  isSupportedChain?: boolean;
  rabbyFeeDisplay?: string;
  networkFeeDisplay?: string;
  estimatedTimeDisplay?: string;
  fromChain?: CHAINS_ENUM;
  toChain?: CHAINS_ENUM;
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
  rabbyFeeDisplay = '$4.61',
  networkFeeDisplay = '$4.61',
  estimatedTimeDisplay = '~15secs',
  fromChain,
  toChain,
}) => {
  const { t } = useTranslation();
  const [gasSpeed, setGasSpeed] = useState('Normal');

  const fromChainObj = useMemo(
    () => (fromChain ? findChainByEnum(fromChain) : undefined),
    [fromChain]
  );

  const toChainObj = useMemo(
    () => (toChain ? findChainByEnum(toChain) : undefined),
    [toChain]
  );

  const formatDisplayAmount = (amount: string, maxDecimals = 6) => {
    try {
      const bn = new BigNumber(amount || 0);
      if (!bn.isFinite()) return amount;
      if (bn.isZero()) return '0';

      const fixed = bn.toFixed(maxDecimals, BigNumber.ROUND_DOWN);
      const trimmed = fixed
        .replace(/(\.\d*?[1-9])0+$/, '$1')
        .replace(/\.0+$/, '');

      const [intPart, decimalPart] = trimmed.split('.');
      if ((intPart || '').length > 8) {
        return `${(intPart || '').slice(0, 8)}...`;
      }

      if (!decimalPart) return intPart;
      return `${intPart}.${decimalPart}`;
    } catch {
      return amount;
    }
  };

  const fromUsdValue = useMemo(() => {
    try {
      return new BigNumber(fromAmount).times(fromPrice).toNumber();
    } catch {
      return 0;
    }
  }, [fromAmount, fromPrice]);

  const toUsdValue = useMemo(() => {
    try {
      return new BigNumber(toAmount).times(toPrice).toNumber();
    } catch {
      return 0;
    }
  }, [toAmount, toPrice]);

  const displayFromAmount = useMemo(() => formatDisplayAmount(fromAmount, 6), [
    fromAmount,
  ]);

  const displayToAmount = useMemo(() => formatDisplayAmount(toAmount, 6), [
    toAmount,
  ]);

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
    const adjustedToAmount =
      type === 'swap'
        ? new BigNumber(selectedQuote.to_token_amount)
            .div(10 ** toToken.decimals)
            .toString(10)
        : String(selectedQuote.to_token_amount);
    return new BigNumber(adjustedToAmount).times(0.99).toFixed(8).toString();
  }, [toToken, selectedQuote, type]);

  const protocolFeeAmount = useMemo(() => {
    if (type === 'bridge' && selectedQuote?.gas_fee) {
      return new BigNumber(selectedQuote.gas_fee.amount || 0)
        .div(10 ** 18)
        .toFixed(10)
        .toString();
    }
    return '0';
  }, [selectedQuote, type]);

  const gasSpeedMenu = (
    <Menu
      selectedKeys={[gasSpeed]}
      onClick={({ key }) => setGasSpeed(key)}
      items={[
        { key: 'Slow', label: 'Slow' },
        { key: 'Normal', label: 'Normal' },
        { key: 'Fast', label: 'Fast' },
      ]}
    />
  );

  return (
    <div className="w-full">
      {/* Header */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Review & {type === 'swap' ? 'Swap' : 'Bridge'}
      </h2>

      {/* Token Card */}
      <div className="bg-gray-100 rounded-2xl px-6 py-4 mb-6 flex items-center justify-between gap-4">
        {/* From Token */}
        <div className="flex-1">
          <div className="text-sm text-gray-500 mb-1">
            {formatUsdValue(fromUsdValue)}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {displayFromAmount} {fromToken?.symbol}
            </span>
          </div>
        </div>

        {/* Token Images + Arrow */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-sm flex">
            {/* Left Half */}
            <div className="w-1/2 h-full overflow-hidden">
              {fromToken?.logo_url && (
                <img
                  src={fromToken.logo_url}
                  alt={fromToken.symbol}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Right Half */}
            <div className="w-1/2 h-full overflow-hidden">
              {toToken?.logo_url && (
                <img
                  src={toToken.logo_url}
                  alt={toToken.symbol}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Small Badge Bottom Right (optional) */}
        </div>

        {/* To Token */}
        <div className="flex-1 text-right">
          <div className="text-sm text-gray-500 mb-1">
            {formatUsdValue(toUsdValue)}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <span className="font-semibold text-green-500">
              {displayToAmount} {toToken?.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2">
        {/* Minimum Received */}
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-gray-500">Minimum received</span>
          <span className="text-gray-700 font-medium">
            {minimumReceived} {toToken?.symbol}
          </span>
        </div>

        {/* Swapping/Bridging Via */}
        <div className="flex justify-between items-center px-4 py-3 rounded-lg text-sm">
          <span className="text-gray-500">
            {type === 'swap' ? 'Swapping via' : 'Bridging via'}
          </span>
          <span className="text-gray-700 font-medium">{sourceName}</span>
        </div>

        {/* Bridge-specific rows */}
        {type === 'bridge' && (
          <>
            {/* Network */}
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-gray-500">Network</span>
              <div className="flex items-center gap-1">
                {fromChainObj?.logo && (
                  <img
                    src={fromChainObj.logo}
                    alt={fromChainObj.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <RcIconArrowRight className="w-3 h-3 text-gray-400" />
                {toChainObj?.logo && (
                  <img
                    src={toChainObj.logo}
                    alt={toChainObj.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
              </div>
            </div>

            {/* Token */}
            <div className="flex justify-between items-center px-4 py-3 rounded-lg text-sm">
              <span className="text-gray-500">Token</span>
              <div className="flex items-center gap-1">
                {fromToken?.logo_url && (
                  <img
                    src={fromToken.logo_url}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <RcIconArrowRight className="w-3 h-3 text-gray-400" />
                {toToken?.logo_url && (
                  <img
                    src={toToken.logo_url}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                )}
              </div>
            </div>

            {/* Route */}
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-gray-500">Route</span>
              <div className="flex items-center gap-2">
                {fromChainObj?.logo && (
                  <img
                    src={fromChainObj.logo}
                    alt={fromChainObj.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <RcIconArrowRight className="w-3 h-3 text-gray-400" />
                {selectedQuote?.aggregator?.logo_url && (
                  <img
                    src={selectedQuote.aggregator.logo_url}
                    alt={selectedQuote.aggregator.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <RcIconArrowRight className="w-3 h-3 text-gray-400" />
                {toChainObj?.logo && (
                  <img
                    src={toChainObj.logo}
                    alt={toChainObj.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Protocol Fee */}
        {type === 'bridge' && selectedQuote?.gas_fee && (
          <div className="flex justify-between items-center px-4 py-3  rounded-lg text-sm">
            <span className="text-gray-500">{sourceName} fee</span>
            <span className="text-gray-700 font-medium">
              {protocolFeeAmount} {selectedQuote.gas_fee.symbol || 'ETH'}
            </span>
          </div>
        )}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
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
      </div>

      {/* Button */}
      <div>
        {canUseDirectSubmitTx && accountType && isSupportedChain ? (
          <DirectSignToConfirmBtn
            disabled={btnDisabled}
            title={btnText}
            onConfirm={onConfirm}
            showRiskTips={showRiskTips && !btnDisabled}
            accountType={accountType}
            riskReset={riskReset}
            loading={loading}
            buttonClassName="h-12 rounded-full bg-green-400 text-black font-semibold text-base hover:bg-green-500 transition-colors w-full"
          />
        ) : (
          <Button
            onClick={onConfirm}
            disabled={loading || btnDisabled}
            className="w-full h-12 rounded-full bg-green-400 text-black font-semibold"
          >
            {loading
              ? `${type === 'swap' ? 'Swapping' : 'Bridging'}...`
              : btnText || `Review & ${type === 'swap' ? 'Swap' : 'Bridge'}`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReviewSwapBridge;
