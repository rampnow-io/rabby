"use client"

import {
  Card,
  Image,
  Label,
  RadioGroup,
  RadioGroupItem,
} from "@repo/ui/primitives"
import { cn, type PaymentModeConfig, PaymentModeConfigMap } from "@repo/utils"
import { X } from "lucide-react"
import BottomDrawer from "../bottom-drawer"

interface PaymentListProps {
  value: string | undefined
  rootSelector?: string
  onChange: (selectedMode: string) => void
  close: () => void
  options: string[]
  paymentModeConfigMap?: Record<string, PaymentModeConfig>
}

function PaymentList({
  rootSelector,
  close,
  value,
  options,
  onChange,
  paymentModeConfigMap = PaymentModeConfigMap,
}: PaymentListProps): React.ReactNode {
  const handleSelect = (option: string) => {
    onChange(option)
    close()
  }

  return (
    <BottomDrawer variant='semi' rootSelector={rootSelector} close={close}>
      <div className='flex flex-col gap-3 p-6 overflow-auto'>
        <div className='flex item-center justify-between'>
          <div className='text-lg font-medium'>Payment Methods</div>
          <X className='cursor-pointer' size={24} onClick={close} />
        </div>
        <RadioGroup
          onValueChange={handleSelect}
          value={value}
          className='flex flex-col gap-y-3 overflow-y-auto'
        >
          {options.map((option) => {
            const config = paymentModeConfigMap?.[option]
            if (!config) {
              return null
            }

            return (
              <div key={option}>
                <div>
                  <RadioGroupItem
                    className='hidden'
                    value={option}
                    id={`payment-mode-${option}`}
                  />
                  <Label htmlFor={`payment-mode-${option}`} className='w-full'>
                    <Card
                      className={cn(
                        "flex h-[55px] cursor-pointer items-center justify-between rounded-[6px] bg-card-border px-3 border-0 hover:border-card-hover hover:border shadow-none",
                        { "border border-card-selected": value === option },
                      )}
                    >
                      <p className='text-sm font-medium'>{config.name}</p>
                      <Image
                        src={config.image}
                        width={65}
                        height={30}
                        alt={config.name}
                        draggable={false}
                        className='h-5 w-auto'
                      />
                    </Card>
                  </Label>
                </div>
              </div>
            )
          })}
        </RadioGroup>
      </div>
    </BottomDrawer>
  )
}

PaymentList.displayName = "PaymentList"

export default PaymentList
