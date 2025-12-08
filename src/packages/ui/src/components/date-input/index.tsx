"use client"

import { cn } from "@repo/utils"
import {
  formatISO,
  getDate,
  getDaysInMonth,
  getMonth,
  getYear,
  parseISO,
} from "date-fns"
import React, {
  type FocusEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import Day from "./day"
import Month from "./month"
import { SHORT_MONTHS } from "./months"
import Year from "./year"

interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string
  onChange?: (date: string) => void
  hasError?: boolean
  monthSelectorTitle?: string
  yearSelectorTitle?: string
}

function getMaxDayInMonth(month: string, year?: string) {
  if (month) {
    return getDaysInMonth(
      new Date(parseInt(year || "2000"), SHORT_MONTHS.indexOf(month)),
    )
  }

  return 31
}

function getDayString(date: Date | null) {
  return date ? getDate(date).toString().padStart(2, "0") : ""
}

function getMonthString(date: Date | null) {
  if (date) {
    return SHORT_MONTHS[getMonth(date)]
  }

  return ""
}

function getYearString(date: Date | null) {
  if (date) {
    return getYear(date).toString()
  }

  return ""
}

const DateInput = forwardRef<HTMLDivElement, DateInputProps>(
  (
    {
      value,
      className,
      onChange,
      onBlur,
      onFocus,
      hasError,
      monthSelectorTitle,
      yearSelectorTitle,
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const dayRef = useRef<HTMLInputElement>(null)
    const monthRef = useRef<HTMLInputElement>(null)
    const yearRef = useRef<HTMLInputElement>(null)
    const date = useMemo(
      () => (value ? parseISO(`${value}T00:00:00.000`) : null),
      [value],
    )

    const [year, setYear] = useState(getYearString(date))
    const [month, setMonth] = useState(getMonthString(date))
    const [day, setDay] = useState(getDayString(date))

    const [focused, setFocused] = useState(false)
    const maxDayInMonth = useMemo(
      () => getMaxDayInMonth(month, year),
      [month, year],
    )

    const tryPropagateChange = (
      newDay: string,
      newMonth: string,
      newYear: string,
    ) => {
      if (!newDay || !newMonth || !newYear) {
        return
      }

      const newDate = formatISO(
        new Date(
          parseInt(newYear),
          SHORT_MONTHS.indexOf(newMonth),
          parseInt(newDay),
        ),
        { representation: "date" },
      )

      onChange?.(newDate)
    }

    const onChangeDay = (newDay: string) => {
      setDay(newDay)
      tryPropagateChange(newDay, month, year)
    }

    const onChangeMonth = (newMonth: string) => {
      const maxDayInMonth = getMaxDayInMonth(newMonth, year)
      const newDate =
        day &&
        Math.min(parseInt(day, 10), maxDayInMonth).toString().padStart(2, "0")

      if (newDate !== day) {
        setDay(newDate)
      }

      setMonth(newMonth)
      tryPropagateChange(newDate, newMonth, year)
    }

    const onChangeYear = (newYear: string) => {
      const maxDayInMonth = getMaxDayInMonth(month, newYear)
      const newDate =
        day &&
        Math.min(parseInt(day, 10), maxDayInMonth).toString().padStart(2, "0")

      if (newDate !== day) {
        setDay(newDate)
      }

      setYear(newYear)
      tryPropagateChange(newDate, month, newYear)
    }

    const onFocusHandler = (event: FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      if (event.target === containerRef.current) {
        if (!day) {
          dayRef.current?.focus()
        } else if (!month) {
          monthRef.current?.focus()
        } else if (!year) {
          yearRef.current?.focus()
        } else {
        }
      }
    }

    const onBlurHandler = (event: FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        setFocused(false)
      })
      onBlur?.(event)
    }

    useEffect(() => {
      const newDay = getDayString(date)
      const newMonth = getMonthString(date)
      const newYear = getYearString(date)

      if (newDay !== day) {
        setDay(newDay)
      }
      if (newMonth !== month) {
        setMonth(newMonth)
      }
      if (newYear !== year) {
        setYear(newYear)
      }
    }, [date])

    useImperativeHandle(ref, () => containerRef.current!, [])

    return (
      <div className={cn("flex", className)} {...props}>
        <Day
          ref={dayRef}
          className='h-12 w-[64px] flex-shrink-0 flex-grow-0'
          placeholder='DD'
          value={day}
          onChange={onChangeDay}
          max={maxDayInMonth}
          aria-invalid={hasError}
        />
        <Month
          ref={monthRef}
          className='ml-4 h-12 flex-shrink flex-grow'
          placeholder='Month'
          value={month}
          onChange={onChangeMonth}
          aria-invalid={hasError}
          selectorTitle={monthSelectorTitle}
        />
        <Year
          ref={yearRef}
          className='ml-4 h-12 flex-shrink flex-grow'
          placeholder='Year'
          value={year}
          onChange={onChangeYear}
          aria-invalid={hasError}
          selectorTitle={yearSelectorTitle}
        />
        <div
          className='flex-grow-0'
          tabIndex={focused ? undefined : -1}
          ref={containerRef}
          onFocus={onFocusHandler}
          onBlur={onBlurHandler}
        />
      </div>
    )
  },
)

DateInput.displayName = "DateInput"

export { DateInput }
