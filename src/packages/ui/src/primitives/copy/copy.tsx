"use client"

import { Copy as CopyIcon } from "lucide-react"
import { type MouseEvent, type ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import "./styles.css"

export interface CopyProps {
  value: string
  children?: ReactNode
  className?: string
}

export function Copy({ value, children = null, className }: CopyProps) {
  const [copied, setCopied] = useState(false)
  const [tags, setTags] = useState<
    { id: string; time: number; top: number; left: number }[]
  >([])

  const TAG_LIFE_TIME_MILLISECONDS = 1000

  const handleCopy = (event: MouseEvent) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)

      const id = Math.random().toString(36).substring(2, 9)
      setTags((prev) => [
        ...prev,
        {
          id,
          time: Date.now(),
          top: event.clientY,
          left: event.clientX,
        },
      ])
    })
  }

  useEffect(() => {
    if (!tags.length) {
      return
    }

    const time = Math.min(...tags.map((tag) => tag.time))

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

  return (
    <>
      <div
        className={`relative inline-flex items-center gap-1 ${className || ""}`}
      >
        {children}
        <button
          onClick={handleCopy}
          className='text-black-600 ml-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-200'
          title='Copy to clipboard'
        >
          <CopyIcon className='h-3 w-3' />
        </button>
      </div>

      {tags.length > 0 &&
        createPortal(
          <>
            {tags.map((tag) => (
              <div
                key={tag.id}
                className='copy-action-tag fixed select-none rounded-sm bg-[#ffffff] px-1.5 py-0.5 text-[10px] font-medium text-black'
                style={{ top: tag.top, left: tag.left }}
              >
                COPIED
              </div>
            ))}
          </>,
          document.body,
        )}
    </>
  )
}
