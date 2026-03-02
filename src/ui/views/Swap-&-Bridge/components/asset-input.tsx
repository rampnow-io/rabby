'use client';

import { Input, Skeleton } from '@repo/ui/primitives';
import { cn, formatCurrency } from '@repo/utils';

import React, { useEffect, useState } from 'react';

import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { CHAINS_ENUM } from '@/types/chain';
import AssetSelector from './asset-selector';

export interface AssetValue {
  amount: string;
  currency?: TokenItem;
  chain?: CHAINS_ENUM;
}

interface AssetInputProps {
  assetTitle: string;
  value: AssetValue;
  error?: string;
  debounceDelay?: number;
  onChange?: (params: Partial<AssetValue>) => void;
  amountPlaceholder?: string;
  readOnly?: boolean;
  variant?: 'source' | 'destination';
  onChainChange?: (chain: CHAINS_ENUM) => void;
  onTokenChange?: (token: any) => void;
  selectionType?: 'from' | 'to';
  fromChain?: CHAINS_ENUM;
  fromToken?: TokenItem;
  showMax?: boolean;
  onMax?: () => void;
  maxAmount?: string;
}

const variantStyle = {
  source: 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] h-[122px] ',
  destination: 'h-full',
};

const AssetInput: React.FC<AssetInputProps> = ({
  assetTitle,
  amountPlaceholder = '',
  error,
  value,
  onChange,
  debounceDelay = 750,
  readOnly = false,
  variant,
  onChainChange,
  onTokenChange,
  selectionType = 'from',
  fromChain,
  fromToken,
  showMax = false,
  onMax,
  maxAmount,
}) => {
  const [localAmount, setLocalAmount] = useState(() => value.amount);

  // Sync display value from parent
  useEffect(() => {
    setLocalAmount(value.amount);
  }, [value.amount]);

  const symbol = '';
  
  const formatDisplayAmount = (amount: string) => {
    if (!amount) return '';
    const [intPart, decimalPart] = amount.split('.');
    if (!decimalPart) return intPart || '0';
    // Truncate decimal part to 4 characters
    return `${intPart}.${decimalPart.substring(0, 4)}`;
  };

  const displayAmount = formatDisplayAmount(localAmount);

  const percentageOptions = [
    { label: '25%', value: 0.25 },
    { label: '75%', value: 0.75 },
    { label: 'Max', value: 1 },
  ];

  const handlePercentageClick = (percentage: number) => {
    if (percentage === 1) {
      // Max button
      if (onMax) {
        onMax();
      } else if (maxAmount && !readOnly) {
        const calculatedAmount = parseFloat(maxAmount).toString();
        setLocalAmount(calculatedAmount);
        onChange?.({ amount: calculatedAmount });
      }
    } else {
      // 25% and 75% buttons
      if (maxAmount && !readOnly) {
        const calculatedAmount = (
          parseFloat(maxAmount) * percentage
        ).toString();
        setLocalAmount(calculatedAmount);
        onChange?.({ amount: calculatedAmount });
      }
    }
  };

  // Handle input change - only for source (non-readOnly)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalAmount(newValue);
    if (!readOnly) {
      onChange?.({ amount: newValue });
    }
  };

  return (
    <label
      className={cn(
        'mt-px flex flex-col gap-1.5 items-start rounded-xl p-[18px] w-full',
        variantStyle[variant ?? 'source']
      )}
    >
      <div className="flex w-full gap-x-4">
        <div className="shrink grow">
          <>
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 items-start">
                <p className="text-lg pt-2 font-normal text-[#A1A1AA]">
                  {symbol}
                </p>
                <Input
                  value={displayAmount}
                  onChange={handleInputChange}
                  placeholder="0"
                  readOnly={readOnly}
                  className={'border-none p-0 outline-none'}
                  subClassName="text-[35px] text-primary-foreground font-normal bg-inherit"
                />
              </div>

              {error ? (
                <p className="text-red-600 text-[10px]">{error}</p>
              ) : null}
            </div>
          </>
        </div>
        <AssetSelector
          className="shrink-0 grow-0 pt-1"
          title={assetTitle}
          selectedToken={value.currency}
          selectedChain={value.chain}
          onSelect={(asset) => onChange?.(asset as any)}
          onChainChange={onChainChange}
          onTokenChange={onTokenChange}
          selectionType={selectionType}
          fromChain={fromChain}
          fromToken={fromToken}
        />
      </div>
      <div className="flex gap-1.5">
        {!error &&
          variant === 'source' &&
          (maxAmount || onMax) &&
          percentageOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handlePercentageClick(option.value)}
              className="bg-chip cursor-pointer text-sm border-inherit rounded-3xl px-3 py-0.5 hover:opacity-80 transition-opacity"
            >
              {option.label}
            </div>
          ))}
      </div>
    </label>
  );
};

export default React.memo(AssetInput);
