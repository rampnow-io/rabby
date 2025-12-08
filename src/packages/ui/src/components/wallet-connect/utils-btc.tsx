"use client"

import { BitcoinAdapter, BitcoinConnector } from "@reown/appkit-adapter-bitcoin"
import { getChainConfig } from "@repo/utils"
import { TxnData } from "./types"

export const getBtcAssetBalance = async (
  connection: BitcoinAdapter,
  address: string,
  chain: string,
  currency: string,
): Promise<bigint | undefined> => {
  const chainConfig = getChainConfig(chain)

  const res = await connection.getBalance({
    address,
    chainId: chainConfig?.walletConnectChain?.id,
  })

  return BigInt(res.balance)
}

export const createBtcTransaction = (chain: string, txnData: TxnData) => {
  if (txnData.txnType === "transfer") {
    return {
      recipient: txnData.receiverAddress,
      amount: txnData.amount,
    }
  }

  throw new Error("Unsupported EVM transaction type")
}

export const sendBtcTransaction = async (
  chain: string,
  txnData: TxnData,
  address: string,
  walletProvider: BitcoinConnector,
): Promise<string> => {
  const chainTxn = createBtcTransaction(chain, txnData)
  return await walletProvider.sendTransfer(chainTxn)
}
