import { cn } from "@repo/utils"
import React from "react"

type ActionProps = React.HTMLAttributes<HTMLDivElement>

const Action = React.forwardRef<HTMLDivElement, ActionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex shrink-0 flex-col px-6 pb-6 pt-2", className)}
      {...props}
    />
  ),
)
Action.displayName = "Action"

export default Action
