import React from 'react';
import cx from 'clsx';
import { SvgIconArrowDown } from 'ui/assets';
import { Copy } from '@repo/ui/primitives';

interface AddressViewProps {
  address: string;
  onClick?(): void;
  ellipsis?: boolean;
  showArrow?: boolean;
  className?: string;
  showImportIcon?: boolean;
  index?: number;
  showIndex?: boolean;
  longEllipsis?: boolean;
  isCopy?: boolean;
}

export default ({
  address,
  onClick,
  ellipsis = true,
  showArrow = true,
  className = 'normal',
  index = -1,
  showIndex = false,
  longEllipsis = false,
  isCopy = true,
}: AddressViewProps) => {
  return (
    <div
      className="flex items-center"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'inherit' }}
    >
      {isCopy ? (
        <Copy
          value={`${address}`}
          className="text-sm font-medium text-[#030303]"
        >
          <div
            className={cx(
              'text-base text-primary-foreground font-sf-pro font-semibold ',
              className
            )}
            title={address?.toLowerCase()}
          >
            {ellipsis
              ? `${address
                  ?.toLowerCase()
                  .slice(
                    0,
                    longEllipsis ? 8 : 3
                  )}...${address?.toLowerCase().slice(longEllipsis ? -4 : -4)}`
              : address?.toLowerCase()}
          </div>
        </Copy>
      ) : (
        <div
          className={cx(
            'text-base text-primary-foreground font-sf-pro font-semibold ',
            className
          )}
          title={address?.toLowerCase()}
        >
          {ellipsis
            ? `${address
                ?.toLowerCase()
                .slice(
                  0,
                  longEllipsis ? 8 : 3
                )}...${address?.toLowerCase().slice(longEllipsis ? -4 : -4)}`
            : address?.toLowerCase()}
        </div>
      )}
    </div>
  );
};
