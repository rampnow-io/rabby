import { cn, truncate } from "@repo/utils"
import { Copy } from "lucide-react"
import { type MouseEvent } from "react"
import useEventRef from "../../hooks/use-event-ref"
import CopyAction from "./copy-action"

interface CopyFieldProps {
  className?: string
  value?: string
  group: [number, number]
  hideValue?: boolean
  delimiter?: string
  link?: string
}

function CopyField({
  className,
  value,
  group,
  hideValue = false,
  delimiter = "...",
  link,
}: CopyFieldProps) {
  const [copy, copyRef] =
    useEventRef<(event: MouseEvent, value: string) => void>()

  const handleOnClick = () => {
    if (link) {
      window.open(link, "_blank")
    }
  }

  const handleCopyClick = (event: MouseEvent) => {
    copy(event, value ?? "")
  }

  return (
    <>
      <div
        className={cn(
          "flex cursor-pointer items-center justify-end gap-2",
          className,
          Boolean(link) && "underline",
        )}
        onClick={link ? undefined : handleCopyClick}
      >
        <span
          className='tooltip-top-right'
          onClick={handleOnClick}
          data-tooltip={value}
        >
          {!hideValue ? truncate(value, group, delimiter) : ""}
        </span>
        <Copy className='w-4 cursor-pointer' onClick={handleCopyClick} />
      </div>
      <CopyAction actionRef={copyRef} />
    </>
  )
}

CopyField.displayName = "CopyField"

export default CopyField
