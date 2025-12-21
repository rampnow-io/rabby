import { message } from 'antd';
import clsx from 'clsx';
import { KEYRING_CLASS } from 'consts';
import React, {
  memo,
  MouseEventHandler,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as RcIconArrowRight } from 'ui/assets/address/bold-right-arrow.svg';
import { ReactComponent as RcIconDeleteAddress } from 'ui/assets/address/delete.svg';

import { AddressViewer } from 'ui/component';
import { splitNumberByStep, useAlias } from 'ui/utils';
import IconSuccess from 'ui/assets/success.svg';
import { useRabbyDispatch } from '@/ui/store';
import { CopyChecked } from '@/ui/component/CopyChecked';
import SkeletonInput from 'antd/lib/skeleton/Input';
import { CommonSignal } from '@/ui/component/ConnectStatus/CommonSignal';
import { useBrandIcon } from '@/ui/hooks/useBrandIcon';

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

const AddressItem = memo(
  ({
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

    const titleRef = useRef<HTMLDivElement>(null);
    const [isEdit, setIsEdit] = useState(false);

    const canFastDeleteAccount = useMemo(
      () =>
        onDelete
          ? true
          : isCurrentAccount
          ? false
          : ![KEYRING_CLASS.PRIVATE_KEY].includes(type as any),
      [type, onDelete, isCurrentAccount]
    );

    const deleteAccount = async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (onDelete) {
        await onDelete();
        return;
      }

      if (canFastDeleteAccount) {
        await dispatch.addressManagement.removeAddress([
          address,
          type,
          brandName,
          type !== KEYRING_CLASS.MNEMONIC,
        ]);

        message.success({
          icon: <img src={IconSuccess} className="w-4 h-4" />,
          content: t('page.manageAddress.deleted'),
          duration: 0.5,
        });
      }
    };

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (titleRef.current && !titleRef.current.contains(e.target as Node)) {
          setIsEdit(false);
        }
      };

      document.body.addEventListener('click', handleClickOutside);
      return () =>
        document.body.removeEventListener('click', handleClickOutside);
    }, []);

    useBrandIcon({
      address,
      brandName,
      type,
      forceLight: isCurrentAccount,
    });

    return (
      <div className={clsx('relative', className)}>
        <div className="rounded-lg border border-gray-300 bg-white">
          <div
            onClick={enableSwitch ? onSwitchCurrentAccount : onClick}
            className={clsx(
              'flex items-center rounded-md transition cursor-pointer',
              isCurrentAccount
                ? 'bg-white border-primary'
                : 'hover:bg-gray-100 group border-gray-300',
              enableSwitch && 'cursor-pointer'
            )}
          >
            <div className="flex flex-1 items-center gap-3 overflow-hidden px-2 py-1">
              <div className="relative shrink-0">
                <CommonSignal
                  type={type}
                  brandName={brandName}
                  address={address}
                />
              </div>

              <div className="flex flex-col overflow-hidden flex-1">
                <div
                  ref={titleRef}
                  className={clsx(
                    'truncate text-sm font-medium',
                    isCurrentAccount
                      ? 'text-primary-foreground'
                      : 'text-gray-900'
                  )}
                  title={alias}
                >
                  {alias}
                </div>

                {extra}

                <div className="flex items-center gap-2 mt-1">
                  <AddressViewer
                    address={address.toLowerCase()}
                    showArrow={false}
                    className="text-xs text-gray-500"
                  />

                  <CopyChecked addr={address} className="w-[14px] h-[14px]" />

                  {!isCurrentAccount && (
                    <>
                      {isUpdatingBalance ? (
                        <SkeletonInput
                          active
                          style={{ width: 60, height: 14 }}
                        />
                      ) : (
                        <span className="ml-2 text-xs text-gray-700 truncate">
                          ${splitNumberByStep(balance?.toFixed(2))}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

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

            {/* RIGHT ACTIONS */}
            <div
              className={clsx(
                'flex items-center justify-center',
                isCurrentAccount ? 'w-6 mr-3' : 'w-10'
              )}
              onClick={
                enableSwitch
                  ? (e) => {
                      e.stopPropagation();
                      onClick?.(e);
                    }
                  : undefined
              }
            >
              {canFastDeleteAccount && (
                <RcIconDeleteAddress
                  onClick={deleteAccount}
                  className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer mr-1"
                />
              )}

              <div
                className={clsx(
                  isCurrentAccount
                    ? 'flex text-primary-foreground'
                    : 'hidden group-hover:flex text-primary'
                )}
              >
                <RcIconArrowRight />
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>
    );
  }
);

export default AddressItem;
