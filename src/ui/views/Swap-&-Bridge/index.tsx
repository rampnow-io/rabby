import React from 'react';
import SwapAndBridgeContainer from './page';
import {
  QuoteVisibleProvider,
  RefreshIdProvider,
  SettingVisibleProvider,
} from './hooks';
import { DirectSubmitProvider } from '@/ui/hooks/useMiniApprovalDirectSign';

const SwapAndBridge = () => {
  return (
    <SettingVisibleProvider>
      <RefreshIdProvider>
        <QuoteVisibleProvider>
          <DirectSubmitProvider>
            <SwapAndBridgeContainer />
          </DirectSubmitProvider>
        </QuoteVisibleProvider>
      </RefreshIdProvider>
    </SettingVisibleProvider>
  );
};

export default SwapAndBridge;
