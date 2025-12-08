"use client"

import type { ReactNode } from "react"
import { useFileUploadContext } from "../file-upload-context"

interface FileUploadTriggerProps {
  index: number
  children: ReactNode
  className?: string
}

/**
 * Clickable element that triggers file selection
 * Primitive component that can be styled as needed
 */
export function FileUploadTrigger({
  index,
  children,
  className,
}: FileUploadTriggerProps) {
  const { triggerFileInput } = useFileUploadContext()

  return (
    <div
      role='button'
      tabIndex={0}
      className={className}
      onClick={() => triggerFileInput(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          triggerFileInput(index)
        }
      }}
    >
      {children}
    </div>
  )
}
