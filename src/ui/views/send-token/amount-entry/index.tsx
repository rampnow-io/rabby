import React, { useMemo, useState } from 'react';
import { TokenItem, GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import TokenAmountInput from '@/ui/component/TokenAmountInput';
import { Input, InputSize, Separator } from '@repo/ui/primitives';

interface AmountEntryProps {
  token: TokenItem | null;
  value?: string;
  isLoading?: boolean;
  initLoading?: boolean;
  onChange?(amount: string): void;
  onTokenChange(token: TokenItem): void;
  chainId?: string;
  excludeTokens?: TokenItem['id'][];
  insufficientError?: boolean;
  placeholder?: string;
  balanceNumText?: string;
  handleClickMaxButton?: () => void;
  disableItemCheck?: (
    token: TokenItem
  ) => {
    disable: boolean;
    cexId?: string;
    reason: string;
    shortReason: string;
  };
  gasList?: GasLevel[];
  onGasChange?: (gasLevel: GasLevel) => void;
  recipientAddress?: string;
}

const AmountEntry: React.FC<AmountEntryProps> = ({
  token,
  value,
  isLoading,
  initLoading,
  onChange,
  onTokenChange,
  chainId,
  excludeTokens,
  insufficientError,
  placeholder,
  balanceNumText,
  handleClickMaxButton,
  disableItemCheck,
  gasList = [],
  onGasChange,
  recipientAddress = '',
}) => {
  const [selectedGasLevel, setSelectedGasLevel] = useState<string>('normal');

  const sortedGasList = useMemo(() => {
    const SORT_SCORE = { slow: 1, normal: 2, fast: 3, custom: 4 };
    return [...gasList].sort((a, b) => {
      const v1 = SORT_SCORE[a.level as keyof typeof SORT_SCORE] || 99;
      const v2 = SORT_SCORE[b.level as keyof typeof SORT_SCORE] || 99;
      return v1 - v2;
    });
  }, [gasList]);

  // Auto-select normal gas level when list loads
  React.useEffect(() => {
    if (gasList.length > 0 && !selectedGasLevel) {
      const normalGas = gasList.find((g) => g.level === 'normal') || gasList[0];
      setSelectedGasLevel(normalGas.level);
      onGasChange?.(normalGas);
    }
  }, [gasList, selectedGasLevel, onGasChange]);

  const gasLevelNameMap: Record<string, string> = {
    slow: 'Slow',
    normal: 'Standard',
    fast: 'Fast',
    custom: 'Custom',
  };

  const handleGasLevelSelect = (gas: GasLevel) => {
    setSelectedGasLevel(gas.level);
    onGasChange?.(gas);
  };

  return (
    <div className="flex flex-col gap-5 ">
      <div
        className={`flex items-center gap-3 px-2 bg-r-neutral-bg-1 rounded-lg border ${'border-r-neutral-line'}`}
      >
        <label className="text-14 flex items-center text-secondary-foreground justify-center font-medium min-w-8">
          To
        </label>
        <Separator orientation="vertical" />
        <Input
          placeholder="Wallet Address (0x...)"
          value={recipientAddress}
          sizeVariant={InputSize.SM}
          readOnly
          className="flex-1 text-14 border-0 outline-0 bg-transparent p-0"
        />
      </div>
      <TokenAmountInput
        token={token}
        value={value}
        isLoading={isLoading}
        initLoading={initLoading}
        onChange={onChange}
        onTokenChange={onTokenChange}
        chainId={chainId}
        excludeTokens={excludeTokens}
        insufficientError={insufficientError}
        placeholder={placeholder}
        balanceNumText={balanceNumText}
        handleClickMaxButton={handleClickMaxButton}
        disableItemCheck={disableItemCheck}
      />

      {gasList && gasList.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-13 font-semibold text-r-neutral-body uppercase tracking-wider mb-3">
            Network Fee
          </div>
          {sortedGasList.map((gas) => {
            const isSelected = selectedGasLevel === gas.level;
            const gasPrice = new BigNumber(gas.price / 1e9).toFixed(2);
            const estimatedTime = Math.ceil(gas.estimated_seconds / 60);

            return (
              <div
                key={gas.level}
                className={`p-3.5 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${
                  isSelected
                    ? 'border border-r-blue-default bg-r-blue-light-1'
                    : 'border border-r-neutral-line bg-transparent hover:border-r-blue-default hover:bg-r-blue-light-1'
                }`}
                onClick={() => handleGasLevelSelect(gas)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-14 font-semibold text-r-neutral-title-1">
                    {gasLevelNameMap[gas.level] || gas.level}
                  </span>
                  <span className="text-12 text-r-neutral-body">
                    {gasPrice} Gwei • ~{estimatedTime}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AmountEntry;
