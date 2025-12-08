"use client"

import { cn } from "@repo/utils"
import { useState } from "react"
import {
  Input,
  InputSize,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../../primitives"
import { List } from "../list"
import { OptionProp } from "../select"

interface AutoCompleteProps<T extends string | number = string | number> {
  value: T
  onChange: (value: T) => void
  options: OptionProp<T>[]
  placeholder: string
  className?: string
  searchKeys?: string[]
  sizeVariant?: InputSize
}

export function AutoComplete<T extends string>({
  value,
  onChange,
  options,
  className,
  placeholder,
  sizeVariant = InputSize.SM,
}: AutoCompleteProps<T>): React.ReactNode {
  const [open, setOpen] = useState(false)

  const onSelectItem = (inputValue: OptionProp): void => {
    onChange(inputValue.value as T)
    setOpen(false)
  }

  return (
    <div className={cn(className, "flex")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            className='w-full'
            sizeVariant={sizeVariant}
            value={options.find((opt) => opt.value === value)?.label ?? ""}
            onClick={() => {
              setOpen(true)
            }}
            readOnly
          />
        </PopoverAnchor>

        <PopoverContent
          asChild
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          onInteractOutside={(e) => {
            if (
              e.target instanceof Element &&
              e.target.hasAttribute("cmdk-input")
            ) {
              e.preventDefault()
            }
          }}
          className='w-full min-w-[500px] p-6'
        >
          <div>
            <List items={options} onSelect={onSelectItem} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
