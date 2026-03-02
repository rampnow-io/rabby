'use client';

import { type MutableRefObject, useImperativeHandle, useState, useCallback } from 'react';
import RouteList from './route-list';
import type { Route } from './index';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';

interface RouteListActionProps {
  actionRef?: MutableRefObject<(() => void) | undefined>;
  value: string | undefined;
  rootSelector?: string;
  onChange: (selectedRoute: Route) => void;
  routes: Route[];
  toToken?: TokenItem;
  toAmount?: string;
}

function RouteListAction({
  actionRef,
  value,
  onChange,
  routes,
  rootSelector,
  toToken,
  toAmount,
}: RouteListActionProps) {
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

  useImperativeHandle(actionRef, () => open, [open]);

  if (!show) {
    return null;
  }

  return (
    <RouteList
      rootSelector={rootSelector}
      close={close}
      value={value}
      onChange={onChange}
      routes={routes}
      toToken={toToken}
      toAmount={toAmount}
    />
  );
}

RouteListAction.displayName = 'RouteListAction';

export default RouteListAction;
