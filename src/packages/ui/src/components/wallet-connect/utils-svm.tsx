"use client"

import { AnyTransaction, Provider } from "@reown/appkit-adapter-solana/react"
import { getAssetConfig, getChainConfig, getCurrencyConfig } from "@repo/utils"
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"
import { parseUnits } from "viem"
import { TxnData } from "./types"

const getAtaInfo = async (
  mint: PublicKey,
  owner: PublicKey,
  connection: Connection,
) => {
  const ata = await getAssociatedTokenAddress(mint, owner)
  const account = await connection?.getAccountInfo(ata)
  return { exists: !!account, address: ata }
}

export const getSvmAssetBalance = async (
  connection: Connection,
  address: string,
  chain: string,
  currency: string,
): Promise<bigint | undefined> => {
  const assetConfig = getAssetConfig(chain, currency)
  const currencyConfig = getCurrencyConfig(currency)
  const chainConfig = getChainConfig(chain)

  if (!assetConfig || !currencyConfig || !chainConfig) {
    return
  }

  if (currency === chainConfig.nativeToken) {
    const account = await connection.getAccountInfo(new PublicKey(address))
    if (account) {
      return BigInt(account.lamports)
    }

    return BigInt(0)
  }

  if (assetConfig.contractAddress) {
    const mint = new PublicKey(assetConfig.contractAddress)
    const ata = await getAssociatedTokenAddress(mint, new PublicKey(address))
    if (!ata) {
      return BigInt(0)
    }

    const tokenAmount = await connection.getTokenAccountBalance(ata)
    return BigInt(tokenAmount.value.amount) || BigInt(0)
  }

  return
}

export const createSvmTransaction = async (
  chain: string,
  txnData: TxnData,
  connection: Connection,
  address: string,
): Promise<AnyTransaction> => {
  const sender = new PublicKey(address)
  const receiver = new PublicKey(txnData.receiverAddress)
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash()
  const assetConfig = getAssetConfig(chain, txnData.currency)
  const currencyConfig = getCurrencyConfig(txnData.currency)
  const chainConfig = getChainConfig(chain)

  if (!assetConfig || !currencyConfig || !chainConfig) {
    throw new Error("Unsupported EVM Transaction Option")
  }

  const unitAmount = BigInt(
    parseUnits(txnData.amount, currencyConfig.precision),
  )
  const txn = new Transaction({
    feePayer: sender,
    blockhash: blockhash,
    lastValidBlockHeight: lastValidBlockHeight,
  })

  if (txnData.txnType === "transfer") {
    // Native SOL transfer
    if (txnData.currency === chainConfig.nativeToken) {
      return txn.add(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: receiver,
          lamports: unitAmount,
        }),
      )
    }

    // SPL Token transfer
    if (assetConfig.contractAddress) {
      const mint = new PublicKey(assetConfig.contractAddress)
      const senderAta = await getAtaInfo(mint, sender, connection)
      const receiverAta = await getAtaInfo(mint, receiver, connection)

      if (!receiverAta.exists) {
        txn.add(
          createAssociatedTokenAccountInstruction(
            sender,
            receiverAta.address,
            receiver,
            mint,
          ),
        )
      }

      return txn.add(
        createTransferInstruction(
          senderAta.address,
          receiverAta.address,
          sender,
          unitAmount,
        ),
      )
    }
  }

  throw new Error("SVM Transaction not implemented")
}

export const sendSvmTransaction = async (
  chain: string,
  txnData: TxnData,
  address: string,
  walletProvider: Provider,
  connection: Connection,
): Promise<string> => {
  const transaction = await createSvmTransaction(
    chain,
    txnData,
    connection,
    address,
  )
  return await walletProvider.sendTransaction(transaction, connection)
}
