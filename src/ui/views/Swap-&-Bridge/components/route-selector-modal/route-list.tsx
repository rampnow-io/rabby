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
import { DEX_WITH_WRAP } from '@/constant';

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
  const normalizeLogo = (logo: unknown): string => {
    if (!logo) return '';
    if (typeof logo === 'string') return logo;
    if (typeof logo === 'object') {
      const maybe = logo as { default?: string; src?: string };
      return maybe.default || maybe.src || '';
    }
    return '';
  };

  const normalizeKey = (value?: string): string => {
    return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const findDexLogo = (name?: string, idPrefix?: string): string => {
    const candidates = [name, idPrefix].filter(Boolean) as string[];
    if (!candidates.length) return '';

    const dexEntries = Object.entries(
      DEX_WITH_WRAP as Record<
        string,
        { id?: string; name?: string; logo?: unknown }
      >
    );

    for (const candidate of candidates) {
      const normalizedCandidate = normalizeKey(candidate);
      const matched = dexEntries.find(([key, dex]) => {
        return [key, dex?.id || '', dex?.name || ''].some(
          (source) => normalizeKey(source) === normalizedCandidate
        );
      });

      if (matched) {
        const logo = normalizeLogo(matched[1]?.logo);
        if (logo) return logo;
      }
    }

    return '';
  };

  const resolveRouteLogo = (route: Route): string => {
    const idPrefix = route.id.split('-')[0];

    if (route.type === 'swap') {
      const dexLogo = findDexLogo(route.name, idPrefix);
      if (dexLogo) return dexLogo;
    }

    return normalizeLogo(route.logo);
  };

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
          className="flex flex-col gap-y-3 max-h-[400px] overflow-y-auto"
        >
          {routes.map((route) => {
            const displayAmount = route.outputAmount || toAmount;
            const routeLogo = resolveRouteLogo(route);
            return (
              <div key={route.id}>
                <div>
                  <RadioGroupItem
                    className="hidden"
                    value={route.id}
                    id={`route-${route.id}`}
                  />
                  <div className="relative w-full mt-3">
                    {route.isBest && (
                      <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#002C15] text-[#C3F53C] text-xs font-medium px-3 py-1 rounded-full z-20">
                        Best route
                      </div>
                    )}

                    <Label htmlFor={`route-${route.id}`} className="w-full">
                      <Card
                        className={cn(
                          'flex min-h-[72px] cursor-pointer items-center justify-between rounded-[16px] bg-card-border px-4 py-4 border border-transparent hover:border-card-hover shadow-none transition-all',
                          { 'border border-card-selected': value === route.id }
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3 flex-1 pt-4">
                            {routeLogo && (
                              <img
                                src={routeLogo}
                                alt={route.name}
                                draggable={false}
                                className="h-5 w-auto"
                              />
                            )}
                            <div className="flex flex-col">
                              <p className="text-sm font-medium">
                                {route.name}
                              </p>
                            </div>
                          </div>
                          <div className="font-normal text-secondary-foreground text-sm">
                            {' '}
                            Gas {route.fee}
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
