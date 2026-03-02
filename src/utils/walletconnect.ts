import { t } from 'i18next';
import { getChainList } from './chain';
import { ConstructorOptions } from '@rabby-wallet/eth-walletconnect-keyring/type';

export const GET_WALLETCONNECT_CONFIG: () => ConstructorOptions = () => {
  return {
    // 1h
    maxDuration: 3600000,
    clientMeta: {
      description: t('global.appDescription'),
      url: 'https://rampnow.io',
      icons: [
        'https://cdn.rampnow.io/image/icon/general/logo-black.svg?format=auto&width=64',
      ],
      name: 'Rampnow Wallet',
    },
    projectId: 'ed21a1293590bdc995404dff7e033f04',
  };
};

export const allChainIds = getChainList('mainnet').map((item) => item.id);
