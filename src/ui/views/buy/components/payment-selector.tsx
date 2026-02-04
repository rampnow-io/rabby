"use client"

import { PaymentListAction, useEventRef } from "@repo/ui"
import {
  Card,
  Image,
  Label,
  RadioGroup,
  RadioGroupItem,
} from "@repo/ui/primitives"
import { cn, type PaymentModeConfig, PaymentModeConfigMap } from "@repo/utils"
import { ChevronRight, Plus } from "lucide-react"
import {
  RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"

const MaxPaymentSlots = 4

function orderPaymentOptions(selectedOption: string, options: string[]) {
  const hasMorePayments = options.length >= MaxPaymentSlots

  if (
    !hasMorePayments ||
    options.slice(0, MaxPaymentSlots - 1).includes(selectedOption)
  ) {
    return options
  }

  return [selectedOption, ...options.filter((opt) => opt !== selectedOption)]
}

interface PaymentModeSelectorProps {
  onChange: (selectedMode: string) => void
  onSelectedChange?: (selectedMode: string | undefined) => void
  value: string
  options: string[]
  disabled?: boolean
  actionRef?: RefObject<(() => void) | undefined>
  paymentModeConfigMap?: Record<string, PaymentModeConfig>
  variant?: "card" | "list"
  defaultValue?: string
}

function PaymentModeSelector(props: PaymentModeSelectorProps) {
  if (props.variant === "card") {
    return CardPaymentModeSelector(props)
  }

  return ListPaymentModeSelector(props)
}

function CardPaymentModeSelector({
  onChange,
  onSelectedChange,
  options,
  value,
  disabled,
  paymentModeConfigMap = PaymentModeConfigMap,
}: PaymentModeSelectorProps) {
  const [openMorePayments, openMorePaymentRef] = useEventRef<() => void>()
  const orderedOptions = orderPaymentOptions(value, options)
  const hasMorePayments = options.length >= MaxPaymentSlots
  const visibleOptions = hasMorePayments
    ? orderedOptions.slice(0, MaxPaymentSlots - 1)
    : orderedOptions
  const morePaymentOptions = orderedOptions.slice(MaxPaymentSlots - 1)
  const baseCard =
    "h-16 flex flex-col cursor-pointer items-center font-medium justify-center border-card-border rounded bg-card-border text-[#71717A] hover:border-card-hover"

  const onValueChange = (selectedMode: string) => {
    onChange(selectedMode)
    onSelectedChange?.(selectedMode)
  }

  return (
    <div>
      <RadioGroup
        onValueChange={onValueChange}
        value={value}
        className='mt-3 flex'
      >
        <div className='grid grid-cols-3 gap-2 w-full'>
          {visibleOptions.map((option) => {
            const isSelected = value === option
            const config = paymentModeConfigMap[option]

            return (
              <div key={option}>
                <RadioGroupItem
                  className='hidden'
                  value={option}
                  disabled={disabled}
                  id={`payment-mode-${option}`}
                />
                <Label htmlFor={`payment-mode-${option}`} className='w-full'>
                  <Card
                    className={cn(`gap-1 w-full ${baseCard}`, {
                      "border-card-selected": isSelected,
                    })}
                  >
                    <Image
                      src={config?.image ?? ""}
                      width={100}
                      height={100}
                      alt={config?.name ?? option}
                      draggable={false}
                      className='h-[18px] w-auto'
                    />
                    <p className='text-center text-[10px] leading-tight break-words'>
                      {config?.name}
                    </p>
                  </Card>
                </Label>
              </div>
            )
          })}
        </div>

        {hasMorePayments && (
          <Card onClick={openMorePayments} className={`w-14 ${baseCard}`}>
            <Plus className='h-6 w-6' />
            <p className='text-[10px]'>More</p>
          </Card>
        )}
      </RadioGroup>
      <PaymentListAction
        actionRef={openMorePaymentRef}
        options={morePaymentOptions}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

function ListPaymentModeSelector({
  onChange,
  onSelectedChange,
  options,
  value,
  actionRef,
  disabled = false,
  paymentModeConfigMap = PaymentModeConfigMap,
  defaultValue,
}: PaymentModeSelectorProps) {
  const [openPaymentsModal, openPaymentsModalRef] = useEventRef<() => void>()
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(defaultValue)
  const orderedOptions = useMemo(
    () => orderPaymentOptions(value, options),
    [options],
  )

  useImperativeHandle(actionRef, () => openPaymentsModal, [openPaymentsModal])

  const onPaymentModeSelected = (mode: string | undefined) => {
    setSelectedPaymentMode(mode)
    onSelectedChange?.(mode)
  }

  const onPaymentModeSelect = (mode: string) => {
    onPaymentModeSelected(mode)
    onChange(mode)
  }

  useEffect(() => {
    if (defaultValue && orderedOptions.includes(defaultValue)) {
      onPaymentModeSelect(defaultValue)
    } else if (orderedOptions.length === 1) {
      onPaymentModeSelected(orderedOptions[0])
    } else {
      onPaymentModeSelected(undefined)
    }
  }, [orderedOptions])

  return (
    <div>
      <div
        onClick={!disabled ? openPaymentsModal : undefined}
        className={cn(
          `bg-[#F9F9F9] text-primary-foreground text-base font-medium h-[56px] p-4 flex justify-between w-full rounded-xl gap-3`,
          disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-100",
        )}
      >
        <>
          {selectedPaymentMode ? (
            <div className='flex flex-row justify-between items-center w-full'>
              {paymentModeConfigMap?.[selectedPaymentMode]?.name}
              <Image
                src={paymentModeConfigMap?.[selectedPaymentMode]?.image}
                alt={paymentModeConfigMap?.[selectedPaymentMode]?.name}
                width={65}
                height={30}
                draggable={false}
                className='h-5 w-auto'
              />
            </div>
          ) : (
            <p className='text-[#6A6C6A]'>Select Payment Mode</p>
          )}
        </>
        <ChevronRight />
      </div>
      <PaymentListAction
        actionRef={openPaymentsModalRef}
        options={orderedOptions}
        value={selectedPaymentMode}
        onChange={onPaymentModeSelect}
      />
    </div>
  )
}

export default PaymentModeSelector
