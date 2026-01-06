import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { splitNumberByStep } from '@/ui/utils';
import clsx from 'clsx';
import React from 'react';

interface Props {
  // isCache: boolean;
  balance: number;
}
export const BalanceLabel: React.FC<Props> = ({ balance }) => {
  const splitBalance = splitNumberByStep((balance || 0).toFixed(2));
  const { hiddenBalance } = useRabbySelector((state) => state.preference);
  const dispatch = useRabbyDispatch();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch.preference.setHiddenBalance(!hiddenBalance);
  };

  return (
    <div
      className={clsx(
        'cursor-pointer transition-opacity truncate  py-6'
        // isCache && 'opacity-80'
      )}
      title={splitBalance}
      onClick={handleClick}
    >
      {hiddenBalance ? (
        <div
          className={clsx(
            'font-bold text-[40px] leading-[36px] text-primary-foreground tracking-[16px]'
          )}
        >
          *****
        </div>
      ) : (
        <div className="flex gap-1">
          <div className="text-muted-foreground font-normal text-[18px] -mt-1.5">
            $
          </div>
          <div className="font-bold text-[40px] text-primary-foreground ">
            {splitBalance}
          </div>
        </div>
      )}
    </div>
  );
};
