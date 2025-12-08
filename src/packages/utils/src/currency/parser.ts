import { getAssetConfig, getCurrencyConfig, parseAsset } from "./currency"

/**
 * Multiplies a string representation of a number by a given exponent of base 10 (10exponent).
 *
 * @example
 * import { parseUnits } from 'viem'
 *
 * parseUnits('420', 9)
 * // 420000000000n
 */
export function parseUnits(value: string, decimals: number) {
  if (!/^(-?)([0-9]*)\.?([0-9]*)$/.test(value)) {
    throw new Error(`Invalid decimal number: ${value}`)
  }

  let [integer, fraction = "0"] = value.split(".")

  const negative = integer.startsWith("-")
  if (negative) integer = integer.slice(1)

  // trim trailing zeros.
  fraction = fraction.replace(/(0+)$/, "")

  // round off if the fraction is larger than the number of decimals.
  if (decimals === 0) {
    if (Math.round(Number(`.${fraction}`)) === 1)
      integer = `${BigInt(integer) + 1n}`
    fraction = ""
  } else if (fraction.length > decimals) {
    const [left, unit, right] = [
      fraction.slice(0, decimals - 1),
      fraction.slice(decimals - 1, decimals),
      fraction.slice(decimals),
    ]

    const rounded = Math.round(Number(`${unit}.${right}`))
    if (rounded > 9)
      fraction = `${BigInt(left) + BigInt(1)}0`.padStart(left.length + 1, "0")
    else fraction = `${left}${rounded}`

    if (fraction.length > decimals) {
      fraction = fraction.slice(1)
      integer = `${BigInt(integer) + 1n}`
    }

    fraction = fraction.slice(0, decimals)
  } else {
    fraction = fraction.padEnd(decimals, "0")
  }

  return BigInt(`${negative ? "-" : ""}${integer}${fraction}`)
}

/**
 *  Divides a number by a given exponent of base 10 (10exponent), and formats it into a string representation of the number.
 *
 * @example
 * import { formatUnits } from 'viem'
 *
 * formatUnits(420000000000n, 9)
 * // '420'
 */
export function formatUnits(value: bigint, decimals: number): string {
  let display = value.toString()

  const negative = display.startsWith("-")
  if (negative) display = display.slice(1)

  display = display.padStart(decimals, "0")

  let [integer, fraction] = [
    display.slice(0, display.length - decimals),
    display.slice(display.length - decimals),
  ]
  fraction = fraction.replace(/(0+)$/, "")
  return `${negative ? "-" : ""}${integer || "0"}${
    fraction ? `.${fraction}` : ""
  }`
}

export function getPrecision(assetCode: string): number {
  const [currency, chain] = parseAsset(assetCode)
  const assetConfig = getAssetConfig(chain, currency)
  if (assetConfig && assetConfig.precision !== undefined) {
    return assetConfig.precision
  }

  const currencyConfig = getCurrencyConfig(currency)
  if (currencyConfig && currencyConfig.precision !== undefined) {
    return currencyConfig.precision
  }

  return 0
}

/**
 * Converts a human decimal amount into smallest unit bigint using the asset/currency precision.
 *
 * @example
 * inflateAmount('1.23', 'USDC:ethereum') // -> 1230000n (if precision = 6)
 */
export function inflateAmount(
  amount: string | number | undefined,
  assetCode: string | undefined,
): bigint {
  if (!amount || !assetCode) {
    return BigInt(0)
  }

  return parseUnits(amount.toString(), getPrecision(assetCode))
}

/**
 * Converts a smallest unit bigint into a human decimal string using the currency precision.
 *
 * @example
 * deflateAmount(1230000n, 'USDC:ethereum') // -> '1.23' (if precision = 6)
 */
export function deflateAmount(
  amount: bigint | undefined,
  assetCode: string | undefined,
): string {
  if (amount === undefined || !assetCode) {
    return ""
  }

  return formatUnits(amount, getPrecision(assetCode))
}
