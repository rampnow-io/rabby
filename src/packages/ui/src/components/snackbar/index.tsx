"use client"

import { cn } from "@repo/utils"
import { X } from "lucide-react"
import { type CSSProperties, type ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { v4 as uuid } from "uuid"
import useEvent from "../../hooks/use-event"
import { type SnackbarType, subscribe } from "./snackbar"

export * from "./snackbar"

const SNACK_LIFE_TIME_MILLISECONDS_DEFAULT = 5000

export interface SnackbarProps {
  id: string
  type: SnackbarType
  message: ReactNode
  timeToHide: number
  timeout?: number
}

function Snackbar() {
  const [snacks, setSnacks] = useState<SnackbarProps[]>([])

  const close = useEvent((id: string) => {
    setSnacks((snacks) => snacks.filter((snack) => snack.id !== id))
  })

  useEffect(() => {
    return subscribe((type, message, options) => {
      setSnacks((snacks) => [
        ...snacks,
        {
          id: uuid(),
          type,
          message,
          timeToHide: options?.persistent
            ? -1
            : Date.now() +
              (options?.timeout || SNACK_LIFE_TIME_MILLISECONDS_DEFAULT),
          timeout: options?.persistent
            ? undefined
            : options?.timeout || SNACK_LIFE_TIME_MILLISECONDS_DEFAULT,
        },
      ])
    })
  }, [])

  useEffect(() => {
    if (!snacks.length) {
      return
    }

    const time = snacks.reduce(
      (minTime, snack) =>
        minTime < snack.timeToHide || snack.timeToHide === -1
          ? minTime
          : snack.timeToHide,
      Infinity,
    )

    const interval = setInterval(() => {
      const now = Date.now()
      setSnacks((snacks) =>
        snacks.filter(
          (snack) => snack.timeToHide === -1 || snack.timeToHide > now,
        ),
      )
    }, time - Date.now())

    return () => {
      clearInterval(interval)
    }
  }, [snacks])

  if (!snacks.length) {
    return null
  }

  return createPortal(
    <div className='pointer-events-none fixed bottom-6 left-[50%] flex w-[100%] -translate-x-1/2 flex-col items-center gap-4 lg:left-auto lg:right-6 lg:w-auto lg:translate-x-0 lg:!items-end'>
      {snacks.map((snack) => (
        <div
          key={snack.id}
          className={cn(
            "pointer-events-auto flex gap-4 rounded-xl p-4 shadow-xl",
            {
              "bg-white": snack.type === "info",
              "bg-[#b4f53d]": snack.type === "success",
              "bg-[#ef4444] text-[#fafafa]": snack.type === "warning",
              "snack-animation-fadeout": Boolean(snack.timeout),
            },
          )}
          style={
            {
              "--snack-animation-fadeout-timeout": `${snack.timeout}ms`,
            } as CSSProperties
          }
        >
          <div className='shrink grow'>{snack.message}</div>
          <div
            className='flex shrink-0 grow-0 cursor-pointer items-center'
            onClick={() => {
              close(snack.id)
            }}
          >
            <X className='cursor-pointer justify-self-end' size={24} />
          </div>
        </div>
      ))}
      <div />
    </div>,
    document.body,
  )
}

Snackbar.displayName = "Snackbar"

export default Snackbar
