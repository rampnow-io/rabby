"use client"

import { ChainNamespace, type AppKitNetwork } from "@reown/appkit/networks"
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useDisconnect,
} from "@reown/appkit/react"
import { Button, ButtonType, Image } from "@repo/ui/primitives"
import { getChainConfig, truncate } from "@repo/utils"
import { useEffect, useRef, useState } from "react"
import {
  bitcoinNetworks,
  btcChainNamespace,
  evmChainNamespace,
  evmNetworks,
  svmChainNamespace,
  svmNetworks,
} from "./config"
import { ConnectButtonType } from "./types"
import { parseCaipNetworkId } from "./utils"

const hasChain = (chains: AppKitNetwork[], chain: AppKitNetwork) => {
  return chains.map((network) => network.id).includes(chain.id)
}

export function getChainNamespace(
  chain: string | undefined,
): ChainNamespace | undefined {
  const chainConfig = getChainConfig(chain)
  if (!chainConfig?.walletConnectChain) {
    return undefined
  }

  if (hasChain(evmNetworks, chainConfig.walletConnectChain)) {
    return evmChainNamespace
  }

  if (hasChain(svmNetworks, chainConfig.walletConnectChain)) {
    return svmChainNamespace
  }

  if (hasChain(bitcoinNetworks, chainConfig.walletConnectChain)) {
    return btcChainNamespace
  }

  return undefined
}

export interface ConnectButtonProps {
  chainCode: string
  disabled?: boolean
  className?: string
  initialAddress?: string
  address?: string
  onChange?: (address?: string) => void
  buttonType?: ConnectButtonType
  preButtonClick?: (() => boolean) | null
}

export function ConnectButton({
  chainCode,
  disabled,
  initialAddress,
  address,
  className,
  onChange,
  buttonType = ConnectButtonType.LABEL,
  preButtonClick,
}: ConnectButtonProps) {
  const { open } = useAppKit()
  const { address: connectedAddress, isConnected } = useAppKitAccount()
  const { caipNetworkId, switchNetwork } = useAppKitNetwork()
  const { disconnect } = useDisconnect()

  const chainNamespace = getChainNamespace(chainCode)
  const chainConfig = getChainConfig(chainCode)
  const currentChain = parseCaipNetworkId(caipNetworkId)
  const isChainConnected =
    isConnected &&
    currentChain?.chainId == String(chainConfig?.walletConnectChain?.id)

  const hasInitialAddress = useRef(
    Boolean(initialAddress) && initialAddress !== "",
  )
  const [shouldDisable, setShouldDisable] = useState(
    disabled || !chainNamespace || hasInitialAddress.current,
  )

  useEffect(() => {
    if (hasInitialAddress.current && address == "") {
      hasInitialAddress.current = true
      setShouldDisable(disabled || !chainNamespace)
    }

    if (address && address !== connectedAddress) {
      disconnect()
    }
  }, [address])

  useEffect(() => {
    if (!shouldDisable) {
      onChange?.(connectedAddress)
    }
  }, [connectedAddress])

  const onClick = async () => {
    if (preButtonClick && !preButtonClick()) {
      return
    }

    if (isChainConnected) {
      disconnect({ namespace: chainNamespace })
      return
    }

    // Switch just the network if chain namespace is already connected
    if (isConnected && !isChainConnected) {
      switchNetwork(chainConfig?.walletConnectChain!)
      return
    }

    // Connect to new chain namespace
    if (chainNamespace) {
      await open({ namespace: chainNamespace })
      switchNetwork(chainConfig?.walletConnectChain!)
    }
  }

  if (buttonType === ConnectButtonType.LABEL) {
    return (
      <Button
        buttonType={ButtonType.SECONDARY}
        onClick={onClick}
        disabled={shouldDisable}
        className={`gap-3 ${className ?? ""}`}
      >
        <Image
          src='/image/icon/general/wallet-connect.svg'
          width={24}
          height={24}
          alt='Wallet icon'
          draggable={false}
        />
        {isChainConnected
          ? `Disconnect ${truncate(connectedAddress)}`
          : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <Button
      buttonType={ButtonType.SECONDARY}
      onClick={onClick}
      disabled={shouldDisable}
      className={`gap-3  rounded-xl p-0 !w-[57px] transition-none border-none bg-[#F9F9F9] ${className ?? ""}`}
    >
      <Image
        src={
          isChainConnected
            ? "/image/icon/general/disconnect.svg"
            : "/image/icon/general/wallet-connect.svg"
        }
        width={24}
        height={24}
        className={isChainConnected ? "" : "!h-[24px]"}
        alt='Wallet icon'
        draggable={false}
      />
    </Button>
  )
}
