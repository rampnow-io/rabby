import { ConnectedSite } from '@/background/service/permission';
import { FallbackSiteLogo } from '@/ui/component';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { findChainByEnum } from '@/utils/chain';
import clsx from 'clsx';
import React, { forwardRef, memo, useState } from 'react';
import { ReactComponent as RcIconDisconnect } from 'ui/assets/icon-disconnect.svg';
import { ReactComponent as RcIconPinned } from 'ui/assets/icon-pinned.svg';
import { ReactComponent as RcIconPinnedFill } from 'ui/assets/icon-pinned-fill.svg';
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
            'item px-[16px] py-[12px] flex items-center gap-[12px] rounded-[8px]',
            'cursor-pointer transition-colors hover:bg-r-neutral-bg2',
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
            {chainItem && (
              <TooltipWithMagnetArrow
                title={chainItem?.name}
                className="rectangle w-[max-content]"
              >
                <img
                  className="connect-chain w-[16px] h-[16px]"
                  src={chainItem?.logo}
                  alt={chainItem?.name}
                />
              </TooltipWithMagnetArrow>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="item-content truncate text-[14px] text-r-neutral-title-1">
              {item.origin}
            </div>
          </div>
          {isHovered ? (
            <div className="flex items-center gap-[8px]">
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPin?.(item);
                }}
              >
                <ThemeIcon
                  src={item.isTop ? RcIconPinnedFill : RcIconPinned}
                  className={clsx('pin-website w-[20px] h-[20px]', item.isTop && 'is-active')}
                />
              </div>
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onRemove) {
                    onRemove(item.origin);
                  }
                }}
              >
                <ThemeIcon
                  className="icon-close w-[20px] h-[20px]"
                  src={RcIconDisconnect}
                  viewBox="0 0 16 16"
                />
              </div>
            </div>
          ) : (
            <ThemeIcon
              src={RcIconArrowRight}
              className="icon-arrow w-[20px] h-[20px]"
            />
          )}
        </div>
      );
    }
  )
);
