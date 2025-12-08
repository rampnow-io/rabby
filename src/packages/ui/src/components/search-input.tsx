import { cn } from "@repo/utils"
import { Search as SearchIcon } from "lucide-react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { Input } from "../primitives"

interface SearchProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string
  iconRight?: ReactNode
}

export function Search({
  className,
  iconRight = <></>,
  placeholder = "Search",
  ...props
}: SearchProps) {
  return (
    <Input
      type='search'
      placeholder={placeholder}
      iconLeft={<SearchIcon />}
      iconRight={iconRight}
      className={cn("md:w-[100px] lg:w-[300px]", className)}
      {...props}
    />
  )
}
