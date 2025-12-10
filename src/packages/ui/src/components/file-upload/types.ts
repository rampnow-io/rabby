export interface FileUploadConfig {
  maxFiles?: number;
  acceptedFormats?: string[];
  maxSizeKb?: number;
  onFileSelect?: (files: File[]) => void;
  initialFiles?: File[];
}

export interface FileUploadActions {
  selectFile: (index: number, file: File | null) => void;
  clearFile: (index: number) => void;
  triggerFileInput: (index: number) => void;
  handleDrop: (index: number, event: React.DragEvent) => void;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragEnter: (index: number) => void;
  handleDragLeave: (index: number) => void;
}

export interface FileUploadContext {
  // State
  files: File[];
  maxFiles: number;
  acceptedFormats: string[];
  inputRefs: React.RefObject<HTMLInputElement | null>[];
  dragActiveIndex: number | null;
  // Actions
  selectFile: (index: number, file: File | null) => void;
  clearFile: (index: number) => void;
  triggerFileInput: (index: number) => void;
  handleDrop: (index: number, event: React.DragEvent) => void;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragEnter: (index: number) => void;
  handleDragLeave: (index: number) => void;
}
