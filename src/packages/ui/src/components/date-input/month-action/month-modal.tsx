import { X } from "lucide-react"
import BottomDrawer from "../../bottom-drawer"
import { FULL_MONTHS, SHORT_MONTHS } from "../months"

interface MonthModalProps {
  rootSelector?: string
  onSelect?: (month: string) => void
  close: () => void
  selectorTitle?: string
}

function MonthModal({
  rootSelector,
  close,
  onSelect,
  selectorTitle = "Select month",
}: MonthModalProps) {
  const onSelectHandler = (index: number) => {
    close()
    onSelect?.(SHORT_MONTHS[index])
  }
  return (
    <BottomDrawer variant='semi' rootSelector={rootSelector} close={close}>
      <div className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='text-lg font-medium'>{selectorTitle}</div>
          <X className='cursor-pointer' size={24} onClick={close} />
        </div>
        <div className='mt-3 grid grid-cols-3 gap-x-2.5 gap-y-3'>
          {FULL_MONTHS.map((month, index) => (
            <div
              key={index}
              onClick={() => {
                onSelectHandler(index)
              }}
              className='border-1 flex h-12 cursor-pointer flex-col items-center justify-center rounded border border-[#C9CBCE] hover:border-[#97CB0A]'
            >
              {month}
            </div>
          ))}
        </div>
      </div>
    </BottomDrawer>
  )
}

MonthModal.displayName = "MonthModal"

export default MonthModal
