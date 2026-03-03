import {
  type AssetConfig,
  OrderType,
  parseAsEnum,
  parseAsStringOptional,
  PaymentMode,
  RouteType,
  SettingStatus,
} from "@repo/utils"

import { parseAsString } from "nuqs"
import { GetRampOrderQuoteConfigResponse, OrderConfig, RampOrderPaymentModeConfig } from "./type"
import { CryptoChainCode, CurrencyCode } from "./client"

export const defaultApiKey ="pk_live_zXuMmMzFAbfnMPQnwfEaMkabwPfKsVsg"

export const defaultValue = {
  orderType: OrderType.BUY,
  srcAmount: "100.00",
  srcCurrency: CurrencyCode.EUR,
  srcChain: CryptoChainCode.FIAT,
  dstCurrency: CurrencyCode.BTC,
  dstChain: CryptoChainCode.BITCOIN,
  paymentMode: PaymentMode.SEPA,
  apiKey: "",
  walletUid: <string | undefined>undefined,
  walletAddressTag: <string | undefined>undefined,
  dstAmount: "0",
}

export const defaultQueryValues = {
  orderType: parseAsEnum(Object.values(OrderType)).withDefault(OrderType.BUY),
  srcAmount: parseAsString.withDefault('100.00'),
  srcCurrency: parseAsEnum(Object.values(CurrencyCode)).withDefault(CurrencyCode.EUR),
  srcChain: parseAsEnum(Object.values(CryptoChainCode)).withDefault(CryptoChainCode.FIAT),
  dstCurrency: parseAsEnum(Object.values(CurrencyCode)).withDefault(CurrencyCode.BTC),
  dstChain: parseAsEnum(Object.values(CryptoChainCode)).withDefault(CryptoChainCode.BITCOIN),
  paymentMode: parseAsEnum(Object.values(PaymentMode)).withDefault(PaymentMode.SEPA),
  apiKey: parseAsString.withDefault(''),
  walletUid: parseAsStringOptional,
  walletAddressTag: parseAsStringOptional,
}

export type QuoteConfig = GetRampOrderQuoteConfigResponse

export type PaymentModeConfigMap = Record<string, RampOrderPaymentModeConfig>

export type AssetQuoteConfig = AssetConfig & {
  exchangeRate: string
  minAmount?: string
  maxAmount?: string
  order?: number
  routeTypes?: RouteType[]
  status: SettingStatus
  payinModes: PaymentMode[]
  payoutModes: PaymentMode[]
}

export interface OrderTypeConfig {
  orderType: OrderType
  srcAssetConfig: AssetQuoteConfig[]
  dstAssetConfig: AssetQuoteConfig[]
  orderConfig?: OrderConfig
  paymentModeConfigMap: PaymentModeConfigMap
  isDappRegion: boolean
}

export enum OrderSide {
  SRC = 1,
  DST = 2,
}
