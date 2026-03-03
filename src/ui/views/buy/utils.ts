import {
  type AssetConfig,
  type CryptoAsset,
  CryptoAssetConfigMap,
  CurrencyConfigMap,
  formatCurrency,

} from "@repo/utils"
import {
  CryptoChainCode,
  CurrencyCode,
  GetRampOrderQuoteRequest,
  OrderType,
  PaymentMode,
  type RampOrderAssetConfig,
  RouteType,
  SettingStatus,
} from "./client"
import type { OrderConfig } from "./type"

import {
  type AssetQuoteConfig,
  defaultApiKey,
  defaultValue,
  OrderSide,
  type OrderTypeConfig,
  type QuoteConfig,
} from "./order-config"

export const buildQuoteCacheKey = (obj: Record<string, any>): string => {
  return Object.values(obj).join("-")
}

export const getPaymentModes = (
  orderTypeConfig: OrderTypeConfig | undefined,
  assetCode: string,
) => {
  if (orderTypeConfig?.orderType === OrderType.SELL) {
    return (
      Object.values(orderTypeConfig?.dstAssetConfig ?? {}).find(
        (asset) => asset.code === assetCode,
      )?.payoutModes ?? []
    )
      .filter(
        (mode) =>
          orderTypeConfig?.paymentModeConfigMap[mode]?.status ===
            SettingStatus.ACTIVE &&
          orderTypeConfig.paymentModeConfigMap[mode].payoutConfig?.status ===
            SettingStatus.ACTIVE,
      )
      .sort((a, b) => {
        return (
          (orderTypeConfig.paymentModeConfigMap[a].payoutConfig?.order ?? 0) -
          (orderTypeConfig.paymentModeConfigMap[b].payoutConfig?.order ?? 0)
        )
      })
  } else if (
    orderTypeConfig?.orderType === OrderType.BUY ||
    orderTypeConfig?.orderType === OrderType.CROSS_BORDER
  ) {
    return (
      Object.values(orderTypeConfig?.srcAssetConfig ?? {}).find(
        (asset) => asset.code === assetCode,
      )?.payinModes ?? []
    )
      .filter(
        (mode) =>
          orderTypeConfig?.paymentModeConfigMap[mode]?.status ===
            SettingStatus.ACTIVE &&
          orderTypeConfig.paymentModeConfigMap[mode].payinConfig?.status ===
            SettingStatus.ACTIVE &&
          orderTypeConfig.paymentModeConfigMap[
            mode
          ].payinConfig.orderTypes.includes(orderTypeConfig.orderType),
      )
      .sort((a, b) => {
        return (
          (orderTypeConfig.paymentModeConfigMap[a].payinConfig?.order ?? 0) -
          (orderTypeConfig.paymentModeConfigMap[b].payinConfig?.order ?? 0)
        )
      })
  }

  return []
}

export const getDefaultApiKey = () => {
  if (typeof window !== "undefined") {
    return window.sessionStorage.getItem("apiKey") ?? defaultApiKey
  }

  return defaultApiKey
}

export const parseOrderTypeConfig = (
  quoteConfig: QuoteConfig | undefined,
  orderType: OrderType,
): OrderTypeConfig => {
  if (!quoteConfig) {
    return {
      orderType: OrderType.UNKNOWN,
      srcAssetConfig: [],
      dstAssetConfig: [],
      paymentModeConfigMap: {},
      isDappRegion: false,
    }
  }

  const paymentModeConfig = quoteConfig.paymentModeConfigs
  const assetConfigs = quoteConfig.assetConfigs

  return {
    orderType,
    srcAssetConfig: filterAssetConfigs(assetConfigs, orderType, OrderSide.SRC),
    dstAssetConfig: filterAssetConfigs(assetConfigs, orderType, OrderSide.DST),
    orderConfig: quoteConfig.orderConfigMap[orderType],
    paymentModeConfigMap: paymentModeConfig,
    isDappRegion: quoteConfig.isDappRegion,
  }
}

