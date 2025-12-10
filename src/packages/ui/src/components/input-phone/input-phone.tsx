import { CountryList } from '@repo/utils';
import { useMemo } from 'react';
import { Input, InputSize } from '../../primitives';
import Select from '../select';

export enum DisplayMode {
  WIDGET = 'widget',
  DASHBOARD = 'dashboard',
}

interface InputProps {
  onChange: (value: string) => void;
  value: string;
  displayMode?: DisplayMode;
  sizeVariant?: InputSize;
}

const InputPhone: React.FC<InputProps> = ({
  value,
  onChange,
  displayMode = DisplayMode.WIDGET,
  sizeVariant = InputSize.SM,
}) => {
  const [callingCode, phoneNumber] = useMemo(
    () => value?.split('-') ?? ['', ''],
    [value]
  );

  const selectedCountry = useMemo(
    () => CountryList.find((c) => c.callingCode === callingCode),
    [callingCode]
  );

  const handleCountryChange = (value: string | number) => {
    onChange(`${value}-${phoneNumber}`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${callingCode}-${e.target.value}`);
  };

  const commonProps = {
    value: selectedCountry?.callingCode ?? '',
    options: CountryList.map((data) => ({
      value: data.callingCode,
      label: `${data.emoji} ${data.callingCode}`,
      searchValue: [data.name, data.callingCode],
      listLabel: `${data.displayValue} (${data.callingCode})`,
    })),
    onChange: handleCountryChange,
    sizeVariant,
    className: 'w-[90px] flex-shrink-0 flex-grow-0',
    placeholder: '',
  };

  return (
    <div className="flex gap-3">
      <Select {...commonProps} hideChevron selectTitle="Search Country" />
      <Input
        className="flex-grow"
        sizeVariant={sizeVariant}
        placeholder="Phone Number"
        type="number"
        value={phoneNumber}
        onChange={handlePhoneChange}
      />
    </div>
  );
};

InputPhone.displayName = 'InputPhone';

export { InputPhone };
