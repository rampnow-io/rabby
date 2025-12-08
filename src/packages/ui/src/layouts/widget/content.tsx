import { cn } from "@repo/utils"
import React from "react"

const Content = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full flex-shrink flex-grow flex-col overflow-y-auto overflow-x-visible px-6 py-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
Content.displayName = "Content"

export default Content
