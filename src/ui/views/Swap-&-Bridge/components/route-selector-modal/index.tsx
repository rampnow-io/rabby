'use client';

import { Label, RadioGroup, RadioGroupItem } from '@repo/ui/primitives';
import { cn } from '@repo/utils';
import { ChevronRight } from 'lucide-react';
import {
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { useEventRef } from '@repo/ui';
import RouteListAction from './route-list-action';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { DEX_WITH_WRAP } from '@/constant';

export interface Route {
  id: string;
  name: string;
  logo?: string;
  fee?: string;
  duration?: string;
  type: 'swap' | 'bridge';
  isBest?: boolean;
  gasCost?: string;
  outputAmount?: string;
  usdValue?: string;
  destTokenLogo?: string;
  destTokenSymbol?: string;
}

interface RouteSelectorModalProps {
  onChange: (selectedRoute: Route) => void;
  onSelectedChange?: (selectedRoute: Route | undefined) => void;
  value: string | undefined;
  routes: Route[];
  disabled?: boolean;
  actionRef?: RefObject<(() => void) | undefined>;
  defaultValue?: string;
  toToken?: TokenItem;
  toAmount?: string;
}

function RouteSelectorModal({
  onChange,
  onSelectedChange,
  routes,
  value,
  actionRef,
  disabled = false,
  defaultValue,
  toToken,
  toAmount,
}: RouteSelectorModalProps) {
  const normalizeLogo = useCallback((logo: unknown): string => {
    if (!logo) return '';
    if (typeof logo === 'string') return logo;
    if (typeof logo === 'object') {
      const maybe = logo as { default?: string; src?: string };
      return maybe.default || maybe.src || '';
    }
    return '';
  }, []);

  const normalizeKey = useCallback((value?: string): string => {
    return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }, []);

  const findDexLogo = useCallback(
    (name?: string, idPrefix?: string): string => {
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
    },
    [normalizeKey, normalizeLogo]
  );

  const resolveRouteLogo = useCallback(
    (route?: Route): string => {
      if (!route) return '';

      const idPrefix = route.id.split('-')[0];

      if (route.type === 'swap') {
        const dexLogo = findDexLogo(route.name, idPrefix);
        if (dexLogo) return dexLogo;
      }

      return normalizeLogo(route.logo);
    },
    [findDexLogo, normalizeLogo]
  );

  const [openRoutesModal, openRoutesModalRef] = useEventRef<() => void>();
  const [selectedRoute, setSelectedRoute] = useState<Route | undefined>(
    defaultValue ? routes.find((r) => r.id === defaultValue) : undefined
  );

  const selectedRouteLogo = useMemo(() => resolveRouteLogo(selectedRoute), [
    resolveRouteLogo,
    selectedRoute,
  ]);

  useImperativeHandle(actionRef, () => openRoutesModal, [openRoutesModal]);

  const onRouteSelected = (route: Route | undefined) => {
    setSelectedRoute(route);
    onSelectedChange?.(route);
  };

  const onRouteSelect = (route: Route) => {
    onRouteSelected(route);
    onChange(route);
  };

  useEffect(() => {
    if (defaultValue) {
      const defaultRoute = routes.find((r) => r.id === defaultValue);
      if (defaultRoute) {
        onRouteSelect(defaultRoute);
      }
      return;
    }

    const hasSelectedRoute = !!selectedRoute?.id;
    const selectedStillExists = hasSelectedRoute
      ? routes.some((r) => r.id === selectedRoute?.id)
      : false;

    if (hasSelectedRoute && selectedStillExists) {
      return;
    }

    const bestRoute = routes.find((r) => r.isBest) || routes[0];
    if (bestRoute) {
      onRouteSelect(bestRoute);
    } else {
      onRouteSelected(undefined);
    }
  }, [defaultValue, routes, selectedRoute?.id]);

  return (
    <div>
      <div
        onClick={!disabled ? openRoutesModal : undefined}
        className={cn(
          'bg-[#F9F9F9] text-primary-foreground text-base font-medium h-[56px] p-4 flex justify-between w-full rounded-xl gap-3',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'
        )}
      >
        <>
          {selectedRoute ? (
            <div className="flex flex-row justify-between items-center w-full">
              <div className="flex items-center gap-2 flex-1">
                <span>{selectedRoute.name}</span>
              </div>
            </div>
          ) : (
            <p className="text-[#6A6C6A]">Select Route</p>
          )}
        </>
        <div className="flex items-center gap-1.5">
          {selectedRouteLogo && (
            <img
              src={selectedRouteLogo}
              alt={selectedRoute?.name}
              draggable={false}
              className="h-5 w-5 rounded-full"
            />
          )}
          <ChevronRight />
        </div>
      </div>
      <RouteListAction
        actionRef={openRoutesModalRef}
        routes={routes}
        value={selectedRoute?.id}
        onChange={onRouteSelect}
        toToken={toToken}
        toAmount={toAmount}
      />
    </div>
  );
}

export default RouteSelectorModal;
