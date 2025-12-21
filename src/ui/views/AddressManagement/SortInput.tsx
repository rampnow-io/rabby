import React, { useMemo } from 'react';
import { useRabbySelector } from '@/ui/store';
import { useTranslation } from 'react-i18next';
import { ReactComponent as RcIconSearch } from 'ui/assets/search-currentcolor.svg';
import { AddressSortPopup } from './SortPopup';
import { useSwitch } from '@/ui/utils/switch';

import { ReactComponent as IconSortByUsd } from '@/ui/assets/address/sort-by-usd.svg';
import { ReactComponent as IconSortByType } from '@/ui/assets/address/sort-by-type.svg';
import { ReactComponent as IconSortByAlphabet } from '@/ui/assets/address/sort-by-alphabet.svg';
import { AddressSortStore } from '@/background/service/preference';
import clsx from 'clsx';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { Input } from '@repo/ui/primitives';
import { Search } from '@repo/ui';

export const AddressSortIconMapping: Record<
  AddressSortStore['sortType'],
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  usd: IconSortByUsd,
  addressType: IconSortByType,
  alphabet: IconSortByAlphabet,
};

export const SortInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) => {
  const { t } = useTranslation();
  const sortType = useRabbySelector(
    (s) => s.preference.addressSortStore.sortType
  );
  const { on, turnOff, turnOn } = useSwitch(false);

  const SortIcon = useMemo(() => {
    const Icon = AddressSortIconMapping[sortType];
    return <Icon viewBox="0 0 20 20" className="w-4 h-4" />;
  }, [sortType]);

  return (
    <>
      <div
        className={clsx(
          'sort-input widget-has-ant-input',
          value && 'searching'
        )}
      >
        <Search
          className="search-input"
          placeholder={t('page.manageAddress.search')}
          onChange={onChange}
          value={value}
        />
      </div>
      <AddressSortPopup open={on} onCancel={turnOff} />
    </>
  );
};
