import AddressViewer from '@/ui/component/AddressViewer';
import { splitNumberByStep, useAlias } from '@/ui/utils';

import SkeletonInput from 'antd/lib/skeleton/Input';
import React, { MouseEventHandler, ReactNode } from 'react';
import { getAvatarColor } from '../../utils';

export interface AddressItemProps {
  balance: number;
  address: string;
  type?: string;
  brandName: string;
  className?: string;
  extra?: ReactNode;
  alias?: string;
  onClick: MouseEventHandler<HTMLDivElement>;
  onSwitchCurrentAccount?: () => void;
  enableSwitch?: boolean;
  isCurrentAccount?: boolean;
  isUpdatingBalance?: boolean;
  children?: React.ReactNode;
  onDelete?: () => void;
}

const AddressCard = ({
  balance,
  address,
  brandName,
  alias: aliasName,
  onSwitchCurrentAccount,
  isCurrentAccount = false,
  isUpdatingBalance,
}: AddressItemProps) => {
  const [_alias] = useAlias(address);
  const alias = _alias || aliasName || 'Account';

  const avatarColor = getAvatarColor(address + brandName);

  return (
    <div
      onClick={onSwitchCurrentAccount}
      className="
        cursor-pointer
        bg-white
        border border-transparent
        rounded-lg
        px-1 py-2
        hover:border-secondary-foreground
        transition
      "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${avatarColor}`}
          >
            {alias.charAt(0).toUpperCase()}
          </div>

          {/* Address Info */}
          <div className="flex flex-col gap-1">
            <div className="text-sm text-primary-foreground font-medium">
              {alias}
            </div>
            <AddressViewer
              address={address.toLowerCase()}
              showArrow={false}
              className="text-xs text-secondary-foreground font-normal"
            />
          </div>
        </div>

        {/* RIGHT */}
        {isCurrentAccount && (
          <div className="ml-auto text-right min-w-[90px]">
            {isUpdatingBalance ? (
              <SkeletonInput active style={{ width: 96, height: 24 }} />
            ) : (
              <span className="text-sm font-medium text-primary-foreground truncate block">
                ${splitNumberByStep(Number(balance || 0).toFixed(2))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
