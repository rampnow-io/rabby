"use client"

import { cn } from "@repo/utils"
import { type ReactNode, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import useRootClose from "../../hooks/use-root-close"
import "./styles.css"

type Variant = "full" | "semi"

interface ModalProps {
  rootSelector?: string
  close?: (isEsc?: boolean) => void
  children?: ReactNode
  secondaryAnimation?: boolean
  className?: string
  variant?: Variant
}

function BottomDrawer({
  rootSelector = "[data-modal-root]",
  close,
  children,
  secondaryAnimation,
  className,
  variant = "full",
}: ModalProps): React.ReactNode {
  const ref = useRef<HTMLDivElement>(null)
  const root = useMemo(
    () => document.querySelector(rootSelector),
    [rootSelector],
  )
  useRootClose(ref as React.RefObject<HTMLElement>, close ?? (() => {}), {
    modal: true,
  })

  if (!root) {
    return null
  }

  return createPortal(
    <>
      <div className='modal-overlay absolute inset-0 z-50 bg-black/80' />
      <div
        ref={ref}
        className={cn(
          className,
          `bg-background absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-none`,
          variant === "full" ? "h-full" : "h-auto",
          {
            "max-h-[90%] rounded-t-[32px] overflow-hidden": variant === "semi",
          },
          secondaryAnimation ? "modal-body-secondary" : "modal-body",
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            { "h-full": variant === "full" },
            {
              "rounded-t-[32px] bg-white overflow-hidden": variant === "semi",
            },
          )}
        >
          {children}
        </div>
      </div>
    </>,
    root,
  )
}

BottomDrawer.displayName = "Modal"

export default BottomDrawer
