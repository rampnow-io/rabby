"use client"

import { format, parseISO } from "date-fns"

export interface TimeDisplayProps {
  time: any
}

function TimeDisplay({ time }: TimeDisplayProps) {
  return (
    <div className='flex flex-col gap-y-1 text-left'>
      <span className='w-[100px] font-medium'>
        {format(parseISO(time), "MMM d, y")}
      </span>
      <span className='w-[100px] text-xs font-medium text-gray-500'>
        {format(parseISO(time), "HH:mm:ss.SSS")}
      </span>
    </div>
  )
}

export { TimeDisplay }
