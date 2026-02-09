import { ConnectedSite } from '@/background/service/permission';
import { FallbackSiteLogo } from '@/ui/component';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { findChainByEnum } from '@/utils/chain';
import clsx from 'clsx';
import React, { forwardRef, memo, useState } from 'react';
import { ReactComponent as RcIconArrowRight } from '@/ui/assets/dashboard/settings/icon-right-arrow.svg';

interface ConnectionItemProps {
  className?: string;
  item: ConnectedSite;
  onClick?(): void;
  onRemove?(origin: string): void;
  onPin?(item: ConnectedSite): void;
}

type ConnectionItemPropsWithRest = ConnectionItemProps & Record<string, any>;

export const Item = memo(
  forwardRef<any, ConnectionItemPropsWithRest>(
    ({ item, onClick, onRemove, onPin, className, ...rest }, ref) => {
      const chainItem = findChainByEnum(item.chain);
      const [isHovered, setIsHovered] = useState(false);

      return (
        <div
          className={clsx(
            'item p-3 flex items-center gap-[12px] rounded-[8px]',
            'cursor-pointer transition-colors bg-r-neutral-bg2 hover:bg-[#F4F4F4]',
            className
          )}
          ref={ref}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...rest}
        >
          <div className="logo flex items-center gap-[8px]">
            <FallbackSiteLogo
              url={item.icon}
              origin={item.origin}
              width="32px"
              style={{
                borderRadius: '50%',
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="item-content truncate text-[14px] text-primary-foreground font-medium">
              {item.origin}
            </div>
          </div>

          <ThemeIcon
            src={RcIconArrowRight}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onRemove) {
                onRemove(item.origin);
              }
            }}
            className="icon-arrow w-[20px] h-[20px]"
          />
        </div>
      );
    }
  )
);
