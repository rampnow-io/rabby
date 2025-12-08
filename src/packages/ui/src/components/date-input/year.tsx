import { getYear } from "date-fns"
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
import YearAction from "./year-action"

interface YearProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (year: string) => void
  containerRef?: RefObject<HTMLLabelElement>
  selectorTitle?: string
}

const Year = forwardRef<HTMLInputElement, YearProps>(
  ({ value, onChange, onBlur, selectorTitle, ...props }, ref) => {
    const [openYarnModal, openYarnModalRef] = useEventRef()
    const [text, setText] = useState<string>(value)

    const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value || ""
      value = value.replace(/\D/g, "")

      setText(value)
    }

    const onBlurHandler = (event: FocusEvent<HTMLInputElement>) => {
      const newText = text.trim()
      const newYearRaw = Math.abs(parseInt(newText, 10))
      const currentYear = getYear(new Date())
      const century = Math.ceil(currentYear / 100)
      let newYear = ((century - 1) * 100).toString()

      if (!isNaN(newYearRaw)) {
        if (newYearRaw <= 99) {
          const currentYear = getYear(new Date())
          const century = Math.ceil(currentYear / 100)
          const newYearCurrentCentury = (century - 1) * 100 + newYearRaw
          const newYearPreviousCentury = (century - 2) * 100 + newYearRaw

          if (
            newYearCurrentCentury > currentYear ||
            currentYear - newYearCurrentCentury < 18
          ) {
            newYear = newYearPreviousCentury.toString()
          } else {
            newYear = newYearCurrentCentury.toString()
          }
        } else {
          newYear = newYearRaw.toString()
        }
      }

      if (newYear !== text) {
        setText(newYear)
      }

      if (newYear !== value) {
        onChange(newYear)
      }
      onBlur?.(event)
    }

    const openYarnModalHandler = (event: MouseEvent) => {
      event.preventDefault()
      openYarnModal()
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
          value={text}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          iconRight={
            <ChevronDown
              className='h-6 w-6 shrink-0 flex-grow-0 cursor-pointer text-[#CBCBCB]'
              size={24}
              onClick={openYarnModalHandler}
            />
          }
          {...props}
        />
        <YearAction
          actionRef={openYarnModalRef}
          onSelect={onChange}
          selectorTitle={selectorTitle}
        />
      </>
    )
  },
)

Year.displayName = "Year"

export default Year
