import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  type RefObject,
  useEffect,
  useState,
} from "react"
import { Input } from "../../primitives"

interface DayProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string
  max: number
  onChange: (value: string) => void
  containerRef?: RefObject<HTMLLabelElement>
}

const Day = forwardRef<HTMLInputElement, DayProps>(
  ({ value, max, onChange, onBlur, ...props }, ref) => {
    const [text, setText] = useState("")
    const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value || ""
      value = value.replace(/\D/g, "")
      value = value.slice(value.length - 2)

      setText(value)
    }

    const onBlurHandler = (event: FocusEvent<HTMLInputElement>) => {
      let newDayRaw = Math.max(Math.min(parseInt(text, 10), max), 1)

      if (isNaN(newDayRaw)) {
        newDayRaw = 1
      }

      const newDay = newDayRaw.toString().padStart(2, "0")

      if (newDay !== text) {
        setText(newDay)
      }
      onChange(newDay)
      onBlur?.(event)
    }

    useEffect(() => {
      if (value !== text) {
        setText(value)
      }
    }, [value])

    return (
      <Input
        ref={ref}
        type='text'
        value={text}
        onChange={onChangeHandler}
        onBlur={onBlurHandler}
        {...props}
      />
    )
  },
)

Day.displayName = "Day"

export default Day
