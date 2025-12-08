import { ChevronDown } from "lucide-react"
import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  type MouseEvent,
  type RefObject,
  useEffect,
  useState,
} from "react"
import useEventRef from "../../hooks/use-event-ref"
import { Input } from "../../primitives"
import MonthAction from "./month-action"
import { FULL_MONTHS, SHORT_MONTHS } from "./months"

interface MonthProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (month: string) => void
  containerRef?: RefObject<HTMLLabelElement>
  selectorTitle?: string
}

const Month = forwardRef<HTMLInputElement, MonthProps>(
  ({ onChange, value, onBlur, selectorTitle, ...props }, ref) => {
    const [openMonthModal, openMonthModalRef] = useEventRef()
    const [text, setText] = useState<string>(value)

    const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
      setText(event.target.value)
    }

    const onBlurHandler = (event: FocusEvent<HTMLInputElement>) => {
      const newText = text.trim()
      const monthNumber = parseInt(newText, 10)
      let newMonthIndex

      if (!isNaN(monthNumber)) {
        newMonthIndex = monthNumber - 1
      } else {
        newMonthIndex = FULL_MONTHS.findIndex((fullMonth) =>
          fullMonth.toLowerCase().startsWith(newText.toLowerCase()),
        )
      }

      const newMonth = SHORT_MONTHS[newMonthIndex] || SHORT_MONTHS[0]

      if (newMonth !== text) {
        setText(newMonth)
      }
      if (newMonth !== value) {
        onChange(newMonth)
      }
      onBlur?.(event)
    }

    const openMonthModalHandler = (event: MouseEvent) => {
      event.preventDefault()
      openMonthModal()
    }

    useEffect(() => {
      if (value !== text) {
        setText(value)
      }
    }, [value])

    return (
      <>
        <Input
          ref={ref}
          type='text'
          value={text}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          {...props}
          iconRight={
            <ChevronDown
              className='h-6 w-6 shrink-0 flex-grow-0 cursor-pointer text-[#CBCBCB]'
              size={24}
              onClick={openMonthModalHandler}
            />
          }
        />
        <MonthAction
          actionRef={openMonthModalRef}
          onSelect={onChange}
          selectorTitle={selectorTitle}
        />
      </>
    )
  },
)

Month.displayName = "Month"

export default Month
