"use client"

import { cn } from "@repo/utils"
import React from "react"

const Header = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[24px] font-medium leading-[29px] text-primary-foreground",
      className,
    )}
    {...props}
  />
))
Header.displayName = "Header"

export default Header
