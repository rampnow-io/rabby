"use client"

import { Chain, ChainConfigMap } from "@repo/utils"
import { ThirdwebClient } from "thirdweb"
import { ConnectButton, ConnectButtonProps } from "thirdweb/react"
import { client as thirdwebClient, ThirdWebConfig } from "./config"

type ThridWebConnectButtonProps = {
  chain?: string
  client?: ThirdwebClient
  children?: React.ReactNode
}

const commonProps: Partial<ConnectButtonProps> = {
  connectModal: { size: "compact" as const },
  appMetadata: {
    name: "Rampnow",
    url: "https://rampnow.io",
    logoUrl: "https://rampnow.io/favicon.ico",
    description: "Rampnow - Onramp and Offramp",
  },
  autoConnect: true,
  theme: "light",
  detailsModal: {
    hideSendFunds: true,
    hideBuyFunds: true,
    hideReceiveFunds: true,
    hideSwitchWallet: true,
    hideDisconnect: true,
    showTestnetFaucet: false,
    manageWallet: {
      allowLinkingProfiles: false,
    },
  },
}

export const ThridWebConnectButton = ({
  chain = Chain.BASE,
  client = thirdwebClient!,
  children,
}: ThridWebConnectButtonProps) => {
  return (
    <ConnectButton
      {...commonProps}
      accountAbstraction={{
        sponsorGas: true,
        chain: ChainConfigMap[chain].thirdwebChain!,
        factoryAddress: ThirdWebConfig.FACTORY_ADDRESS_V7,
      }}
      client={client}
      connectButton={{
        style: { display: "none" },
      }}
      detailsButton={{
        style: { display: "none" },
        render: () => <>{children}</>,
      }}
    />
  )
}

export default ThridWebConnectButton
