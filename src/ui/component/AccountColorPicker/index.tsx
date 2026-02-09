import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ACCOUNT_COLORS_PALETTE } from '../address-management/utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 20px 0;
`;

const ColorButton = styled.button<{ color: string; selected: boolean }>`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  border: ${(props) =>
    props.selected ? '3px solid rgba(0, 0, 0, 0.3)' : '2px solid transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 0;
  box-shadow: ${(props) =>
    props.selected
      ? '0 4px 12px rgba(0, 0, 0, 0.15)'
      : '0 2px 6px rgba(0, 0, 0, 0.1)'};

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const SelectedLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #e8f0ff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #5b6fff;
  width: fit-content;
`;

const ColorName = styled.div`
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 8px;
`;

const ColorCirclePreview = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

interface AccountColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
}

const getColorName = (color: string): string => {
  const colorNames: Record<string, string> = {
    '#5B6FFF': 'Blue',
    '#89CBFF': 'Light Blue',
    '#9945FF': 'Purple',
    '#FF6B9D': 'Pink',
    '#FF8726': 'Orange',
    '#52C41A': 'Green',
    '#FFA940': 'Orange',
    '#1890FF': 'Royal Blue',
    '#E91E63': 'Magenta',
    '#6F42C1': 'Indigo',
    '#2ECC71': 'Emerald',
    '#000000': 'Black',
  };
  const upperColor = color.toUpperCase();
  return colorNames[upperColor] || 'Custom';
};

export const AccountColorPicker: React.FC<AccountColorPickerProps> = ({
  value = ACCOUNT_COLORS_PALETTE[0],
  onChange,
}) => {
  // Get initial color from prop or default
  const getInitialColor = () => {
    if (value) return value.toUpperCase();
    return ACCOUNT_COLORS_PALETTE[0].toUpperCase();
  };

  const [selectedColor, setSelectedColor] = useState<string>(getInitialColor());

  // Sync with parent when value prop changes
  useEffect(() => {
    const newValue = (value || ACCOUNT_COLORS_PALETTE[0]).toUpperCase();
    setSelectedColor(newValue);
  }, [value]);

  const handleColorSelect = (color: string) => {
    // color from palette is already uppercase
    setSelectedColor(color);
    onChange(color);
  };

  return (
    <Container>
      <Title>Choose a color</Title>

      <ColorGrid>
        {ACCOUNT_COLORS_PALETTE.map((color) => (
          <div key={color}>
            <ColorButton
              color={color}
              selected={selectedColor === color}
              onClick={() => handleColorSelect(color)}
              aria-label={`Select ${getColorName(color)} color`}
            />
            <ColorName>{getColorName(color)}</ColorName>
          </div>
        ))}
      </ColorGrid>
    </Container>
  );
};

export default AccountColorPicker;
export { ACCOUNT_COLORS_PALETTE };
