import { CurrencyConfigMap } from "@repo/utils"
import { EntityProvider } from "./api-enums"
import { ChainConfigMap } from "./chain-configs"
import { CountryList } from "./country-configs"
import { CryptoAsset, CryptoAssetConfigMap } from "./crypto-asset-configs"

export const getEntityProviderInt = (provider: EntityProvider): number => {
  return Object.values(EntityProvider).indexOf(provider)
}

export const getEntityProvider = (
  providerInt?: number | string | null,
): EntityProvider => {
  if (typeof providerInt === "string") {
    providerInt = Number(providerInt)
  }

  if (
    !providerInt ||
    providerInt < 0 ||
    providerInt >= Object.values(EntityProvider).length
  ) {
    providerInt = 0
  }

  return Object.values(EntityProvider)[providerInt] as EntityProvider
}

export const getCurrencyIcon = (currencyCode: string | undefined): string => {
  const currency = currencyCode?.toUpperCase() ?? ""
  return CurrencyConfigMap[currency]?.image ?? "/image/icon/currency/all.svg"
}

export const getCurrencyName = (currencyCode: string | undefined): string => {
  const currency = currencyCode?.toUpperCase() ?? ""
  return CurrencyConfigMap[currency]?.name ?? currency
}

export const getChainIcon = (chainCode: string | undefined): string => {
  const chain = chainCode?.toLowerCase() ?? ""
  return ChainConfigMap[chain]?.image ?? "/image/icon/currency/all.svg"
}

export const getChainName = (chainCode: string | undefined): string => {
  const chain = chainCode?.toLowerCase() ?? ""
  return ChainConfigMap[chain]?.name ?? chain
}

export const getCountryConfig = (countryCode: string | undefined) => {
  const country = countryCode?.toUpperCase() ?? ""
  return CountryList.find((c) => c.code === country) ?? null
}

export function getAssetOrder(assetCode?: string): number {
  if (!assetCode || !CryptoAssetConfigMap[assetCode as CryptoAsset]) {
    return Infinity
  }

  return CryptoAssetConfigMap[assetCode as CryptoAsset].order ?? Infinity
}

export function getChainOrder(chainCode?: string): number {
  if (!chainCode || !ChainConfigMap[chainCode]) {
    return Infinity
  }

  return ChainConfigMap[chainCode].order ?? Infinity
}

export function getTokenCode(currencyCode: string): string {
  const cf = CurrencyConfigMap[currencyCode as keyof typeof CurrencyConfigMap]
  return cf?.tokenCode ?? currencyCode
}
