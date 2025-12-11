import React, { ReactNode } from 'react';
import cx from 'clsx';

interface FieldProps {
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon: ReactNode;
  onClick?(): void;
  className?: string;
  style?: React.CSSProperties;
}

const Field = ({
  children,
  leftIcon,
  rightIcon,
  onClick,
  className,
  style,
}: FieldProps) => {
  return (
    <div
      className={cx(
        'rounded-[6px] px-[12px] py-[16px] text-[14px] leading-[18px] font-normal',
        'flex items-center gap-[8px] bg-r-neutral-card-1',
        onClick && 'cursor-pointer hover:bg-r-neutral-bg-1',
        className
      )}
      onClick={onClick}
      style={style}
    >
      {leftIcon && <div className="flex-shrink-0">{leftIcon}</div>}
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex-shrink-0">{rightIcon}</div>
    </div>
  );
};

export default Field;
