"use client"

import { X } from "lucide-react"
import { OptionProp } from ".."
import BottomDrawer from "../../bottom-drawer"
import { List } from "../../list"

interface SelectModalProps<T extends string | number = string | number> {
  onSelect?: (item: T) => void
  rootSelector?: string
  selectTitle?: string
  close: () => void
  options: OptionProp<T>[]
}

function SelectModal<T extends string | number = string | number>({
  rootSelector,
  selectTitle = "Select",
  close,
  onSelect,
  options,
}: SelectModalProps<T>) {
  const onSelectHandler = (option: OptionProp<T>) => {
    close()
    onSelect?.(option.value)
  }

  return (
    <BottomDrawer variant='semi' rootSelector={rootSelector} close={close}>
      <div className='flex flex-col gap-3 h-1/2 min-h-[50%] p-6'>
        <div className='flex items-center justify-between '>
          <div className='text-lg font-medium'>{selectTitle}</div>
          <X className='cursor-pointer' size={24} onClick={close} />
        </div>

        <List items={options} onSelect={onSelectHandler} />
      </div>
    </BottomDrawer>
  )
}

SelectModal.displayName = "SelectModal"

export default SelectModal
