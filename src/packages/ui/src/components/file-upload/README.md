# FileUpload Component System

A headless, composable file upload component system that separates logic from presentation.

## Design Pattern

This component uses the **Headless Component Pattern** with **Compound Components**, providing:

- 🧠 **Logic separation**: All state management in `useFileUpload` hook
- 🎨 **Multiple designs**: Pre-built Card, Minimal, or build your own
- 🔧 **Composable**: Use primitives to create custom UIs
- 📦 **Type-safe**: Full TypeScript support
- ♿ **Accessible**: Keyboard navigation and ARIA support
- 🎯 **Drag & Drop**: Built-in drag and drop file upload support

## Architecture

```
useFileUpload (hook)           → Core logic & state management
  ↓
FileUploadController            → Headless component providing context
  ↓
FileUpload.* (compound)         → Pre-built UI components
  ├── FileUpload.Card           → Default card design
  ├── FileUpload.Minimal        → Minimal design
  └── Custom components         → Build your own using primitives
```

## Usage

### 1. Pre-built Card Design

```tsx
import { FileUpload } from "@repo/ui"

function MyForm() {
  const handleFiles = (files: File[]) => {
    console.log("Files uploaded:", files)
    files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, file.name)
    })
  }

  return (
    <FileUpload.Controller maxFiles={2} onFileSelect={handleFiles}>
      <FileUpload.Card title='Upload ID Document' />
    </FileUpload.Controller>
  )
}
```

### 2. Pre-built Minimal Design

```tsx
<FileUpload.Controller maxFiles={1} onFileSelect={handleFiles}>
  <FileUpload.Minimal />
</FileUpload.Controller>
```

### 3. Custom Design with Primitives

```tsx
<FileUpload.Controller maxFiles={2} onFileSelect={handleFiles}>
  <div className='my-custom-design'>
    <h2>Upload Documents</h2>

    <div className='file-section'>
      <FileUpload.DropZone
        index={0}
        className='border-dashed border-2 p-4'
        activeClassName='border-blue-500 bg-blue-50'
      >
        <FileUpload.Trigger index={0}>
          <button>📁 Select Front or Drag & Drop</button>
        </FileUpload.Trigger>
      </FileUpload.DropZone>

      <FileUpload.Clear index={0}>
        <button>❌ Remove</button>
      </FileUpload.Clear>

      <FileUpload.Input index={0} />
    </div>

    <div className='file-section'>
      <FileUpload.DropZone
        index={1}
        className='border-dashed border-2 p-4'
        activeClassName='border-blue-500 bg-blue-50'
      >
        <FileUpload.Trigger index={1}>
          <button>📁 Select Back or Drag & Drop</button>
        </FileUpload.Trigger>
      </FileUpload.DropZone>

      <FileUpload.Clear index={1}>
        <button>❌ Remove</button>
      </FileUpload.Clear>

      <FileUpload.Input index={1} />
    </div>
  </div>
</FileUpload.Controller>
```

### 4. Using the Hook Directly (Maximum Control)

```tsx
import { useFileUpload } from "@repo/ui"

function MyCustomUpload() {
  const fileUpload = useFileUpload({
    maxFiles: 2,
    maxSizeKB: 5000,
    onFileSelect: (files) => console.log(files),
  })

  return (
    <div>
      <button onClick={() => fileUpload.triggerFileInput(0)}>
        Select File
      </button>

      {fileUpload.files[0] && (
        <div>
          <p>{fileUpload.files[0].name}</p>
          <button onClick={() => fileUpload.clearFile(0)}>Clear</button>
        </div>
      )}

      <input
        ref={fileUpload.inputRefs[0]}
        type='file'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) fileUpload.selectFile(0, file)
        }}
      />
    </div>
  )
}
```

## API Reference

### FileUpload.Controller

Root component that manages state and provides context.

```tsx
interface FileUploadConfig {
  maxFiles?: number // Number of files allowed (default: 1)
  acceptedFormats?: string[] // Array of accepted MIME types (default: ACCEPTED_FORMATS)
  maxSizeKB?: number // Optional file size limit
  onFileSelect?: (files: File[]) => void // Callback when files change
  initialFiles?: File[] // Pre-populate files
}
```

### Pre-built Designs

#### FileUpload.Card

```tsx
<FileUpload.Card
  title='Upload Document' // Required
  className='' // Optional
  labels={["Front", "Back"]} // Optional custom labels
/>
```

#### FileUpload.Minimal

```tsx
<FileUpload.Minimal
  className='' // Optional
  labels={["Front", "Back"]} // Optional custom labels
/>
```

### Primitives

#### FileUpload.Input

```tsx
<FileUpload.Input
  index={0} // Required (0-based index)
  className='' // Optional
/>
```

#### FileUpload.Trigger

```tsx
<FileUpload.Trigger
  index={0} // Required (0-based index)
  className='' // Optional
>
  {children} // Your button/clickable element
</FileUpload.Trigger>
```

#### FileUpload.Clear

```tsx
<FileUpload.Clear
  index={0} // Required (0-based index)
  className='' // Optional
>
  {children} // Your button/clickable element
</FileUpload.Clear>
```

#### FileUpload.DropZone

```tsx
<FileUpload.DropZone
  index={0} // Required (0-based index)
  className='' // Optional base styles
  activeClassName='' // Optional styles when dragging over
>
  {children} // Your upload area content
</FileUpload.DropZone>
```

### useFileUpload Hook

Returns all state and actions:

```tsx
const {
  // State
  files: File[],                              // Array of uploaded files
  maxFiles: number,                           // Maximum files allowed
  acceptedFormats: string[],                  // Array of accepted MIME types
  inputRefs: React.RefObject<HTMLInputElement>[], // Array of input refs
  dragActiveIndex: number | null,             // Index of active drag target

  // Actions
  selectFile: (index: number, file: File) => void,  // Select file at index
  clearFile: (index: number) => void,               // Clear file at index
  triggerFileInput: (index: number) => void,        // Open file picker
  handleDrop: (index: number, event: React.DragEvent) => void,    // Handle drop
  handleDragOver: (event: React.DragEvent) => void,               // Handle drag over
  handleDragEnter: (index: number) => void,                       // Handle drag enter
  handleDragLeave: (index: number) => void,                       // Handle drag leave
} = useFileUpload(config)
```

## Creating New Designs

To create a new design:

1. Create a new file in `designs/` folder
2. Use `useFileUploadContext()` to access state and actions
3. Use primitives to build your UI
4. Export and add to `index.tsx`

Example:

```tsx
// designs/file-upload-modern.tsx
import { useFileUploadContext } from "../file-upload-context"
import { FileUploadInput, FileUploadTrigger } from "../primitives"

export function FileUploadModern() {
  const { files, maxFiles } = useFileUploadContext()

  return (
    <div className='modern-design'>
      {Array.from({ length: maxFiles }).map((_, index) => (
        <FileUploadTrigger key={index} index={index}>
          <div className='drop-zone'>
            {files[index] ? files[index].name : "Drop file here"}
          </div>
        </FileUploadTrigger>
      ))}
      {Array.from({ length: maxFiles }).map((_, index) => (
        <FileUploadInput key={index} index={index} />
      ))}
    </div>
  )
}
```

Then add to exports:

```tsx
// index.tsx
export { FileUploadModern } from "./designs/file-upload-modern"

export const FileUpload = {
  Controller: FileUploadController,
  Card: FileUploadCard,
  Minimal: FileUploadMinimal,
  Modern: FileUploadModern, // ← Add here
  // ...primitives
}
```
