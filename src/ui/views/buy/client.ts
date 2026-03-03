import axios, { AxiosInstance } from 'axios';
import {
  AssociateType,
  AuthenticationType,
  Chain,
  CountryCode,
  CryptoAsset,
  Currency,
  DocSetType,
  EntityProvider,
  EntityType,
  GenderType,
  KycStatus,
  OrderStatus,
  OrderType,
  PaymentMode,
  PaymentStatus,
  RiskStatus,
  RouteType,
  SettingStatus,
  TransactionFlow,
  TransactionStatus,
  UserStatus,
  WalletCustodyType,
  WalletType,
} from '@repo/utils';
export {
  AssociateType,
  AuthenticationType,
  Chain,
  CountryCode,
  CryptoAsset,
  Currency,
  DocSetType,
  EntityProvider,
  EntityType,
  GenderType,
  KycStatus,
  OrderStatus,
  OrderType,
  PaymentMode,
  PaymentStatus,
  RiskStatus,
  RouteType,
  SettingStatus,
  TransactionFlow,
  TransactionStatus,
  UserStatus,
  WalletCustodyType,
  WalletType,
};

export type CryptoAssetCode = CryptoAsset;
export const CryptoAssetCode = CryptoAsset;
export type CryptoChainCode = Chain;
export const CryptoChainCode = Chain;
export type CurrencyCode = Currency;
export const CurrencyCode = Currency;

export type GetRampOrderQuoteRequest = {
  dstChain: CryptoChainCode;
  dstCurrency: CurrencyCode;
  orderType: OrderType;
  paymentMode?: PaymentMode;
  srcAmount: string;
  srcChain: CryptoChainCode;
  srcCurrency: CurrencyCode;
};
export type RampOrderAssetConfig = {
  asset: CryptoAssetCode;
  exchangeRate: string;
  orderTypeConfigs: {
    [key: string]: OrderTypeConfig;
  };
  payinModes: Array<PaymentMode>;
  payoutModes: Array<PaymentMode>;
  status: SettingStatus;
};
// HTTP Client - Axios-based implementation
interface HttpClient {
  get<ResponseType, ErrorType, ThrowOnError extends boolean = false>(options: {
    url: string;
    responseType?: string;
    headers?: Record<string, string>;
    query?: Record<string, any>;
    [key: string]: any;
  }): Promise<any>;
  post<ResponseType, ErrorType, ThrowOnError extends boolean = false>(options: {
    url: string;
    responseType?: string;
    headers?: Record<string, string>;
    data?: any;
    query?: Record<string, any>;
    [key: string]: any;
  }): Promise<any>;
}

// API base URL
const API_BASE_URL = 'https://app.rampnow.io';
const DEFAULT_API_KEY = 'pk_live_zXuMmMzFAbfnMPQnwfEaMkabwPfKsVsg';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Default HTTP client using axios
const client: HttpClient = {
  get: async (options) => {
    const { url, headers = {}, query, ...rest } = options;

    // Get current timestamp in milliseconds
    const timestamp = Date.now().toString();

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      ...headers,
    };

    try {
      const response = await axiosInstance.get(url, {
        headers: finalHeaders,
        params: query,
      });

      return {
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as Record<string, any> | undefined;
        const message = data?.message || error.message;
        throw new Error(`HTTP error! status: ${status}, message: ${message}`);
      }
      throw error;
    }
  },
  post: async (options) => {
    const { url, headers = {}, query, data, body, ...rest } = options;

    // Get current timestamp in milliseconds
    const timestamp = Date.now().toString();

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      ...headers,
    };

    try {
      const response = await axiosInstance.post(url, data || body || rest, {
        headers: finalHeaders,
        params: query,
      });

      return {
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data as
          | Record<string, any>
          | undefined;
        const message = responseData?.message || error.message;
        throw new Error(`HTTP error! status: ${status}, message: ${message}`);
      }
      throw error;
    }
  },
};

export interface Options<TData = any, ThrowOnError extends boolean = false> {
  client?: HttpClient;
  headers?: Record<string, string>;
  data?: TData;
  query?: Record<string, any>;
  body?: TData;
  [key: string]: any;
}

import type {
  GetRampOrderQuoteResponses,
  GetRampOrderQuoteConfigResponse,
  OrderTypeConfig,
} from './type';

export type GetRampOrderQuoteData = any;

export const getRampOrderQuote = <ThrowOnError extends boolean = false>(
  options?: Options<GetRampOrderQuoteData, ThrowOnError>
) => {
  return (options?.client ?? client).post<
    GetRampOrderQuoteResponses,
    unknown,
    ThrowOnError
  >({
    responseType: 'json',
    url: '/api/ramp/v1/ramp_order/quote',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

export const getRampOrderQuoteConfig = <ThrowOnError extends boolean = false>(
  options?: Options<any, ThrowOnError>
) => {
  return (options?.client ?? client).get<
    { code: number; data: GetRampOrderQuoteConfigResponse },
    unknown,
    ThrowOnError
  >({
    responseType: 'json',
    url: '/api/ramp/v1/public/ramp_order/config',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};
