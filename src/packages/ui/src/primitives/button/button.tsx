"use client"

import { cn } from "@repo/utils"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import SyncLoader from "react-spinners/SyncLoader"

export enum ButtonType {
  PRIMARY = "primary",
  DESTRUCTIVE = "destructive",
  SECONDARY = "secondary",
  GHOST = "ghost",
  LINK = "link",
  NONE = "none",
}

export enum ButtonSize {
  DEFAULT = "default",
  SM = "sm",
  NONE = "none",
}

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full hover:brightness-[0.96] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      buttonType: {
        [ButtonType.PRIMARY]: "bg-primary text-button-primary",
        [ButtonType.DESTRUCTIVE]: "bg-destructive !text-button-primary",
        [ButtonType.SECONDARY]:
          "bg-secondary border border-button-primary text-button-primary",
        [ButtonType.GHOST]: "hover:bg-accent hover:text-secondary-foreground",
        [ButtonType.LINK]:
          "bg-secondary text-button-primary underline underline-offset-4",
        [ButtonType.NONE]: "",
      },
      buttonSize: {
        [ButtonSize.DEFAULT]: "text-lg px-4 py-2",
        [ButtonSize.SM]: "h-9 px-4",
        [ButtonSize.NONE]: "",
      },
    },
    defaultVariants: {
      buttonType: ButtonType.PRIMARY,
      buttonSize: ButtonSize.DEFAULT,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  onSubmit?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> // Only for form submits
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      buttonType,
      buttonSize,
      onSubmit,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const [isLoading, setLoading] = React.useState(false)

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      setLoading(true)
      onSubmit?.(e).finally(() => {
        setLoading(false)
      })
    }

    return (
      <button
        className={cn(buttonVariants({ buttonType, buttonSize, className }))}
        ref={ref}
        onClick={onSubmit ? handleClick : props.onClick}
        disabled={disabled}
        {...props}
      >
        {isLoading ? (
          <>
            {/* To preserve button height during loading */}
            <span className='invisible text-button-primary'>1</span>
            <SyncLoader className='flex items-center' size={10} />
            <span className='invisible'>1</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

Button.displayName = "Button"

export { Button, buttonVariants }
