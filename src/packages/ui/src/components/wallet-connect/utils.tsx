import { getAssetConfig, getChainConfig, getCurrencyConfig } from "@repo/utils"
import { parseUnits } from "viem"
import {
  btcChainNamespace,
  evmChainNamespace,
  svmChainNamespace,
} from "./config"
import { getChainNamespace } from "./connect-button"
import { TxnData } from "./types"

export function getTxnQrData(chain: string, txnData: TxnData): string {
  const { receiverAddress, amount, currency } = txnData
  const assetConfig = getAssetConfig(chain, currency)
  const currencyConfig = getCurrencyConfig(currency)
  const chainConfig = getChainConfig(chain)
  const chainType = getChainNamespace(chain)
  const contractAddress = assetConfig?.contractAddress

  if (chainConfig && currencyConfig && chainType) {
    const unitAmount = parseUnits(amount.toString(), currencyConfig.precision)

    switch (chainType) {
      case btcChainNamespace:
        return `bitcoin:${receiverAddress}?amount=${amount}`

      case evmChainNamespace: {
        return contractAddress
          ? `ethereum:${contractAddress}@${chainConfig.chainId}/transfer?address=${receiverAddress}&uint256=${unitAmount}`
          : `ethereum:${receiverAddress}@${chainConfig.chainId}?value=${unitAmount}`
      }

      case svmChainNamespace: {
        let uri = `solana:${receiverAddress}?amount=${amount}`

        if (contractAddress) {
          uri += `&spl-token=${encodeURIComponent(contractAddress)}`
        }

        if (txnData.message) {
          uri += `&label=${encodeURIComponent(txnData.message)}`
        }

        return uri
      }
    }
  }

  return txnData.receiverAddress
}

export function parseCaipNetworkId(caipNetworkId: string | undefined) {
  const parts = (caipNetworkId ?? "").split(":")
  if (parts.length < 2) {
    return null
  }

  return { chainNamespace: parts[0], chainId: parts.at(-1) }
}
