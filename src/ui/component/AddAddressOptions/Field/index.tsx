import React, { ReactNode } from 'react';
import cx from 'clsx';
import { useWallet, useHover } from 'ui/utils';
import IconWalletConnect from 'ui/assets/walletlogo/walletconnect.svg';

interface FieldProps {
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon: ReactNode;
  onClick?(): void;
  className?: string;
  subText?: string;
  showWalletConnect?: boolean;
  brand?: string | null;
  callback?(): void;
  unselect?: boolean;
  address?: boolean;
}

const Field = ({
  children,
  leftIcon,
  rightIcon,
  onClick,
  className,
  subText,
  showWalletConnect,
  brand,
  callback,
  unselect,
  address,
}: FieldProps) => {
  const wallet = useWallet();
  const [isHovering, hoverProps] = useHover();

  const saveWallet = async (e) => {
    e.stopPropagation();
    const savedList = await wallet.getHighlightWalletList();
    if (savedList.includes(brand)) return;

    const newList = [brand, ...savedList].filter(Boolean).sort();
    await wallet.updateHighlightWalletList(newList);
    callback?.();
  };

  const removeWallet = async (e) => {
    e.stopPropagation();
    const savedList = await wallet.getHighlightWalletList();
    const newList = savedList.filter((item) => item !== brand);
    await wallet.updateHighlightWalletList(newList);
    callback?.();
  };

  return (
    <div
      className={cx(
        'flex items-center justify-between min-h-[56px] px-3 bg-white rounded-md',
        'address-option-field',
        // sibling margin: & + .field
        '[&+.field]:mt-3',
        className
      )}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'initial' }}
      {...hoverProps}
    >
      {leftIcon && (
        <div
          className={cx(
            'flex items-center mr-3 relative left-icon',
            address && 'left-icon-address'
          )}
        >
          {leftIcon}

          {showWalletConnect && (
            <img
              className="absolute top-0 right-0 w-[12px] h-[12px]"
              src={IconWalletConnect}
            />
          )}
        </div>
      )}

      <div
        className={cx(
          'flex items-center flex-1 overflow-hidden field-slot',
          address && 'flex-col items-start field-slot-address'
        )}
      >
        {children}

        {subText && (
          <div className="mt-1 text-[13px] text-r-neutral-foot">{subText}</div>
        )}
      </div>

      <div
        className="flex items-center justify-center cursor-pointer flex-shrink-0 right-icon"
        onClick={unselect ? removeWallet : saveWallet}
      >
        {!address ? rightIcon : (isHovering || unselect) && rightIcon}
      </div>
    </div>
  );
};

export default Field;
