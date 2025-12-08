import { AppKitNetwork } from "@reown/appkit/networks"
import { type Chain } from "thirdweb/chains"
import { CryptoAsset } from "./crypto-asset-configs"

export interface CountryConfig {
  name: string
  displayValue: string
  callingCode: string
  emoji: string
  code: string
  phoneRegex: RegExp
  postalCodeRegex: RegExp
  currency: string
}

export interface PaymentModeConfig {
  id: number
  code: string
  image: string
  name: string
}

export interface CurrencyConfig {
  id: number
  code: string
  name: string
  image: string
  precision: number
  displayPrecision: number
  tokenCode?: string
  isCrypto: boolean
  symbol?: string
  defaultDenominations?: string[]
}

export interface ChainConfig {
  id: number
  image: string
  code: string
  name: string
  order?: number
  addressRegex: RegExp
  hashRegex: RegExp
  chainId?: string
  nativeToken?: string
  isAddressTagRequired?: boolean
  addressTagType: "not_applicable" | "optional" | "required"
  addressType: string
  hashExplorerUrl: string
  walletConnectChain?: AppKitNetwork
  thirdwebChain?: Chain
}

export interface AssetConfig {
  name: string
  code: string
  currency: string
  chain: string
  disabled: boolean
  contractAddress?: string
  order?: number
  precision?: number
}

export interface PaymentProviderConfig {
  type: "ramp" | "direct"
  liquidityAsset: CryptoAsset
}
