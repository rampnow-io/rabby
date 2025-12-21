import { KEYRING_CLASS, KEYRING_ICONS, WALLET_BRAND_CONTENT } from '@/constant';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useWalletConnectIcon } from '@/ui/component/WalletConnect/useWalletConnectIcon';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { IDisplayedAccountWithBalance } from '@/ui/models/accountToDisplay';
import { pickKeyringThemeIcon } from '@/utils/account';
import clsx from 'clsx';
import React, { useMemo } from 'react';

export const GroupItem = ({
  item,
  active,
  count,
  onChange,
  type,
  brandName,
}: {
  item?: IDisplayedAccountWithBalance;
  active: boolean;
  count: number;
  type: string;
  brandName?: string;
  onChange: () => void;
}) => {
  const { address } = item || {};
  const brandIcon = useWalletConnectIcon(
    address && brandName
      ? {
          address,
          brandName,
          type,
        }
      : null
  );

  const { isDarkTheme } = useThemeMode();

  const addressTypeIcon = useMemo(
    () =>
      (address && brandName ? brandIcon : null) ||
      pickKeyringThemeIcon(type as any, isDarkTheme) ||
      KEYRING_ICONS[type] ||
      WALLET_BRAND_CONTENT?.[brandName || type]?.maybeSvg ||
      WALLET_BRAND_CONTENT?.[brandName || type]?.image,
    [type, brandName, brandIcon, isDarkTheme]
  );

  return (
    <div
      onClick={onChange}
      className={clsx(
        'w-[60px] h-[48px] rounded-md flex items-center justify-center cursor-pointer transition',
        active
          ? 'bg-blue-light bg-opacity-20 ring-1 ring-blue-light'
          : 'hover:bg-blue-light hover:bg-opacity-10'
      )}
    >
      <div className="relative">
        <ThemeIcon
          src={addressTypeIcon}
          className={clsx(
            'w-6 h-6',
            type !== KEYRING_CLASS.MNEMONIC && 'rounded-full'
          )}
        />

        <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 text-[11px] flex items-center justify-center rounded-full bg-r-neutral-bg-2 border border-white text-r-neutral-body">
          {count}
        </div>
      </div>
    </div>
  );
};
