import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons"
import { cn } from "@repo/utils"
import { type Column } from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../primitives/dropdown-menu/dropdown-menu"
import { Button, ButtonSize, ButtonType } from "../../primitives/index"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

function Title({ title, className }: { title: string; className?: string }) {
  return (
    <div
      className={cn(
        "text-[12px] font-semibold uppercase text-[#000000]",
        className,
      )}
    >
      {title}
    </div>
  )
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <Title title={title} className={className} />
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            buttonType={ButtonType.GHOST}
            buttonSize={ButtonSize.SM}
            className=' hover:bg-inherit -ml-3 flex h-8'
          >
            <Title title={title} className={className} />
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className='ml-2 h-4 w-4' />
            ) : (
              <CaretSortIcon className='ml-2 h-4 w-4' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem
            onClick={() => {
              column.toggleSorting(false)
            }}
          >
            <ArrowUpIcon className='text-muted-foreground/70 mr-2 h-3.5 w-3.5' />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              column.toggleSorting(true)
            }}
          >
            <ArrowDownIcon className='text-muted-foreground/70 mr-2 h-3.5 w-3.5' />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              column.toggleVisibility(false)
            }}
          >
            <EyeNoneIcon className='text-muted-foreground/70 mr-2 h-3.5 w-3.5' />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
