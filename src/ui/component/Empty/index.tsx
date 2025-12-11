import clsx from 'clsx';
import React, { ReactNode } from 'react';

interface EmptyProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  title?: ReactNode;
  desc?: ReactNode;
}

const Empty = ({ className, style, children, title, desc }: EmptyProps) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-[40px]',
        className
      )}
      style={style}
    >
      <img
        className="w-[52px] h-[52px] mb-[12px] opacity-40"
        src="./images/nodata-tx.png"
      />
      <div className="text-center">
        {title && (
          <div className="text-r-neutral-title-1 text-[15px] font-medium mb-[8px]">
            {title}
          </div>
        )}
        <div className="text-r-neutral-foot text-[13px] leading-[16px]">
          {children ? children : desc}
        </div>
      </div>
    </div>
  );
};

export default Empty;
