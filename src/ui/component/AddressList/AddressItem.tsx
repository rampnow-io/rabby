import React, {
  FunctionComponent,
  useEffect,
  useState,
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Tooltip, Input } from 'antd';
import clsx from 'clsx';
import { useTranslation, Trans } from 'react-i18next';
import { Account } from 'background/service/preference';
import { useWallet } from 'ui/utils';
import { AddressViewer, Copy } from 'ui/component';
import {
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  KEYRING_TYPE_TEXT,
  BRAND_ALIAN_TYPE_TEXT,
} from 'consts';
import IconEditPen from 'ui/assets/editpen.svg';
import IconCorrect from 'ui/assets/dashboard/contacts/correct.png';
import { useDebounce } from 'react-use';

export interface AddressItemProps {
  account: {
    address: string;
    type: string;
    brandName: string;
    alianName?: string;
    index?: number;
  };
  keyring?: any;
  ActionButton?: FunctionComponent<{
    data: string;
    account: Account;
    keyring: any;
  }>;
  className?: string;
  hiddenAddresses?: { type: string; address: string }[];
  onClick?(account: string, keyring: any, brandName: string): void;
  showAssets?: boolean;
  noNeedBalance?: boolean;
  currentAccount?: any;
  icon?: string;
  showNumber?: boolean;
  index?: number;
  editing?: boolean;
  showImportIcon?: boolean;
  showIndex?: boolean;
  importedAccount?: boolean;
  isMnemonics?: boolean;
  importedLength?: number;
  canEditing?(editing: boolean): void;
  stopEditing?: boolean;
  retriveAlianName?(): void;
  ellipsis?: boolean;
  showEditIcon?: boolean;
}

const AddressItem = memo(
  forwardRef(
    (
      {
        account,
        keyring,
        ActionButton,
        hiddenAddresses = [],
        className,
        onClick,
        index,
        editing = true,
        showImportIcon = true,
        showIndex = false,
        importedAccount = false,
        isMnemonics = false,
        canEditing,
        stopEditing = false,
        retriveAlianName,
        ellipsis = true,
        showEditIcon = true,
      }: AddressItemProps,
      ref
    ) => {
      const { t } = useTranslation();
      const wallet = useWallet();

      const [alianName, setAlianName] = useState(account?.alianName || '');
      const [displayName, setDisplayName] = useState(account?.alianName || '');

      const isDisabled = hiddenAddresses.some(
        (item) => item.address === account.address && item.type === keyring.type
      );

      const handleAlianNameChange = (e: any) => {
        e.stopPropagation();
        setAlianName(e.target.value);
      };

      const alianNameConfirm = async (e?: any) => {
        e?.stopPropagation();
        if (!alianName.trim()) return;

        canEditing?.(false);
        await wallet.updateAlianName(account.address.toLowerCase(), alianName);
        setDisplayName(alianName);
        retriveAlianName?.();
      };

      useDebounce(
        () => {
          if (!showEditIcon) alianNameConfirm();
        },
        200,
        [alianName, showEditIcon]
      );

      useImperativeHandle(ref, () => ({ alianNameConfirm }));

      useEffect(() => {
        (async () => {
          if (!alianName) {
            const alias = await wallet.getAlianName(account.address);
            setAlianName(alias || '');
            setDisplayName(alias || '');
          }
        })();
      }, []);

      return (
        <li
          className={clsx(className)}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(account.address, keyring, account.brandName);
            canEditing?.(false);
          }}
        >
          <div
            className={clsx(
              'flex items-center relative',
              isDisabled && 'opacity-40'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {showImportIcon && (
              <Tooltip
                overlayClassName="rectangle addressType__tooltip"
                placement="topRight"
              >
                <img
                  src={
                    WALLET_BRAND_CONTENT[account.brandName]?.image ||
                    KEYRING_ICONS[account.type]
                  }
                  className="w-8 h-8"
                />
              </Tooltip>
            )}

            <div className={clsx('flex flex-col items-start ml-[11px] flex-1')}>
              {(showImportIcon || editing) && (
                <div className="flex">
                  {!stopEditing && editing ? (
                    <Input
                      value={alianName}
                      defaultValue={alianName}
                      onChange={handleAlianNameChange}
                      onPressEnter={alianNameConfirm}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus={!stopEditing}
                      maxLength={50}
                      className="w-[160px] h-[24px] bg-r-neutral-bg border border-r-neutral-line rounded pl-[2px]"
                    />
                  ) : (
                    <div className="text-[15px] font-medium text-r-neutral-title1">
                      {displayName}
                    </div>
                  )}

                  {stopEditing && editing && (
                    <img
                      src={IconEditPen}
                      className="w-[16px] h-[16px] ml-[8px] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        canEditing?.(true);
                      }}
                    />
                  )}

                  {!stopEditing && editing && showEditIcon && (
                    <img
                      src={IconCorrect}
                      className="ml-[7px] w-[16px] h-[16px] cursor-pointer"
                      onClick={alianNameConfirm}
                    />
                  )}
                </div>
              )}

              <div className="flex items-center">
                <AddressViewer
                  address={account.address.toLowerCase()}
                  showArrow={false}
                  index={index}
                  className="text-[13px]"
                  ellipsis={ellipsis}
                />

                <Copy
                  variant="address"
                  data={account.address}
                  className="ml-4"
                />
              </div>
            </div>
          </div>

          {keyring && ActionButton && (
            <div className=" flex items-center flex-shrink-0 cursor-pointer">
              <ActionButton
                data={account.address}
                account={account}
                keyring={keyring}
              />
            </div>
          )}
        </li>
      );
    }
  )
);

export default AddressItem;
