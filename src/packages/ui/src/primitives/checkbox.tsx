import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cn } from "@repo/utils"
import { Check } from "lucide-react"
import * as React from "react"

type Variant = "primary" | "secondary"

export type CheckState = boolean | "indeterminate"

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary:
    "border-primary data-[state=checked]:bg-primary data-[state=checked]:text-[#002C15]",
  secondary:
    "border-gray-400 data-[state=checked]:bg-[#002C15] data-[state=checked]:text-white",
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant = "primary", ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring peer h-4 w-4 shrink-0 rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      variantClasses[variant],
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className='h-4 w-4' strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
