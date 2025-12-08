import { type MutableRefObject, useImperativeHandle } from "react"
import useOpenClose from "../../../hooks/use-open-close"
import MonthModal from "./month-modal"

interface MonthActionProps {
  actionRef?: MutableRefObject<(() => void) | undefined>
  rootSelector?: string
  onSelect?: (month: string) => void
  selectorTitle?: string
}

function MonthAction({
  actionRef,
  rootSelector,
  onSelect,
  selectorTitle,
}: MonthActionProps) {
  const [show, open, close] = useOpenClose(false)

  useImperativeHandle(actionRef, () => open, [])

  if (!show) {
    return null
  }

  return (
    <MonthModal
      rootSelector={rootSelector}
      onSelect={onSelect}
      close={close}
      selectorTitle={selectorTitle}
    />
  )
}

MonthAction.displayName = "MonthAction"

export default MonthAction
