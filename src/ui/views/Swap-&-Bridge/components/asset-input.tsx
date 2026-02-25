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
}) => {
  const [localAmount, setLocalAmount] = useState(() => value.amount);

  useEffect(() => {
    setLocalAmount(formatCurrency(value.amount, undefined, { noSymbol: true }));
  }, [value.amount]);

  const symbol = '';
  const defaultDenominations: string[] = [];

  useEffect(() => {
    onChange?.({ amount: localAmount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAmount]);

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
                  value={localAmount}
                  onChange={(e) => setLocalAmount(e.target.value)}
                  placeholder={amountPlaceholder}
                  readOnly={readOnly}
                  className={'border-none p-0 outline-none'}
                  subClassName="text-[35px] text-primary-foreground font-semibold bg-inherit"
                />
                {showMax && onMax ? (
                  <button
                    type="button"
                    onClick={onMax}
                    className="mt-2 h-7 rounded-full bg-[#EEF2FF] px-3 text-xs font-semibold text-[#3B82F6]"
                  >
                    Max
                  </button>
                ) : null}
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
          value.amount &&
          defaultDenominations?.map((data, index) => {
            return (
              <div
                key={index}
                onClick={() => setLocalAmount(data)}
                className="bg-chip cursor-pointer text-sm border-inherit rounded-3xl px-3 py-0.5"
              >
                {symbol}
                {data}
              </div>
            );
          })}
      </div>
    </label>
  );
};

export default React.memo(AssetInput);
