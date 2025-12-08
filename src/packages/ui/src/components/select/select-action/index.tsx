"use client"

import { type MutableRefObject, useImperativeHandle } from "react"
import { OptionProp } from ".."
import useOpenClose from "../../../hooks/use-open-close"
import SelectModal from "./select-modal"

interface SelectActionProps<T extends string | number = string | number> {
  rootSelector?: string
  actionRef?: MutableRefObject<(() => void) | undefined>
  selectTitle?: string
  onSelect?: (item: T) => void
  options: OptionProp<T>[]
}

function SelectAction<T extends string | number = string | number>({
  actionRef,
  onSelect,
  selectTitle,
  rootSelector,
  options,
}: SelectActionProps<T>) {
  const [show, open, close] = useOpenClose(false)

  useImperativeHandle(actionRef, () => open, [])

  if (!show) return null

  return (
    <SelectModal
      rootSelector={rootSelector}
      close={close}
      selectTitle={selectTitle}
      options={options}
      onSelect={onSelect}
    />
  )
}

SelectAction.displayName = "SelectAction"

export default SelectAction
