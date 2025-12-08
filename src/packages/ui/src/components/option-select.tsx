"use client"

import { cn } from "@repo/utils"
import { X } from "lucide-react"
import React, { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives/select"

export interface OptionProp<T> {
  value: T
  label: string
}

interface ActionSelectProps<T extends string> {
  placeholder?: string
  defaultValue?: T | ""
  options: OptionProp<T>[]
  onChange?: (value: T | "") => void
  className?: string
  required?: boolean
}

function OptionSelect<T extends string>({
  placeholder = "Select an option",
  defaultValue,
  options,
  onChange,
  className,
  required = false,
}: ActionSelectProps<T>) {
  const [selectedValue, setSelectedValue] = useState<T | "">()
  const [showClose, setShowClose] = useState<boolean>(false)

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue)
      setShowClose(!required && defaultValue != "")
    }
  }, [defaultValue])

  const handleValueChange = (value: T | "") => {
    setSelectedValue(value)
    setShowClose(!required && value != "")
    onChange?.(value)
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleValueChange("")
  }
  const selectOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  )

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <div className='flex flex-row items-center'>
        <SelectTrigger
          className={cn(
            "flex w-[200px] justify-between text-gray-500",
            className,
          )}
          hideIcon={showClose}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {showClose ? (
          <div className='justify-center'>
            <X
              className='-ml-6 h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700'
              onClick={clearSelection}
            />
          </div>
        ) : null}
      </div>
      <SelectContent>
        {selectOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { OptionSelect }
