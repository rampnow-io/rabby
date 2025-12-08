"use client"

import { type AssetConfig } from "@repo/utils"
import { type MutableRefObject, useImperativeHandle } from "react"
import useOpenClose from "../../hooks/use-open-close"
import SelectAssetModal from "./select-asset-modal"

interface SelectCurrencyActionProps {
  rootSelector?: string
  title: string
  assetConfigMap: Record<string, AssetConfig>
  onSelect?: (assetConfig: AssetConfig) => void
  actionRef?: MutableRefObject<(() => void) | undefined>
}

function SelectAssetAction({
  rootSelector,
  title,
  assetConfigMap,
  onSelect,
  actionRef,
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
      assetConfigMap={assetConfigMap}
      onSelect={onSelect}
      close={close}
    />
  )
}

SelectAssetAction.displayName = "SelectAssetAction"

export default SelectAssetAction
