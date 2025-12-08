import { type ClassValue, clsx } from "clsx"
import { parseAsString, type ParserBuilder } from "nuqs"
import { twMerge } from "tailwind-merge"
import { CountryList } from "../constants"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string | undefined | null): string {
  return (
    str?.replace(
      // eslint-disable-next-line prefer-named-capture-group -- Capture groups needed for replacement
      /^_*(.)|_+(.)/g,
      (match, firstChar: string, additionalChar: string) =>
        firstChar
          ? firstChar.toUpperCase()
          : ` ${additionalChar.toUpperCase()}`,
    ) ?? ""
  )
}

export function enumToSelectOptions<
  Enum extends object,
  Keys extends keyof Enum,
>(enumVal: Enum): { value: (typeof enumVal)[Keys]; label: string }[] {
  return Object.values(enumVal).map((enumValue: (typeof enumVal)[Keys]) => {
    return { value: enumValue, label: toTitleCase(String(enumValue)) }
  })
}

export const convertToSelectOptions = (
  options: any[],
  idKey?: string,
  valueKey?: string,
) => {
  if (!Array.isArray(options)) return []

  return options.map((item) => {
    if (typeof item === "string" || typeof item === "number") {
      return {
        value: item,
        label: item,
      }
    }
    return {
      label: item[idKey ?? "label"],
      value: item[valueKey ?? "value"],
    }
  })
}

type StringBuilder = Omit<ParserBuilder<string>, "parseServerSide"> & {
  readonly defaultValue: string
  parseServerSide: (value: string | string[] | undefined) => string
}

export function convertToQueryParams<T extends object>(
  obj: T,
): Record<string, StringBuilder> {
  const newObj: Record<string, StringBuilder> = {}

  for (const key in obj) {
    newObj[key] = parseAsString.withDefault(obj[key] as string)
  }

  return newObj
}

export function validatePostalCode(
  countryCode: string,
  postalCode: string,
): boolean {
  const foundCountry = CountryList.find(
    (country) => country.code === countryCode,
  )
  return Boolean(foundCountry?.postalCodeRegex.test(postalCode.trim()))
}

export function truncate(
  stringValue: string | undefined,
  group: [number, number] = [4, 4],
  delimiter = "...",
): string {
  if (!stringValue) {
    return ""
  }

  const minToFold = group.reduce(
    (accumulator, groupValue) => accumulator + groupValue,
    delimiter.length * (group.length - 1),
  )

  return minToFold > stringValue.length
    ? stringValue
    : `${stringValue.substring(0, group[0])}${delimiter}${stringValue.substring(stringValue.length - group[1], stringValue.length)}`
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function filteredSearchParams(
  params: Record<string, any>,
): URLSearchParams {
  const map = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  )
  return new URLSearchParams(map)
}

export function pluckUnique<T, K extends keyof T>(
  items: T[] | Map<any, T> | Record<any, T>,
  key: K,
): T[K][] {
  let values: T[K][]

  if (items instanceof Map) {
    values = Array.from(items.values()).map((item) => item[key])
  } else if (Array.isArray(items)) {
    values = items.map((item) => item[key])
  } else {
    values = Object.values(items).map((item) => item[key])
  }

  return [...new Set(values)]
}

export function searchKeyWords(
  term: string,
  keyWords: (string | undefined)[],
): boolean {
  const searchLower = term.toLowerCase()
  return keyWords.some((keyWord) =>
    keyWord?.toLowerCase().includes(searchLower),
  )
}
