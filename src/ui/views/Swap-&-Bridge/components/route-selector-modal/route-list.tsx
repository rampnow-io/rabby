'use client';

import {
  Card,
  Image,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@repo/ui/primitives';
import { cn } from '@repo/utils';
import { X } from 'lucide-react';
import { BottomDrawer } from '@repo/ui';
import type { Route } from './index';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';

interface RouteListProps {
  value: string | undefined;
  rootSelector?: string;
  onChange: (selectedRoute: Route) => void;
  close: () => void;
  routes: Route[];
  toToken?: TokenItem;
  toAmount?: string;
}

function RouteList({
  rootSelector,
  close,
  value,
  routes,
  onChange,
  toToken,
  toAmount,
}: RouteListProps): React.ReactNode {
  const handleSelect = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (route) {
      onChange(route);
      close();
    }
  };

  return (
    <BottomDrawer variant="semi" rootSelector={rootSelector} close={close}>
      <div className="flex flex-col gap-3 p-6 overflow-auto">
        <div className="flex item-center justify-between">
          <div className="text-lg font-medium">Select Route</div>
          <X className="cursor-pointer" size={24} onClick={close} />
        </div>
        <RadioGroup
          onValueChange={handleSelect}
          value={value}
          className="flex flex-col gap-y-3 overflow-y-auto"
        >
          {routes.map((route) => {
            const displayAmount = route.outputAmount || toAmount;
            return (
              <div key={route.id}>
                <div>
                  <RadioGroupItem
                    className="hidden"
                    value={route.id}
                    id={`route-${route.id}`}
                  />
                  <Label htmlFor={`route-${route.id}`} className="w-full">
                    <Card
                      className={cn(
                        'flex h-[55px] cursor-pointer items-center justify-between rounded-[6px] bg-card-border px-3 border-0 hover:border-card-hover hover:border shadow-none relative',
                        { 'border border-card-selected': value === route.id }
                      )}
                    >
                      {route.isBest && (
                        <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-br-md rounded-tl-md">
                          Best
                        </div>
                      )}
                      <div className="flex items-center gap-3 flex-1">
                        {route.logo && (
                          <Image
                            src={route.logo}
                            alt={route.name}
                            width={40}
                            height={40}
                            draggable={false}
                            className="h-5 w-auto"
                          />
                        )}
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{route.name}</p>
                          <p className="text-xs text-gray-500">
                            {route.type === 'swap' ? 'DEX Swap' : 'Bridge'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {displayAmount && toToken?.logo_url && (
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
                              <Image
                                src={toToken.logo_url}
                                alt={toToken.symbol || ''}
                                width={20}
                                height={20}
                                draggable={false}
                                className="w-5 h-5 object-contain"
                              />
                            </div>
                            <p className="text-lg font-semibold text-[#18181B]">
                              {displayAmount}
                            </p>
                          </div>
                        )}
                        {route.usdValue && (
                          <p className="text-sm text-[#71717A]">
                            {route.usdValue}
                          </p>
                        )}
                      </div>
                    </Card>
                  </Label>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </BottomDrawer>
  );
}

RouteList.displayName = 'RouteList';

export default RouteList;
