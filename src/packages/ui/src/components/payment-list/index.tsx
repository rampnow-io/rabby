"use client"

import { type PaymentModeConfig } from "@repo/utils"
import { type MutableRefObject, useImperativeHandle } from "react"
import useOpenClose from "../../hooks/use-open-close"
import PaymentList from "./payment-list"

interface PaymentListActionProps {
  actionRef?: MutableRefObject<(() => void) | undefined>
  value: string | undefined
  rootSelector?: string
  onChange: (selectedMode: string) => void
  options: string[]
  paymentModeConfigMap?: Record<string, PaymentModeConfig>
}

function PaymentListAction({
  actionRef,
  value,
  onChange,
  options,
  paymentModeConfigMap,
  rootSelector,
}: PaymentListActionProps) {
  const [show, open, close] = useOpenClose(false)

  useImperativeHandle(actionRef, () => open, [])

  if (!show) {
    return null
  }

  return (
    <PaymentList
      rootSelector={rootSelector}
      close={close}
      value={value}
      onChange={onChange}
      options={options}
      paymentModeConfigMap={paymentModeConfigMap}
    />
  )
}

PaymentListAction.displayName = "PaymentListAction"

export default PaymentListAction
