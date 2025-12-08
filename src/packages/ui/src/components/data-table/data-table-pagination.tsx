import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import { type Table } from "@tanstack/react-table"
import { Button, ButtonSize, ButtonType } from "../../primitives/index"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../primitives/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalCount: number
}

export function DataTablePagination<TData>({
  table,
  totalCount = 0,
}: DataTablePaginationProps<TData>) {
  return (
    <div className='flex items-center justify-between border-t p-5'>
      <div className='text-muted-foreground flex-1 text-sm'>
        {/* {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected. */}
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium'>Show rows:</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {totalCount != 0 && <div>[Count: {totalCount}]</div>}
        </div>
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <Button
            buttonType={ButtonType.SECONDARY}
            buttonSize={ButtonSize.SM}
            className='h-8 rounded-md p-0 lg:flex'
            onClick={() => {
              table.setPageIndex(0)
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to first page</span>
            <p className='px-2 py-1 text-sm'>First</p>
          </Button>
          <Button
            buttonType={ButtonType.SECONDARY}
            buttonSize={ButtonSize.SM}
            className='h-8 w-8 rounded-md p-0'
            onClick={() => {
              table.previousPage()
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to previous page</span>
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>
          <div className='b flex items-center justify-center rounded-md border px-4 py-1 text-sm font-medium'>
            {/* React table pagination is zero based index */}
            Page {table.getState().pagination.pageIndex} of{" "}
            {table.getPageCount() ? table.getPageCount() - 1 : 0}
          </div>
          <Button
            buttonType={ButtonType.SECONDARY}
            className='h-8 w-8 rounded-md p-0 text-sm'
            onClick={() => {
              table.nextPage()
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to next page</span>
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
          <Button
            buttonType={ButtonType.SECONDARY}
            className='h-8 rounded-md p-0 lg:flex'
            onClick={() => {
              table.setPageIndex(table.getPageCount())
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to last page</span>
            <p className='px-2 py-1 text-sm'>Last</p>
          </Button>
        </div>
      </div>
    </div>
  )
}
