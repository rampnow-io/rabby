import { getYear } from "date-fns"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useState } from "react"
import BottomDrawer from "../../bottom-drawer"

interface YearModalProps {
  rootSelector?: string
  onSelect?: (month: string) => void
  close: () => void
  selectorTitle?: string
}

function getYears(from: number, to: number) {
  const result = []

  for (let year = from; year <= to; ++year) {
    result.push(year)
  }
  return result
}

function YearModal({
  rootSelector,
  close,
  onSelect,
  selectorTitle = "Select year",
}: YearModalProps) {
  const [years, setYears] = useState<number[]>(() => {
    const date = new Date()
    const yarn = getYear(date)
    return getYears(yarn - 4, yarn + 4)
  })

  const prevYears = () => {
    const from = Math.max(years[0] - 9, 0)
    setYears(getYears(from, from + 8))
  }
  const nextYears = () => {
    const from = years[0] + 9
    setYears(getYears(from, from + 8))
  }

  const onSelectHandler = (year: number) => {
    close()
    onSelect?.(year.toString())
  }

  return (
    <BottomDrawer variant='semi' rootSelector={rootSelector} close={close}>
      <div className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='select-none text-lg font-medium'>{selectorTitle}</div>
          <X className='cursor-pointer' size={24} onClick={close} />
        </div>
        <div className='mt-3 flex items-center justify-between'>
          <div
            className='border-1 flex h-10 w-10 cursor-pointer flex-col items-center justify-center rounded border border-[#C9CBCE] hover:border-[#97CB0A]'
            onClick={prevYears}
          >
            <ChevronLeft
              className='h-6 w-6 shrink-0 flex-grow-0 cursor-pointer'
              size={24}
            />
          </div>
          <div className='select-none'>
            {years[0]} - {years[years.length - 1]}
          </div>
          <div
            className='border-1 flex h-10 w-10 cursor-pointer flex-col items-center justify-center rounded border border-[#C9CBCE] hover:border-[#97CB0A]'
            onClick={nextYears}
          >
            <ChevronRight
              className='h-6 w-6 shrink-0 flex-grow-0 cursor-pointer'
              size={24}
            />
          </div>
        </div>
        <div className='mt-3 grid grid-cols-3 gap-x-2.5 gap-y-3'>
          {years.map((year, index) => (
            <div
              key={index}
              onClick={() => {
                onSelectHandler(year)
              }}
              className='border-1 flex h-12 cursor-pointer select-none flex-col items-center justify-center rounded border border-[#C9CBCE] hover:border-[#97CB0A]'
            >
              {year}
            </div>
          ))}
        </div>
      </div>
    </BottomDrawer>
  )
}

YearModal.displayName = "YearModal"

export default YearModal
