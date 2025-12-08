"use client"

import { AppKit, createAppKit } from "@reown/appkit/react"
import { type ReactNode } from "react"
import { cookieToInitialState, WagmiProvider } from "wagmi"
import { allNetworks, getChainAdapters, getWagmiAdapter } from "./config"

export let modal: AppKit | undefined

export function initializeAppKit(projectId: string) {
  modal = createAppKit({
    adapters: getChainAdapters(projectId),
    projectId,
    networks: allNetworks,
    metadata: {
      name: "Rampnow",
      description: "Rampnow Onramp/Offramp Widget",
      url: "https://app.rampnow.io",
      icons: ["https://app.rampnow.io/favicon.ico"],
    },
    themeMode: "light",
    enableReconnect: false,
    features: {
      email: false,
      socials: false,
      emailShowWallets: false,
      swaps: false,
      onramp: false,
      receive: false,
      send: false,
      history: false,
    },
  })
}

export function WalletConnectProvider({
  children,
  projectId,
  cookies,
}: {
  children: ReactNode
  projectId: string
  cookies: string | null
}) {
  const config = getWagmiAdapter(projectId).wagmiConfig
  const initialState = cookieToInitialState(config, cookies)

  return <WagmiProvider config={config}>{children}</WagmiProvider>
}
