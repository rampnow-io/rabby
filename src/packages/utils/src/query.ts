"use client"

import { createParser } from "nuqs"

// https://stackoverflow.com/a/69058437
export type NullToUndefined<T> = T extends null
  ? undefined
  : { [K in keyof T]: NullToUndefined<T[K]> }

export type UndefinedToNull<T> = T extends undefined
  ? null
  : { [K in keyof T]: UndefinedToNull<T[K]> }

export function nullToUndefined<T>(obj: T): NullToUndefined<T> {
  if (obj === null) {
    return undefined as NullToUndefined<T>
  }

  if (obj?.constructor.name === "Object") {
    const newObj: Record<string, unknown> = {}
    for (const key in obj) {
      newObj[key] = nullToUndefined(obj[key])
    }
    return newObj as NullToUndefined<T>
  }

  return obj as NullToUndefined<T>
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Generic parser return type is complex and inferred correctly
export function parseAsEnum<Enum extends string>(validValues: Enum[]) {
  return createParser({
    parse: (query: string): Enum | null => {
      const asEnum = query as unknown as Enum
      if (validValues.includes(asEnum)) {
        return asEnum
      }
      return null
    },
    serialize: (value: Enum): string => (value ? value.toString() : ""),
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Generic parser return type is complex and inferred correctly
export function parseAsEnumOptional<Enum extends string>(validValues: Enum[]) {
  return createParser<Enum | undefined>({
    parse: (query: string | undefined): Enum | undefined => {
      const asEnum = query as unknown as Enum
      if (validValues.includes(asEnum)) {
        return asEnum
      }
      return undefined
    },
    serialize: (value: Enum | undefined): string =>
      value ? value.toString() : "",
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Generic parser return type is complex and inferred correctly
export function parseAsEnumArray<Enum extends string>(validValues: Enum[]) {
  return createParser({
    parse: (query: string): Enum[] => {
      if (!query) return []
      return query
        .split(",")
        .map((item): Enum | null => {
          const asEnum = item.trim() as unknown as Enum
          return validValues.includes(asEnum) ? asEnum : null
        })
        .filter(Boolean) as Enum[]
    },
    serialize: (values: Enum[]): string => {
      return Array.isArray(values) && values.length > 0 ? values.join(",") : ""
    },
  })
}

export const parseAsStringOptional = createParser<string | undefined>({
  parse: (v) => {
    return v === "" ? undefined : v
  },
  serialize: (v) => (v ? String(v) : ""),
})

export function safeParseUrl(url: string): URL | null {
  try {
    return new URL(decodeURIComponent(url))
  } catch (error) {
    return null
  }
}

export const parseSearchParams = <T = Record<string, any>>(
  searchParams: URLSearchParams,
): T => {
  return Object.fromEntries(
    Array.from(searchParams).map(([key, value]) => {
      value = value.trim()
      if (value.startsWith("{") || value.startsWith("[")) {
        try {
          return [key, JSON.parse(value)]
        } catch {
          return [key, value]
        }
      }
      return [key, value]
    }),
  ) as T
}
