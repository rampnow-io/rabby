"use client"

import { BitcoinAdapter, BitcoinConnector } from "@reown/appkit-adapter-bitcoin"
import {
  Provider,
  useAppKitConnection,
} from "@reown/appkit-adapter-solana/react"
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitState,
} from "@reown/appkit/react"
import { ChainConfigMap, getChainConfig } from "@repo/utils"
import { useEffect, useState } from "react"
import { usePublicClient, useSendTransaction } from "wagmi"
import {
  btcChainNamespace,
  evmChainNamespace,
  svmChainNamespace,
} from "./config"
import { getChainNamespace } from "./connect-button"
import { TxnData } from "./types"
import { getBtcAssetBalance, sendBtcTransaction } from "./utils-btc"
import { getEvmAssetBalance, sendEvmTransaction } from "./utils-evm"
import { getSvmAssetBalance, sendSvmTransaction } from "./utils-svm"

export function useWalletConnect() {
  const account = useAppKitAccount()
  const { selectedNetworkId } = useAppKitState()

  const chainConfig = Object.values(ChainConfigMap).find((config) => {
    return (
      config.walletConnectChain?.id &&
      String(config.walletConnectChain?.id) ===
        selectedNetworkId?.split(":").at(-1)
    )
  })

  return {
    ...account,
    caipNetworkId: selectedNetworkId,
    chain: chainConfig?.code,
  }
}

export interface WalletBalance {
  balance?: bigint
  error?: string | undefined
}

export const useWalletBalanceFetcher = () => {
  const { address } = useAppKitAccount()
  const { chain } = useWalletConnect()
  const client = usePublicClient()
  const { connection } = useAppKitConnection()
  const chainNamespace = getChainNamespace(chain)
  const { walletProvider: btcConnector } =
    useAppKitProvider<BitcoinAdapter>("bip122")

  const getBalance = async (currency: string): Promise<WalletBalance> => {
    if (!address || !chain) {
      return { error: "No network connected" }
    }

    let balance: bigint | undefined = undefined

    try {
      if (chainNamespace === evmChainNamespace && client) {
        balance = await getEvmAssetBalance(client, address, chain, currency)
      } else if (chainNamespace === svmChainNamespace && connection) {
        balance = await getSvmAssetBalance(connection, address, chain, currency)
      } else if (chainNamespace === btcChainNamespace && btcConnector) {
        balance = await getBtcAssetBalance(
          btcConnector,
          address,
          chain,
          currency,
        )
      }
    } catch (err) {
      return { error: `Error fetching balance ${err}` }
    }

    if (balance === undefined) {
      return { error: "Unknown chain namespace" }
    }

    return { balance }
  }

  return { getBalance }
}

export const useWalletBalance = ({ currency }: { currency: string }) => {
  const { getBalance } = useWalletBalanceFetcher()
  const { address } = useWalletConnect()
  const [balance, setBalance] = useState(BigInt(0))
  const [nativeBalance, setNativeBalance] = useState(BigInt(0))
  const { chain } = useWalletConnect()

  useEffect(() => {
    const nativeToken = getChainConfig(chain ?? "")?.nativeToken

    if (!nativeToken) {
      return
    }

    getBalance(nativeToken).then((balance) => {
      const bal = balance.balance ?? BigInt(0)
      setNativeBalance(bal)
      if (currency === nativeToken) {
        setBalance(bal)
      }
    })

    if (currency !== nativeToken) {
      getBalance(currency).then((balance) => {
        setBalance(balance.balance ?? BigInt(0))
      })
    }
  }, [chain, address, getBalance])

  return { balance, nativeBalance, chain }
}

export const useWalletTransaction = () => {
  const { walletProvider: btcWalletProvider } =
    useAppKitProvider<BitcoinConnector>("bip122")
  const { walletProvider: svmWalletProvider } =
    useAppKitProvider<Provider>("solana")
  const { sendTransactionAsync } = useSendTransaction()
  const { chain: connectedChain, address } = useWalletConnect()
  const { connection } = useAppKitConnection()

  const sendTransaction = async (
    txnData: TxnData,
    chain: string,
  ): Promise<string> => {
    const connectedNamespace = getChainNamespace(connectedChain)
    if (!address || !connectedNamespace) {
      throw new Error("Network not connected")
    }

    if (chain != connectedChain) {
      throw new Error(`Connected to ${connectedChain} instead of ${chain}`)
    }

    if (connectedNamespace === btcChainNamespace) {
      if (!btcWalletProvider) {
        throw new Error("BTC Wallet not connected")
      }

      return await sendBtcTransaction(
        connectedChain,
        txnData,
        address,
        btcWalletProvider,
      )
    }

    if (connectedNamespace === svmChainNamespace) {
      if (!svmWalletProvider || !connection) {
        throw new Error("Solana Wallet not connected")
      }

      return await sendSvmTransaction(
        connectedChain,
        txnData,
        address,
        svmWalletProvider,
        connection,
      )
    }

    if (connectedNamespace === evmChainNamespace) {
      return await sendEvmTransaction(
        connectedChain,
        txnData,
        address,
        sendTransactionAsync,
      )
    }

    throw new Error("Unsupported chain namespace")
  }

  return { sendTransaction }
}
