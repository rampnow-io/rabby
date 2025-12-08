"use client"

import { getAssetConfig, getChainConfig, getCurrencyConfig } from "@repo/utils"
import { Address, encodeFunctionData, parseUnits, PublicClient } from "viem"
import { Config } from "wagmi"
import { SendTransactionMutateAsync } from "wagmi/query"
import { TxnData } from "./types"

const Erc20Abi = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const

interface EvmTxn {
  to?: Address
  value?: bigint
  data?: `0x${string}`
  gas?: bigint
}

export const getEvmAssetBalance = async (
  connection: PublicClient,
  address: string,
  chain: string,
  currency: string,
): Promise<bigint | undefined> => {
  const assetConfig = getAssetConfig(chain, currency)
  const currencyConfig = getCurrencyConfig(currency)
  const chainConfig = getChainConfig(chain)
  const evmAddress = address as Address

  if (!assetConfig || !currencyConfig || !chainConfig) {
    throw new Error("Unsupported EVM Asset")
  }

  try {
    if (chainConfig.nativeToken === currency) {
      const balance = await connection.getBalance({
        address: evmAddress,
      })
      return balance
    }

    if (assetConfig.contractAddress) {
      const balance = await connection.readContract({
        address: assetConfig.contractAddress as Address,
        abi: Erc20Abi,
        functionName: "balanceOf",
        args: [evmAddress],
      })
      return balance as bigint
    }

    return
  } catch (err) {
    console.error("Failed to fetch EVM balance:", err)
    return
  }
}

export const createEvmTransaction = (
  chain: string,
  txnData: TxnData,
): EvmTxn => {
  const assetConfig = getAssetConfig(chain, txnData.currency)
  const currencyConfig = getCurrencyConfig(txnData.currency)
  const chainConfig = getChainConfig(chain)
  const receiverAddress = txnData.receiverAddress as Address

  if (!assetConfig || !currencyConfig || !chainConfig) {
    throw new Error("Unsupported EVM Transaction Option")
  }

  const unitAmount = BigInt(
    parseUnits(txnData.amount, currencyConfig.precision),
  )

  if (txnData.txnType === "transfer") {
    if (chainConfig.nativeToken === txnData.currency) {
      return {
        to: receiverAddress,
        value: unitAmount,
      }
    }

    return {
      to: assetConfig.contractAddress as `0x${string}`,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: Erc20Abi,
        functionName: "transfer",
        args: [receiverAddress, unitAmount],
      }),
    }
  }

  throw new Error("Unsupported EVM transaction type")
}

export const sendEvmTransaction = async (
  chain: string,
  txnData: TxnData,
  address: string,
  sendTransaction: SendTransactionMutateAsync<Config, unknown>,
): Promise<string> => {
  const evmTxn = createEvmTransaction(chain, txnData)
  return await sendTransaction(evmTxn)
}
