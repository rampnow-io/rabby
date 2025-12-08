/**
 * File Upload Component System
 *
 * This is a headless component architecture that separates logic from presentation.
 *
 * Usage Examples:
 *
 * 1. Using pre-built Card design (single file):
 * ```tsx
 * <FileUpload.Controller maxFiles={1} onFileSelect={handleFiles}>
 *   <FileUpload.Card title="Upload Document" />
 * </FileUpload.Controller>
 * ```
 *
 * 2. Using pre-built Card design (multiple files):
 * ```tsx
 * <FileUpload.Controller maxFiles={2} onFileSelect={handleFiles}>
 *   <FileUpload.Card title="Upload ID" labels={["Front", "Back"]} />
 * </FileUpload.Controller>
 * ```
 *
 * 3. Using pre-built Minimal design:
 * ```tsx
 * <FileUpload.Controller maxFiles={3} onFileSelect={handleFiles}>
 *   <FileUpload.Minimal />
 * </FileUpload.Controller>
 * ```
 *
 * 4. Building custom design with primitives:
 * ```tsx
 * <FileUpload.Controller maxFiles={2} onFileSelect={handleFiles}>
 *   <div className="custom-wrapper">
 *     <FileUpload.Trigger index={0}>
 *       <button>Select File 1</button>
 *     </FileUpload.Trigger>
 *     <FileUpload.Clear index={0}>
 *       <button>Clear</button>
 *     </FileUpload.Clear>
 *     <FileUpload.Input index={0} />
 *   </div>
 * </FileUpload.Controller>
 * ```
 *
 * 5. Using the hook directly (for maximum control):
 * ```tsx
 * function MyCustomUpload() {
 *   const fileUpload = useFileUpload({ maxFiles: 2 })
 *   // Build your own UI using fileUpload state and actions
 * }
 * ```
 */

export { useFileUploadContext } from "./file-upload-context"
export { FileUploadController } from "./file-upload-controller"
export { useFileUpload } from "./use-file-upload"

// Primitives for building custom designs
export {
  FileUploadClear,
  FileUploadDropZone,
  FileUploadInput,
  FileUploadTrigger,
} from "./primitives"

// Pre-built designs
export { FileUploadCard } from "./designs/file-upload-card"
export { FileUploadMinimal } from "./designs/file-upload-minimal"

// Types
export type {
  FileUploadActions,
  FileUploadConfig,
  FileUploadContext,
} from "./types"

// Compound component export
import { FileUploadCard } from "./designs/file-upload-card"
import { FileUploadMinimal } from "./designs/file-upload-minimal"
import { FileUploadController } from "./file-upload-controller"
import {
  FileUploadClear,
  FileUploadDropZone,
  FileUploadInput,
  FileUploadTrigger,
} from "./primitives"

export const FileUpload = {
  Controller: FileUploadController,
  Card: FileUploadCard,
  Minimal: FileUploadMinimal,
  Input: FileUploadInput,
  Trigger: FileUploadTrigger,
  Clear: FileUploadClear,
  DropZone: FileUploadDropZone,
}
