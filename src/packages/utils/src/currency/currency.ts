import { formatCurrency as coingeckoFormatCurrency } from "@coingecko/cryptoformat"
import {
  AssetConfig,
  ChainConfig,
  ChainConfigMap,
  CryptoAssetConfigMap,
  CurrencyConfig,
  CurrencyConfigMap,
} from "../../constants"
import { toTitleCase } from "../string"

export function parseFillAmount(fillAmount: string, amount: string): string {
  if (parseFloat(fillAmount) > 0) {
    return fillAmount
  }

  if (parseFloat(amount) > 0) {
    return amount
  }

  return "0"
}

export function getAsset(chain?: string, currency?: string): string {
  return `${currency}:${chain}`
}

export function parseAsset(assetCode?: string): [string, string] {
  if (!assetCode) {
    return ["", ""]
  }

  const [currency, chain] = assetCode.split(":")
  return [currency, chain]
}

export function parseAssetCurrency(assetCode?: string): string {
  const [currency] = parseAsset(assetCode)
  return currency
}

export function parseAssetChain(assetCode?: string): string {
  const [, chain] = parseAsset(assetCode)
  return chain
}

export function getAssetConfig(
  chain: string,
  currency: string,
): AssetConfig | undefined {
  const asset = getAsset(chain, currency)
  return CryptoAssetConfigMap[asset as keyof typeof CryptoAssetConfigMap]
}

export function getAssetName(code?: string): string {
  let name =
    CryptoAssetConfigMap[code as keyof typeof CryptoAssetConfigMap]?.name

  if (name) {
    return name
  }

  if (!Boolean(code)) {
    return "unknown"
  }

  const parts = code?.split(":") ?? ["", ""]
  const chainName =
    ChainConfigMap[parts[1] as keyof typeof ChainConfigMap]?.name ??
    toTitleCase(parts[1])

  return `${parts[0]} (${chainName})`
}

export function getCurrencyConfig(
  currency: string,
): CurrencyConfig | undefined {
  return CurrencyConfigMap[currency as keyof typeof CurrencyConfigMap]
}

export function getChainConfig(
  chain: string | undefined,
): ChainConfig | undefined {
  if (!chain) {
    return
  }

  return ChainConfigMap[chain as keyof typeof ChainConfigMap]
}

export function deprecatedFormatCurrency(
  amount: string | number | undefined,
  currency: string | undefined,
): string {
  if (!amount) {
    return "0"
  }

  if (!currency) {
    return String(amount)
  }

  return coingeckoFormatCurrency(Number(amount), currency)
}

/**
 * Rounds a number up to the nearest non-zero value with fixed precision.
 * @param value - The number to round.
 * @param precision - The number of decimal places.
 * @returns The rounded number.
 */
export function ceilToPrecision(value: number, precision: number): number {
  if (value === 0) return 0
  const factor = Math.pow(10, precision)
  return Math.ceil(value * factor) / factor
}

export interface formatCurrencyOptions {
  noSymbol?: boolean
  noRoundOff?: boolean
}

export function formatCurrency(
  amount: string | number | undefined,
  currency: string | undefined,
  opts?: formatCurrencyOptions,
): string {
  let processedAmount = amount

  if (amount === undefined || isNaN(Number(amount))) {
    processedAmount = ""
  }

  if (
    processedAmount != "" &&
    currency &&
    !Boolean(opts?.noRoundOff) &&
    Object.keys(CurrencyConfigMap).includes(currency)
  ) {
    const precision = CurrencyConfigMap[currency].displayPrecision
    const numericValue = Number(processedAmount)
    const roundedValue = ceilToPrecision(numericValue, precision).toString()
    processedAmount = roundedValue
      .replace(/(?:\.\d*?)0+$/, "")
      .replace(/\.$/, "")
  }

  if (opts?.noSymbol || !currency) {
    return String(processedAmount)
  }

  const tokenCode = CurrencyConfigMap[currency].tokenCode || currency

  return `${String(processedAmount)} ${tokenCode}`
}
