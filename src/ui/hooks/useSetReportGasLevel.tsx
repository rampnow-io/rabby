import { useEffect } from 'react';
import { useWallet } from '../utils';
import { GasLevel } from '@rabby-wallet/rabby-api/dist/types';

export const useSetReportGasLevel = (gasLevel?: GasLevel['level']) => {
  const wallet = useWallet();
  useEffect(() => {
    if (wallet && typeof wallet.setReportGasLevel === 'function') {
      wallet.setReportGasLevel(gasLevel || 'normal').catch((e) => {
        console.warn('useSetReportGasLevel failed:', e?.message || String(e));
      });
    }
  }, [gasLevel, wallet]);
};
