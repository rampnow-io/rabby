'use client';

import { Image, Label, RadioGroup, RadioGroupItem } from '@repo/ui/primitives';
import { cn } from '@repo/utils';
import { ChevronRight } from 'lucide-react';
import { RefObject, useEffect, useImperativeHandle, useState } from 'react';
import { useEventRef } from '@repo/ui';
import RouteListAction from './route-list-action';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';

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
  const [openRoutesModal, openRoutesModalRef] = useEventRef<() => void>();
  const [selectedRoute, setSelectedRoute] = useState<Route | undefined>(
    defaultValue ? routes.find((r) => r.id === defaultValue) : undefined
  );

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
                {selectedRoute.logo && (
                  <Image
                    src={selectedRoute.logo}
                    alt={selectedRoute.name}
                    width={32}
                    height={32}
                    draggable={false}
                    className="h-5 w-5"
                  />
                )}
                <span>{selectedRoute.name}</span>
                {selectedRoute.isBest && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded">
                    Best
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[#6A6C6A]">Select Route</p>
          )}
        </>
        <ChevronRight />
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
