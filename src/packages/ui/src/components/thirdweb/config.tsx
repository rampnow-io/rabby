'use client';

import { createThirdwebClient, ThirdwebClient } from 'thirdweb';

export let client: ThirdwebClient | null = null;

export const ThirdWebConfig = {
  FACTORY_ADDRESS_V7: '0x4be0ddfebca9a5a4a617dee4dece99e7c862dceb',
  FACTORY_ADDRESS_V6: '0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00',
};

export const initializeThirdwebClient = (clientId: string): ThirdwebClient => {
  client = createThirdwebClient({ clientId });
  return client;
};

export const getThirdWebClient = (): ThirdwebClient => {
  if (!client) {
    throw new Error('thirdweb client not initialized');
  }

  return client;
};
