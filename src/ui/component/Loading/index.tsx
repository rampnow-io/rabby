import clsx from 'clsx';
import React, { ReactNode } from 'react';
import { SvgIconLoading } from 'ui/assets';

interface CopyProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  loading?: boolean;
}

const Loading = ({ className, style, children, loading }: CopyProps) => {
  return loading ? (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-[40px]',
        className
      )}
      style={style}
    >
      <SvgIconLoading
        className="w-[52px] h-[52px] mb-[12px] animate-spin"
        fill="#707280"
      ></SvgIconLoading>
      <div className="text-r-neutral-foot text-[13px] leading-[16px]">
        {children}
      </div>
    </div>
  ) : null;
};

export default Loading;
