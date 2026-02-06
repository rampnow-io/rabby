import React, { useMemo, useState } from 'react';
import { TokenItem, GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import TokenAmountInput from '@/ui/component/TokenAmountInput';
import { Input, InputSize, Separator } from '@repo/ui/primitives';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { ReactComponent as RcIconArrowRight } from 'ui/assets/arrow-right-gray.svg';

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
  const [isGasPopupOpen, setIsGasPopupOpen] = useState(false);

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
    setIsGasPopupOpen(false);
  };

  const selectedGas = useMemo(() => {
    return gasList.find((g) => g.level === selectedGasLevel);
  }, [gasList, selectedGasLevel]);

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
        <div
          className="flex items-center justify-between p-3.5 rounded-lg border border-primary bg-white cursor-pointer hover:border-primary transition-all"
          onClick={() => setIsGasPopupOpen(true)}
        >
          <div className="flex flex-col gap-1">
            <span className="text-13 font-semibold text-primary-foreground uppercase tracking-wider">
              Network Fee
            </span>
            {selectedGas && (
              <div className="flex items-center gap-2">
                <span className="text-14 font-semibold text-primary-foreground">
                  {gasLevelNameMap[selectedGas.level] || selectedGas.level}
                </span>
                <span className="text-12 text-primary-foreground">
                  {new BigNumber(selectedGas.price / 1e9).toFixed(2)} Gwei • ~
                  {Math.ceil(selectedGas.estimated_seconds / 60)}m
                </span>
              </div>
            )}
          </div>
          <RcIconArrowRight className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <BottomFloatingSheet
        open={isGasPopupOpen}
        hideCloseButton
        onClose={() => setIsGasPopupOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {sortedGasList.map((gas) => {
              const isSelected = selectedGasLevel === gas.level;
              const gasPrice = new BigNumber(gas.price / 1e9).toFixed(2);
              const estimatedTime = Math.ceil(gas.estimated_seconds / 60);

              return (
                <div
                  key={gas.level}
                  className={`p-3.5 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${
                    isSelected
                      ? 'border border-primary bg-white'
                      : 'border border-r-neutral-line bg-transparent hover:border-primary hover:bg-grey-50'
                  }`}
                  onClick={() => handleGasLevelSelect(gas)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-14 font-semibold text-primary-foreground">
                      {gasLevelNameMap[gas.level] || gas.level}
                    </span>
                    <span className="text-12 text-primary-foreground">
                      {gasPrice} Gwei • ~{estimatedTime}m
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </BottomFloatingSheet>
    </div>
  );
};

export default AmountEntry;
