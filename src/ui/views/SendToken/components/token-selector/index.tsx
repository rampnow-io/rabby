import { useOpenClose } from "@repo/ui"
import { type MutableRefObject, useImperativeHandle } from "react"
import TokenSelectorModal from "./token-selector"
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';


interface TokenSelectorActionProps {
  actionRef?: MutableRefObject<(() => void) | undefined>
  onSelect: (token: TokenItem) => void
  chainId?: string
}

function TokenSelectorAction({ actionRef, onSelect, chainId }: TokenSelectorActionProps) {
  const [show, open, close] = useOpenClose(false)

  useImperativeHandle(actionRef, () => open, [open])

  if (!show) {
    return null
  }

  return <TokenSelectorModal close={close} onSelect={onSelect} chainId={chainId} />
}

TokenSelectorAction.displayName = "TokenSelectorAction"

export default TokenSelectorAction
