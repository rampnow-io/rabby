import React, { useState, useEffect } from 'react';
import { ACCOUNT_COLORS_PALETTE } from '../address-management/utils';

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
  const baseButtonClasses =
    'w-16 h-16 aspect-square rounded-full cursor-pointer transition-all duration-200 ease relative p-0 hover:scale-105 hover:shadow-lg active:scale-95';
  const selectedButtonClasses = 'border-[3px] border-black/30 shadow-md';
  const unselectedButtonClasses = 'border-2 border-transparent shadow';
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
    <>
      <div className="grid grid-cols-3 place-items-center gap-x-4 gap-y-4 lg:gap-y-[36px]  lg:gap-x-[68px]">
        {ACCOUNT_COLORS_PALETTE.map((color) => (
          <div key={color}>
            <button
              type="button"
              className={`${baseButtonClasses} ${
                selectedColor === color
                  ? selectedButtonClasses
                  : unselectedButtonClasses
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              aria-label={`Select ${getColorName(color)} color`}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default AccountColorPicker;
export { ACCOUNT_COLORS_PALETTE };
