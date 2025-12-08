"use client"

import { ChevronDown } from "lucide-react"
import { forwardRef, type InputHTMLAttributes } from "react"
import useEventRef from "../../hooks/use-event-ref"
import { Input, InputSize } from "../../primitives"
import SelectAction from "./select-action"

export interface OptionProp<T = string | number> {
  value: T
  label: string
  listLabel?: string // If list label is present, it will be used in the dropdown list instead of the default label
  searchValue?: string[]
}

export interface SelectProps<T extends string | number = string | number>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  rootSelector?: string
  value?: T
  selectTitle?: string
  onChange?: (item: T) => void
  options: OptionProp<T>[]
  hideChevron?: boolean
  sizeVariant?: InputSize
}

const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      selectTitle,
      value,
      onChange,
      options,
      hideChevron,
      sizeVariant = InputSize.MD,
      ...props
    },
    ref,
  ) => {
    const [openSelectModal, openSelectModalRef] = useEventRef()

    return (
      <>
        <Input
          ref={ref}
          value={options.find((opt) => opt.value === value)?.label ?? ""}
          onClick={openSelectModal}
          sizeVariant={sizeVariant}
          readOnly
          {...props}
          iconRight={
            hideChevron ? null : (
              <ChevronDown
                className='h-6 w-6 shrink-0 flex-grow-0 cursor-pointer text-[#CBCBCB]'
                size={24}
              />
            )
          }
        />
        <SelectAction
          actionRef={openSelectModalRef}
          options={options}
          onSelect={onChange}
          selectTitle={selectTitle}
          rootSelector={props.rootSelector}
        />
      </>
    )
  },
)

Select.displayName = "Select"

export default Select
