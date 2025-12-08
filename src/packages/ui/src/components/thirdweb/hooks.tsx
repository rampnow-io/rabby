import { ChainConfigMap } from "@repo/utils"
import { useActiveWallet, useConnect } from "thirdweb/react"
import { inAppWallet } from "thirdweb/wallets"
import { getThirdWebClient, ThirdWebConfig } from "./config"

// Hook to authenticate to in-app wallet
export function useInappWalletConnect() {
  const { connect } = useConnect()
  const wallet = useActiveWallet()
  const isConnected = Boolean(wallet)

  const getWallet = async (authUrl: string, chain = "base") => {
    if (wallet?.getChain()?.id === ChainConfigMap[chain!].thirdwebChain?.id) {
      return wallet
    }

    const connectedWallet = await connect(async () => {
      try {
        const resp = await fetch(authUrl)
        const payload = await resp.json()
        const wallet = inAppWallet({
          executionMode: {
            mode: "EIP4337",
            smartAccount: {
              factoryAddress: ThirdWebConfig.FACTORY_ADDRESS_V7,
              chain: ChainConfigMap[chain!].thirdwebChain!,
              sponsorGas: true,
            },
          },
        })

        await wallet.connect({
          client: getThirdWebClient(),
          strategy: "auth_endpoint",
          payload: payload?.payload ?? "",
        })

        return wallet
      } catch (err) {
        console.error("connect_wallet_err", err)
        throw err
      }
    })

    if (!connectedWallet) {
      throw new Error("no_wallet_connected")
    }

    return connectedWallet
  }

  return { getWallet, isConnected, wallet }
}
