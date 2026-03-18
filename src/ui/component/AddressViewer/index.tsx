import React from 'react';
import cx from 'clsx';
import { SvgIconArrowDown } from 'ui/assets';

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
}: AddressViewProps) => {
  return (
    <div
      className="flex items-center"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'inherit' }}
    >
      <div
        className={cx(
          'text-base text-primary-foreground font-medium ',
          className
        )}
        title={address?.toLowerCase()}
      >
        {ellipsis
          ? `${address
              ?.toLowerCase()
              .slice(0, longEllipsis ? 8 : 3)}...${address
              ?.toLowerCase()
              .slice(longEllipsis ? -4 : -4)}`
          : address?.toLowerCase()}
      </div>
    </div>
  );
};
