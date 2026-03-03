import {
  CryptoAssetCode,
  CryptoChainCode,
  CurrencyCode,
  OrderType,
  PaymentMode,
  RouteType,
  SettingStatus,
} from './client';

export type OrderConfig = {
  maxAmount?: string;
  minAmount?: string;
  order: number;
  orderSide: number;
  orderTypes: Array<OrderType>;
  routeTypes: Array<RouteType>;
  status: SettingStatus;
};

export type OrderTypeConfig = {
  maxAmount?: string;
  minAmount?: string;
  order: number;
  orderSide: number;
  routeTypes: Array<RouteType>;
  status: SettingStatus;
};

export type Discount = {
  type: string;
  value: string;
};

export type FeeDetail = {
  currency: CurrencyCode;
  discount?: Discount;
  discountValue: string;
  fee: string;
  type: string;
};

export type GetOrderRampQuoteResponse = {
  dstAmount: string;
  dstChain: CryptoChainCode;
  dstCurrency: CurrencyCode;
  exchangeRate: string;
  feeDetails: Array<FeeDetail>;
  orderType: OrderType;
  paymentMode: PaymentMode;
  srcAmount: string;
  srcChain: CryptoChainCode;
  srcCurrency: CurrencyCode;
};

export type GetRampOrderQuoteResponses = {
  /**
   * OK
   */
  200: {
    code: number;
    data: GetOrderRampQuoteResponse;
    message: string;
    traceId: string;
  };
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

export type GetRampOrderQuoteResponse = GetRampOrderQuoteResponses[keyof GetRampOrderQuoteResponses];
export type RampOrderPaymentModeConfig = {
  payinConfig?: OrderConfig;
  paymentMode: PaymentMode;
  payoutConfig?: OrderConfig;
  status: SettingStatus;
};
export type GetRampOrderQuoteConfigResponse = {
  assetConfigs: Record<string, RampOrderAssetConfig>;
  initialQuote?: GetOrderRampQuoteResponse;
  isDappRegion: boolean;
  /**
   * Based on KYC level
   */
  maxAmount?: string;
  /**
   * Based on KYC level
   */
  minAmount?: string;
  orderConfigMap: {
    [key: string]: OrderConfig;
  };
  paymentModeConfigs: Record<string, RampOrderPaymentModeConfig>;
};