const filterAssetConfigs = (
  assetConfigs: Record<string, RampOrderAssetConfig>,
  orderType: OrderType,
  orderSide: OrderSide,
) => {
  return Object.values(assetConfigs)
    .filter((asset) => {
      const assetCode = asset.asset as unknown as CryptoAsset
      if (
        !CryptoAssetConfigMap[assetCode] ||
        !asset?.orderTypeConfigs?.[orderType]
      ) {
        return false
      }

      return (
        (asset.orderTypeConfigs[orderType].orderSide & orderSide) > 0 &&
        asset.status === SettingStatus.ACTIVE &&
        asset.orderTypeConfigs[orderType].status !== SettingStatus.INACTIVE
      )
    })
    .sort((a, b) => {
      // Sort based on listing order
      const getListingOrder = (config: { status: SettingStatus; order: number }) => {
        return config.status !== SettingStatus.ACTIVE
          ? config.order + 100000 // Move suspended assets to the end
          : config.order
      }

      return (
        getListingOrder(a.orderTypeConfigs[orderType]) -
        getListingOrder(b.orderTypeConfigs[orderType])
      )
    })
    .map((asset) => {
      // Create map
      const assetCode = asset.asset as unknown as CryptoAsset
      const assetConfig = CryptoAssetConfigMap[assetCode]
      return {
        ...asset,
        ...assetConfig,
        code: assetConfig?.code || assetCode,
        minAmount: asset.orderTypeConfigs[orderType].minAmount,
        maxAmount: asset.orderTypeConfigs[orderType].maxAmount,
        routeTypes: asset.orderTypeConfigs[orderType].routeTypes,
        order: asset.orderTypeConfigs[orderType].order,
        disabled:
          asset.orderTypeConfigs[orderType].status !== SettingStatus.ACTIVE,
      }
    })
}

export const getAssetConfigMap = (
  configs: AssetQuoteConfig[],
  routeType: RouteType,
) => {
  return configs.reduce<Record<string, AssetConfig>>((assetMap, asset) => {
    if (!asset.routeTypes || asset.routeTypes?.includes(routeType)) {
      assetMap[asset.code] = asset
    }

    return assetMap
  }, {})
}

export const getSrcAmount = (
  orderTypeConfig: OrderTypeConfig,
  currency: string,
  chain: string,
) => {
  const srcCurrencyConfig = orderTypeConfig.srcAssetConfig.find(
    (asset) => asset.currency === currency && asset.chain === chain,
  )

  if (
    srcCurrencyConfig?.status !== SettingStatus.ACTIVE ||
    !CurrencyConfigMap[srcCurrencyConfig.currency]
  ) {
    throw new Error("invalid_asset_configuration")
  }

  const currencyConfig = CurrencyConfigMap[srcCurrencyConfig.currency]
  if (
    currencyConfig?.defaultDenominations &&
    currencyConfig.defaultDenominations.length > 1
  ) {
    return currencyConfig.defaultDenominations[1]
  }

  return (
    parseFloat(defaultValue.srcAmount) *
    parseFloat(srcCurrencyConfig.exchangeRate)
  )
    .toFixed(currencyConfig.displayPrecision)
    .toString()
}

export const findAssetConfig = (
  assetConfigs: AssetQuoteConfig[] | undefined,
  asset: string,
) => {
  return (assetConfigs ?? []).find((cf) => cf.code === asset)
}

export const splitPaymentMode = (
  orderType: OrderType,
  mode: PaymentMode,
): [PaymentMode, PaymentMode] => {
  if (orderType === OrderType.BUY) {
    return [mode, PaymentMode.CRYPTO]
  }

  return [PaymentMode.CRYPTO, mode]
}

export const combinePaymentModes = (
  orderType: OrderType,
  payinMode: PaymentMode,
  payoutMode: PaymentMode,
): PaymentMode => {
  if (orderType === OrderType.BUY || orderType === OrderType.CROSS_BORDER) {
    return payinMode
  }

  return payoutMode
}

