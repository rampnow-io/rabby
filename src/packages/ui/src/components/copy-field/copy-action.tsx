"use client"

import copyToClipboard from "copy-to-clipboard"
import {
  type MouseEvent,
  type MutableRefObject,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { v4 as uuid } from "uuid"
import useEvent from "../../hooks/use-event"

interface CopyActionProps {
  actionRef?: MutableRefObject<
    ((event: MouseEvent, value: string) => void) | undefined
  >
}

const TAG_LIFE_TIME_MILLISECONDS = 1000

function CopyAction({ actionRef }: CopyActionProps) {
  const [tags, setTags] = useState<
    { id: string; time: number; top: number; left: number }[]
  >([])

  const copy = useEvent((event: MouseEvent, value: string) => {
    copyToClipboard(value)
    setTags((tags) => [
      ...tags,
      { id: uuid(), time: Date.now(), top: event.clientY, left: event.clientX },
    ])
  })

  useImperativeHandle(actionRef, () => copy, [])

  useEffect(() => {
    if (!tags.length) {
      return
    }

    const time = tags.reduce(
      (minTime, tag) => (minTime < tag.time ? minTime : tag.time),
      Infinity,
    )

    const interval = setInterval(
      () => {
        const now = Date.now()
        setTags((tags) =>
          tags.filter((tag) => tag.time + TAG_LIFE_TIME_MILLISECONDS > now),
        )
      },
      time + TAG_LIFE_TIME_MILLISECONDS - Date.now(),
    )

    return () => {
      clearInterval(interval)
    }
  }, [tags])

  if (!tags.length) {
    return null
  }

  return createPortal(
    <>
      {tags.map((tag) => (
        <div
          key={tag.id}
          className='copy-action-tag fixed select-none rounded-[2px] bg-[#C3F53C] p-0.5 text-[10px] text-[#000000]'
          style={{ top: tag.top, left: tag.left }}
        >
          Copied
        </div>
      ))}
    </>,
    document.body,
  )
}

CopyAction.displayName = "CopyAction"

export default CopyAction
