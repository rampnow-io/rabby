"use client"

import { cn } from "@repo/utils"
import React from "react"

export enum InputSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerRef?: React.RefObject<HTMLLabelElement>
  subClassName?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  sizeVariant?: InputSize
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      subClassName,
      iconLeft,
      iconRight,
      containerRef,
      sizeVariant = InputSize.MD,
      ...props
    },
    ref,
  ) => {
    return (
      <label
        ref={containerRef}
        className={cn(
          "flex items-center justify-between text-input gap-x-2 rounded-lg border border-border-input p-4 focus-within:border-border-input-hover hover:border-border-input-hover disabled:cursor-not-allowed disabled:opacity-50",
          {
            "h-10 text-sm": sizeVariant === InputSize.SM,
            "h-14 text-base": sizeVariant === InputSize.MD,
            "h-[62px] text-[16px]": sizeVariant === InputSize.LG,
          },
          {
            "border-border-input-destructive focus-within:border-border-input-destructive-hover hover:border-border-input-destructive-hover":
              Boolean(props["aria-invalid"]),
          },
          className,
        )}
      >
        {iconLeft}
        <input
          className={cn(
            "w-full text-ellipsis font-medium leading-[19px] outline-none disabled:cursor-not-allowed disabled:opacity-50",
            subClassName,
          )}
          ref={ref}
          {...props}
        />
        {iconRight}
      </label>
    )
  },
)

Input.displayName = "Input"

export { Input }
