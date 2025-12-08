"use client"

import { cn } from "@repo/utils"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react"
import * as React from "react"
import { DayFlag, DayPicker, SelectionState, UI } from "react-day-picker"
import { ButtonType, buttonVariants } from "../primitives/index"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  captionLabel?: string
}

export const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  captionLabel,
  ...props
}: CalendarProps) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        [UI.Months]: "relative flex flex-row  gap-3",
        [UI.Month]: "space-y-4 ml-0",
        [UI.MonthCaption]: "flex justify-center pt-1 relative items-center",
        [UI.MonthGrid]: "w-full border-collapse space-y-1",
        [UI.CaptionLabel]: cn("text-sm font-medium", captionLabel),
        nav: "flex items-center justify-between absolute inset-x-0",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ buttonType: ButtonType.SECONDARY }),
          "absolute left-1 top-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10",
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ buttonType: ButtonType.SECONDARY }),
          "absolute right-1 top-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10",
        ),
        weeks: "w-full border-collapse space-y-",
        [UI.Weekdays]: "flex",
        [UI.Weekday]:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        [UI.Week]: "flex w-full mt-2",
        [UI.DayButton]:
          "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        [UI.Day]: cn(
          buttonVariants({ buttonType: ButtonType.GHOST }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        ),
        [SelectionState.range_end]: "day-range-end",
        [SelectionState.selected]:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        [SelectionState.range_middle]:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        [DayFlag.today]: "bg-accent text-accent-foreground",
        [DayFlag.outside]:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        [DayFlag.disabled]: "text-muted-foreground opacity-50",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => <Chevron {...props} />,
      }}
      {...props}
    />
  )
}

const Chevron = ({ orientation = "left" }) => {
  switch (orientation) {
    case "left":
      return <ChevronLeftIcon className='h-4 w-4' />
    case "right":
      return <ChevronRightIcon className='h-4 w-4' />
    case "up":
      return <ChevronUpIcon className='h-4 w-4' />
    case "down":
      return <ChevronDownIcon className='h-4 w-4' />
    default:
      return null
  }
}
