"use client"

import { type AssetConfig } from "@repo/utils"
import { type MutableRefObject, useImperativeHandle } from "react"

import SelectAssetModal from "./select-asset-modal"
import { useOpenClose } from "@repo/ui"
import { CHAINS_ENUM } from "@/types/chain"
import { TokenItem } from "@rabby-wallet/rabby-api/dist/types"

interface SelectCurrencyActionProps {
  rootSelector?: string
  title: string
  actionRef?: MutableRefObject<(() => void) | undefined>
  onChainChange?: (chain: CHAINS_ENUM) => void
  onTokenChange?: (token: TokenItem) => void
  selectionType?: 'from' | 'to'
  fromChain?: CHAINS_ENUM
  fromToken?: TokenItem
}

function SelectAssetAction({
  rootSelector,
  title,
  actionRef,
  onChainChange,
  onTokenChange,
  selectionType = 'from',
  fromChain,
  fromToken,
}: SelectCurrencyActionProps) {
  const [show, open, close] = useOpenClose(false)

  useImperativeHandle(actionRef, () => open, [])

  if (!show) {
    return null
  }

  return (
    <SelectAssetModal
      rootSelector={rootSelector}
      title={title}
      close={close}
      onChainChange={onChainChange}
      onTokenChange={onTokenChange}
      selectionType={selectionType}
      fromChain={fromChain}
      fromToken={fromToken}
    />
  )
}

SelectAssetAction.displayName = "SelectAssetAction"

export default SelectAssetAction
