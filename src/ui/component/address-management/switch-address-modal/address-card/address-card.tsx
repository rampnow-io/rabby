import AddressViewer from '@/ui/component/AddressViewer';
import { useRabbyDispatch } from '@/ui/store';
import { splitNumberByStep, useAlias } from '@/ui/utils';
import SkeletonInput from 'antd/lib/skeleton/Input';
import React, { MouseEventHandler, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface AddressItemProps {
  balance: number;
  address: string;
  type: string;
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
  type,
  brandName,
  className,
  onClick,
  onSwitchCurrentAccount,
  alias: aliasName,
  extra,
  enableSwitch = false,
  isCurrentAccount = false,
  isUpdatingBalance,
  children,
  onDelete,
}: AddressItemProps) => {
  const { t } = useTranslation();
  const dispatch = useRabbyDispatch();

  const [_alias] = useAlias(address);
  const alias = _alias || aliasName;
  return (
    <div
      className="cursor-pointer bg-white border-white rounded-lg hover:border-card-hovered hover:border "
      onClick={onSwitchCurrentAccount}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-red-600" />

          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium">{alias}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <AddressViewer
                address={address.toLowerCase()}
                showArrow={false}
                className="text-xs text-gray-500"
              />
            </div>
          </div>
        </div>
        <div>
          {isCurrentAccount && (
            <div className="ml-auto text-right min-w-[90px]">
              {isUpdatingBalance ? (
                <SkeletonInput active style={{ width: 96, height: 24 }} />
              ) : (
                <span className="text-sm font-medium text-primary-foreground truncate block">
                  ${splitNumberByStep(balance?.toFixed(2))}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
