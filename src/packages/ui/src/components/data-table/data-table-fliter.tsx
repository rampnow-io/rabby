"use client"

import { useState } from "react"
import {
  Button,
  ButtonType,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "../../primitives"
import { Search } from "../search-input"

interface FilterItem {
  label: string
  filterComponent: React.ReactNode
}

interface Props {
  filterItemRow: FilterItem[]
  filterTitle: string
}

function DataTableFilter({ filterItemRow, filterTitle }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className='flex justify-between border-b p-5'>
      <Search className='h-9 rounded-2xl' />
      <div className='flex items-center gap-3'>
        <Button
          buttonType={ButtonType.SECONDARY}
          onClick={() => {
            setIsDialogOpen(true)
          }}
        >
          Filter
        </Button>
        <Button>Download</Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <div>
            <DialogTitle>{filterTitle}</DialogTitle>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='grid w-full flex-1 grid-cols-3 gap-3'>
              {filterItemRow.map((data) => {
                return (
                  <div className='flex flex-col gap-1'>
                    {data.label}
                    {data.filterComponent}
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter className='sm:justify-end'>
            <DialogClose asChild>
              <Button type='button'>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { DataTableFilter }
