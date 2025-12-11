import React, { ReactNode } from 'react';
import IconBack from 'ui/assets/icon-back.svg';

interface NavbarProps {
  back?: ReactNode | null;
  onBack?: () => void;
  children?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  desc?: ReactNode;
}

const Navbar = (props: NavbarProps) => {
  const { back, left, right, onBack, children, desc } = props;
  return (
    <div className="flex flex-col bg-r-neutral-card-1 border-b border-r-neutral-line">
      <div className="px-[20px] py-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <div
              className="w-[20px] h-[20px] cursor-pointer flex items-center justify-center"
              onClick={onBack}
            >
              {back ? back : <img src={IconBack} alt=""></img>}
            </div>
            {left}
          </div>
          <div className="flex-1 text-center text-r-neutral-title-1 text-[15px] font-medium">
            {children}
          </div>
          <div className="flex items-center gap-[8px]">{right}</div>
        </div>
        {desc ? (
          <div className="mt-[8px] text-r-neutral-body text-[13px] text-center">
            {desc}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Navbar;