export const validateSrcAmount = (
  orderTypeConfig: OrderTypeConfig,
  amount: number | string,
  srcAsset: string,
  dstAsset: string,
  paymentMode: PaymentMode,
) => {
  if (orderTypeConfig.orderType === OrderType.UNKNOWN) {
    return
  }
  const [payinMode, payoutMode] = splitPaymentMode(
    orderTypeConfig.orderType,
    paymentMode,
  )

  const srcAssetConfig = findAssetConfig(
    orderTypeConfig.srcAssetConfig,
    srcAsset,
  )
  const dstAssetConfig = findAssetConfig(
    orderTypeConfig.dstAssetConfig,
    dstAsset,
  )

  if (!srcAssetConfig || !dstAssetConfig) {
    return { type: "invalid", message: `Invalid asset config` }
  }

  let payinModeConfig =
    orderTypeConfig.paymentModeConfigMap[payinMode].payinConfig
  let payoutModeConfig =
    orderTypeConfig.paymentModeConfigMap[payoutMode].payoutConfig

  const orderRange = getOrderRange(
    [
      orderTypeConfig.orderConfig,
      srcAssetConfig,
      payinModeConfig,
      dstAssetConfig,
      payoutModeConfig,
    ],
    srcAssetConfig.exchangeRate,
  )

  if (Number(amount) < orderRange.minAmount) {
    return {
      type: "range",
      message: `Minimum amount is ${formatCurrency(orderRange.minAmount, srcAssetConfig?.currency)}`,
    }
  }

  if (Number(amount) > orderRange.maxAmount) {
    return {
      type: "range",
      message: `Maximum amount is ${formatCurrency(orderRange.maxAmount, srcAssetConfig?.currency)}`,
    }
  }

  return null
}

function getOrderRange(
  orderConfigs: ({ minAmount?: string; maxAmount?: string } | undefined)[],
  exchangeRate?: string, // Exchange rate of the output range currency
) {
  const rate = parseFloat(exchangeRate ?? "1")

  return orderConfigs.reduce(
    (acc, config) => {
      if (config?.minAmount) {
        const minAmount = parseFloat(config.minAmount) * rate
        acc.minAmount = Math.max(acc.minAmount, minAmount)
      }

      if (config?.maxAmount) {
        const maxAmount = parseFloat(config.maxAmount) * rate
        acc.maxAmount = Math.min(acc.maxAmount, maxAmount)
      }

      return acc
    },
    { minAmount: 0, maxAmount: Infinity },
  )
}

export function fetchQuoteRequestData(
  orderTypeConfig: OrderTypeConfig,
  currentQuote: GetRampOrderQuoteRequest,
): GetRampOrderQuoteRequest | undefined {
  const srcAsset = orderTypeConfig.srcAssetConfig.find(
    (asset) => asset.payinModes?.length > 0,
  )

  if (!srcAsset) {
    return
  }

  const payinMode = srcAsset.payinModes?.[0]

  const dstAsset = orderTypeConfig.dstAssetConfig.find(
    (asset) => asset.payoutModes?.length > 0,
  )
  if (!dstAsset) {
    return
  }

  const payoutMode = dstAsset.payoutModes[0]

  const paymentMode = combinePaymentModes(
    orderTypeConfig.orderType,
    payinMode,
    payoutMode,
  )

  return {
    orderType: orderTypeConfig.orderType,
    srcCurrency: srcAsset.currency as CurrencyCode,
    srcChain: srcAsset.chain as CryptoChainCode,
    srcAmount: getSrcAmount(orderTypeConfig, srcAsset.currency, srcAsset.chain),
    dstCurrency: dstAsset.currency as CurrencyCode,
    dstChain: dstAsset.chain as CryptoChainCode,
    paymentMode: paymentMode as PaymentMode,
  }
}
