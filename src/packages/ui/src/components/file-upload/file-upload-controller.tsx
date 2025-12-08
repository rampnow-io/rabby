"use client"

import type { ReactNode } from "react"
import { FileUploadProvider } from "./file-upload-context"
import type { FileUploadConfig } from "./types"
import { useFileUpload } from "./use-file-upload"

interface FileUploadControllerProps extends FileUploadConfig {
  children: ReactNode
}

/**
 * Headless controller that provides file upload context to child components
 * This is the root component that manages all state and logic
 */
export function FileUploadController({
  children,
  ...config
}: FileUploadControllerProps) {
  const fileUpload = useFileUpload(config)

  return <FileUploadProvider value={fileUpload}>{children}</FileUploadProvider>
}
