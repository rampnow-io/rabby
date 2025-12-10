import { EntityProvider } from './api-enums';
import { CryptoAsset } from './crypto-asset-configs';
import { PaymentProviderConfig } from './schema';
import { getEntityProviderInt } from './utils';

export const paymentProviderConfig: Record<number, PaymentProviderConfig> = {
  [getEntityProviderInt(EntityProvider.BANXA)]: {
    type: 'ramp',
    liquidityAsset: CryptoAsset.USDC_Base,
  },
  [getEntityProviderInt(EntityProvider.ONRAMP)]: {
    type: 'ramp',
    liquidityAsset: CryptoAsset.USDC_Base,
  },
};
