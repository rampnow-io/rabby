import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { TokenItem, GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import TokenAmountInput from '@/ui/component/TokenAmountInput';

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
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const GasSelectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GasLevelItem = styled.div<{ selected?: boolean }>`
  padding: 14px 16px;
  background-color: ${(props) => (props.selected ? '#eef1ff' : '#f5f5f5')};
  border: 1px solid
    ${(props) =>
      props.selected ? 'var(--r-blue-default, #7084ff)' : '#e5e7eb'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    border-color: var(--r-blue-default, #7084ff);
    background-color: #eef1ff;
  }
`;

const GasLevelInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GasLevelName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #000;
`;

const GasLevelPrice = styled.span`
  font-size: 12px;
  color: #999999;
`;

const GasLevelFee = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #000;
`;

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
    <Container>
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
        <GasSelectionContainer>
          <SectionTitle>Network Fee</SectionTitle>
          {sortedGasList.map((gas) => {
            const isSelected = selectedGasLevel === gas.level;
            const gasPrice = new BigNumber(gas.price / 1e9).toFixed(2);
            const estimatedTime = Math.ceil(gas.estimated_seconds / 60);

            return (
              <GasLevelItem
                key={gas.level}
                selected={isSelected}
                onClick={() => handleGasLevelSelect(gas)}
              >
                <GasLevelInfo>
                  <GasLevelName>
                    {gasLevelNameMap[gas.level] || gas.level}
                  </GasLevelName>
                  <GasLevelPrice>
                    {gasPrice} Gwei • ~{estimatedTime}m
                  </GasLevelPrice>
                </GasLevelInfo>
              </GasLevelItem>
            );
          })}
        </GasSelectionContainer>
      )}
    </Container>
  );
};

export default AmountEntry;
