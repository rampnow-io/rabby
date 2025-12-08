import { useState } from "react"
import { Input, InputSize } from "../primitives"
import { OptionProp } from "./select"

interface ListProps<T = string | number> {
  items: OptionProp<T>[]
  onSelect: (value: OptionProp<T>) => void
}

export function List<T>({ items, onSelect }: ListProps<T>) {
  const [search, setSearch] = useState("")
  const showSearch = items.length > 10

  const filteredOptions = items.filter((item) => {
    const searchLower = search.toLowerCase()
    const fields = [item.label, item.value, item.searchValue].flat()
    return fields.some((field) =>
      field?.toString().toLowerCase().includes(searchLower),
    )
  })

  return (
    <div className='w-full flex flex-col gap-3'>
      {showSearch && (
        <Input
          type='text'
          placeholder='Search here..'
          sizeVariant={InputSize.SM}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}

      <div className='max-h-80 min-h-80 overflow-y-auto'>
        {filteredOptions.map((option, index) => (
          <div
            key={index}
            onClick={() => onSelect(option)}
            className='flex h-[60px] items-center gap-4 rounded-xl hover:bg-[#F7F7F7] cursor-pointer'
          >
            {option.listLabel ?? option.label}
          </div>
        ))}
      </div>
    </div>
  )
}
