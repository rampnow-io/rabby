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

  const formatDisplayAmount = (amount: string, maxDecimals = 3) => {
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

  const displayFromAmount = useMemo(() => formatDisplayAmount(fromAmount, 3), [
    fromAmount,
  ]);

  const displayToAmount = useMemo(() => formatDisplayAmount(toAmount, 3), [
    toAmount,
  ]);

  const displayFromUsdValue = useMemo(() => {
    const value = new BigNumber(fromUsdValue || 0)
      .toFixed(3, BigNumber.ROUND_DOWN)
      .toString();
    return formatUsdValue(value);
  }, [fromUsdValue]);

  const displayToUsdValue = useMemo(() => {
    const value = new BigNumber(toUsdValue || 0)
      .toFixed(3, BigNumber.ROUND_DOWN)
      .toString();
    return formatUsdValue(value);
  }, [toUsdValue]);

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
    return formatDisplayAmount(
      new BigNumber(adjustedToAmount).times(0.99).toString(10),
      3
    );
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

      {/* Token Card */}
      <div className="bg-gray-100 rounded-2xl px-6 py-4 mb-6 flex items-center justify-between gap-4">
        {/* From Token */}
        <div className="flex-1">
          <div className="text-sm text-gray-500 mb-1">
            {displayFromUsdValue}
          </div>
          <div className="text-gray-900 leading-tight">
            <div className="font-semibold text-[18px]">{displayFromAmount}</div>
            <div className="font-semibold text-[18px]">{fromToken?.symbol}</div>
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
          <div className="text-sm text-gray-500 mb-1">{displayToUsdValue}</div>
          <div className="text-green-500 leading-tight">
            <div className="font-semibold text-[18px]">{displayToAmount}</div>
            <div className="font-semibold text-[18px]">{toToken?.symbol}</div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-2">
        {/* Minimum Received */}
        <div className="flex justify-between items-start gap-4 py-1 text-sm">
          <span className="text-primary-foreground text-sm font-medium leading-[1.25]">
            Minimum received
          </span>
          <span className="text-secondary-foreground text-sm font-normal text-right leading-[1.25]">
            {minimumReceived} {toToken?.symbol}
          </span>
        </div>

        {/* Swapping/Bridging Via */}
        <div className="flex justify-between items-center gap-4 py-1 rounded-lg text-sm">
          <span className="text-primary-foreground text-sm font-medium">
            {type === 'swap' ? 'Swapping via' : 'Bridging via'}
          </span>
          <span className="text-secondary-foreground text-sm font-normal text-right">
            {sourceName}
          </span>
        </div>

        {/* Bridge-specific rows */}
        {type === 'bridge' && (
          <>
            {/* Network */}
            <div className="flex justify-between items-center gap-4 py-1 text-sm">
              <span className="text-primary-foreground text-sm font-medium">
                Network
              </span>
              <div className="flex items-center justify-end gap-1">
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
            <div className="flex justify-between items-center gap-4 py-1 rounded-lg text-sm">
              <span className="text-primary-foreground text-sm font-medium">
                Token
              </span>
              <div className="flex items-center justify-end gap-1">
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
            <div className="flex justify-between items-center gap-4 py-1 text-sm">
              <span className="text-primary-foreground text-sm font-medium">
                Route
              </span>
              <div className="flex items-center justify-end gap-2">
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
          <div className="flex justify-between items-center gap-4 py-1 rounded-lg text-sm">
            <span className="text-primary-foreground text-sm font-medium">
              {sourceName} fee
            </span>
            <span className="text-secondary-foreground text-sm font-normal text-right">
              {protocolFeeAmount} {selectedQuote.gas_fee.symbol || 'ETH'}
            </span>
          </div>
        )}
        <div className=" mb-6">
          <div className="flex justify-between items-center gap-4 text-sm font-normal">
            <span className="text-primary-foreground text-sm font-medium">
              Network fee
            </span>
            <div className="flex items-center justify-end gap-2 text-secondary-foreground text-sm font-normal">
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
