import {
  formatCreditCard,
  formatDate,
  formatGeneral,
  getCreditCardType,
  unformatCreditCard,
} from "cleave-zen"
import { PaymentMode } from "../../constants"

export enum CardType {
  Mastercard = "mastercard",
  Visa = "visa",
}

export interface SchemeConfig {
  code: number
  name: string
  regexp: RegExp
  image: string
}

export const SchemeConfigMap: Record<CardType, SchemeConfig> = {
  [CardType.Mastercard]: {
    code: 1,
    name: "Mastercard",
    regexp: /^5[1-5][0-9]{14}$|^2[2-7][0-9]{14}$/,
    image: "/image/icon/payment-mode/mastercard.svg",
  },
  [CardType.Visa]: {
    code: 2,
    name: "Visa",
    regexp: /^4[0-9]{12}(?:[0-9]{3})?$/,
    image: "/image/icon/payment-mode/visa.svg",
  },
}

export interface FormatterConfig {
  format: (value: string) => string
  unformat: (value: string) => string
}

export const CardNumberFormatter: FormatterConfig = {
  format: (value) => formatCreditCard(value, { delimiterLazyShow: true }),
  unformat: unformatCreditCard,
}

export const CardExpiryFormatter: FormatterConfig = {
  format: (value) =>
    formatDate(value, {
      datePattern: ["m", "y"],
      delimiter: "/",
      delimiterLazyShow: true,
    }),
  unformat: (value) => value.replace("/", "").substring(0, 4),
}

export const CardCvvFormatter: FormatterConfig = {
  format: (value) => formatGeneral(value, { blocks: [3], numericOnly: true }),
  unformat: (value) => formatGeneral(value, { blocks: [3], numericOnly: true }),
}

export function getCardType(value: string): CardType | undefined {
  const cardType = getCreditCardType(value) as unknown
  if (
    Object.prototype.hasOwnProperty.call(SchemeConfigMap, cardType as CardType)
  ) {
    return cardType as CardType
  }

  return undefined
}

export function parseSchemeFlag(flag: number): CardType[] {
  if (flag === 0) {
    return Object.keys(SchemeConfigMap) as CardType[]
  }

  const schemes: CardType[] = []

  Object.keys(SchemeConfigMap).forEach((key) => {
    // eslint-disable-next-line no-bitwise -- Bitwise operation is required for flag checking
    if ((flag & SchemeConfigMap[key as CardType].code) > 0) {
      schemes.push(key as CardType)
    }
  })

  return schemes
}

export function validateCardNumber(
  cardNumber: string,
  schemes: CardType[],
): boolean {
  for (const key of schemes) {
    if (SchemeConfigMap[key].regexp.test(cardNumber)) {
      return true
    }
  }

  return false
}

export function validateExpiryDate(expiryDate: string): boolean {
  if (expiryDate.length !== 4) {
    return false
  }

  const month = parseInt(expiryDate.substring(0, 2))
  const year = parseInt(expiryDate.substring(2, 4))

  if (!month || !year || month < 1 || month > 12) {
    return false
  }

  // Get the current date
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear() % 100 // Get last two digits of current year (e.g., 23 for 2023)
  const currentMonth = currentDate.getMonth() + 1 // Months are 0-indexed

  // Check if expiry date is in the past
  return year > currentYear || (year === currentYear && month >= currentMonth)
}

export const isPaymentModeAvailable = (paymentMode: string): boolean => {
  if (paymentMode === (PaymentMode.APPLE_PAY as string)) {
    return (
      // @ts-expect-error - ApplePaySession and PaymentRequest may not be available
      typeof window.ApplePaySession !== "undefined" ||
      typeof window.PaymentRequest !== "undefined"
    )
  }

  return true
}
