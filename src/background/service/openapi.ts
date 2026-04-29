import {
  INITIAL_OPENAPI_URL,
  INITIAL_TESTNET_OPENAPI_URL,
  INITIAL_WALLET_API_URL,
} from '@/constant';
import { OpenApiService } from '@rabby-wallet/rabby-api';
import { createPersistStore } from 'background/utils';
export * from '@rabby-wallet/rabby-api/dist/types';
import { WebSignApiPlugin } from '@rabby-wallet/rabby-api/dist/plugins/web-sign';
import fetchAdapter from 'background/utils/fetchAdapter';
import { v4 as uuidv4 } from 'uuid';

class baseStore {
  store: {
    host: string;
    testnetHost: string;
    apiKey: string | null;
    apiTime: number | null;
  };

  constructor(
    private storeName: string = 'openapi',
    private defaultHost: string = INITIAL_OPENAPI_URL
  ) {
    this.store = {
      host: defaultHost,
      testnetHost: INITIAL_TESTNET_OPENAPI_URL,
      apiKey: null,
      apiTime: null,
    };
    createPersistStore({
      name: storeName,
      template: {
        host: defaultHost,
        testnetHost: INITIAL_TESTNET_OPENAPI_URL,
        apiKey: null,
        apiTime: null,
      },
    }).then((res) => {
      this.store = res;
      if (!this.store.apiKey) {
        this.generateAPIKey();
      }
    });
  }

  get host() {
    return this.store.host;
  }

  set host(value: string) {
    this.store.host = value;
  }

  get testnetHost() {
    return this.store.testnetHost;
  }

  set testnetHost(value: string) {
    this.store.testnetHost = value;
  }

  get apiKey() {
    return this.store.apiKey;
  }

  set apiKey(value: string | null) {
    this.store.apiKey = value;
  }

  get apiTime() {
    return this.store.apiTime;
  }

  set apiTime(value: number | null) {
    this.store.apiTime = value;
  }

  generateAPIKey = () => {
    const uuid = uuidv4();
    this.store.apiKey = uuid;
    this.store.apiTime = Math.floor(Date.now() / 1000);
  };
}

const testnetStore = new (class TestnetStore extends baseStore {
  constructor() {
    super();
  }
  get host() {
    return this.store.testnetHost;
  }
  set host(value: string) {
    this.store.testnetHost = value;
  }
})();

const openapiStore = new baseStore('openapi', INITIAL_OPENAPI_URL);
const rampnowWalletApiStore = new baseStore(
  'wallet-api',
  INITIAL_WALLET_API_URL
);

if (!process.env.DEBUG) {
  openapiStore.testnetHost = INITIAL_TESTNET_OPENAPI_URL;
  rampnowWalletApiStore.testnetHost = INITIAL_TESTNET_OPENAPI_URL;
  testnetStore.host = INITIAL_TESTNET_OPENAPI_URL;
  testnetStore.testnetHost = INITIAL_TESTNET_OPENAPI_URL;
}

const openapiService = new OpenApiService({
  plugin: WebSignApiPlugin,
  adapter: fetchAdapter,
  store: openapiStore,
});
const walletApiService = new OpenApiService({
  plugin: WebSignApiPlugin,
  adapter: fetchAdapter,
  store: rampnowWalletApiStore,
});

// const service = new OpenApiService({
//   plugin: WebSignApiPlugin,
//   adapter: fetchAdapter,
//   store: proxyStore,
// });

if (typeof window !== 'undefined') {
  service.initSync();
}

export const testnetOpenapiService = new OpenApiService({
  plugin: WebSignApiPlugin,
  adapter: fetchAdapter,
  store: testnetStore,
});

export { walletApiService };

const WALLET_API_METHODS = new Set<keyof OpenApiService>([
  'listTxHisotry',
  'getTotalBalance',
  'getToken',
  'gasMarketV2',
  'gasPriceStats',
  'preExecTx',
  'getDefaultRPCs',
  'ethRpc',
  'gasLessTxsCheck',
  'checkGasAccountTxs',
  'parseTx',
  'submitTxV2',
]);

const service = new Proxy(openapiService, {
  get(target, prop: string) {
    const isWalletApi = WALLET_API_METHODS.has(prop as keyof OpenApiService);

    if (isWalletApi) {
      const method = (walletApiService as any)[prop];
      if (typeof method !== 'function') {
        return method?.bind(walletApiService);
      }
      return (...args: any[]) => {
        return method.apply(walletApiService, args).then(
          (res: any) => {
            return res;
          },
          (err: any) => {
            throw err;
          }
        );
      };
    }
    return (target as any)[prop].bind(target);
  },
}) as OpenApiService;

export default service;
