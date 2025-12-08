"use client"

import { cn } from "@repo/utils"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"
import * as React from "react"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center gap-2 has-[:disabled]:opacity-50 overflow-hidden",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
})
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex w-full items-center gap-2", className)}
    {...props}
  />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number; error: boolean }
>(({ index, className, error, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex aspect-square w-px grow items-center justify-center rounded-sm border text-2xl text-[#002C15]",
        {
          "border-[#97CB0A]": isActive || Boolean(char),
          "border-[#F53F3F]": error,
        },
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <div className='animate-caret-blink bg-foreground h-8 w-px duration-1000' />
        </div>
      ) : null}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role='separator' {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot }
