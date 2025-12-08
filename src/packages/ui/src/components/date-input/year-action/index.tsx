import { type MutableRefObject, useImperativeHandle } from "react"
import useOpenClose from "../../../hooks/use-open-close"
import YearModal from "./year-modal"

interface YearActionProps {
  actionRef?: MutableRefObject<(() => void) | undefined>
  rootSelector?: string
  onSelect?: (year: string) => void
  selectorTitle?: string
}

function YearAction({
  actionRef,
  rootSelector,
  onSelect,
  selectorTitle,
}: YearActionProps) {
  const [show, open, close] = useOpenClose(false)

  useImperativeHandle(actionRef, () => open, [])

  if (!show) {
    return null
  }

  return (
    <YearModal
      rootSelector={rootSelector}
      onSelect={onSelect}
      close={close}
      selectorTitle={selectorTitle}
    />
  )
}

YearAction.displayName = "YearAction"

export default YearAction
