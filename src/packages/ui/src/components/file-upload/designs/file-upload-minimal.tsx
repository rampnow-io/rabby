'use client';

import { cn } from '@repo/utils';
import { Upload, X } from 'lucide-react';
import { useFileUploadContext } from '../file-upload-context';
import {
  FileUploadClear,
  FileUploadDropZone,
  FileUploadInput,
  FileUploadTrigger,
} from '../primitives';

interface FileUploadMinimalProps {
  className?: string;
  labels?: string[];
}

/**
 * Minimal design for file upload
 * Alternative design using the same headless logic
 */
export function FileUploadMinimal({
  className,
  labels,
}: FileUploadMinimalProps) {
  const { files, maxFiles } = useFileUploadContext();

  const getLabel = (index: number) => {
    return labels?.[index] ?? '';
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: maxFiles }).map((_, index) => (
        <MinimalFileRow
          key={index}
          index={index}
          file={files[index] || null}
          label={getLabel(index)}
        />
      ))}
    </div>
  );
}

interface MinimalFileRowProps {
  index: number;
  file: File | null;
  label: string;
}

function MinimalFileRow({ index, file, label }: MinimalFileRowProps) {
  const { dragActiveIndex } = useFileUploadContext();
  const isDragActive = dragActiveIndex === index;

  if (file) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-center gap-3">
          <Upload className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium">{file.name}</div>
            <div className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
        <FileUploadClear
          index={index}
          className="cursor-pointer text-gray-400 hover:text-red-500"
        >
          <X className="w-4 h-4" />
        </FileUploadClear>
        <FileUploadInput index={index} />
      </div>
    );
  }

  return (
    <FileUploadDropZone
      index={index}
      className={cn(
        'transition-colors',
        isDragActive && 'ring-2 ring-blue-500'
      )}
      activeClassName="ring-2 ring-blue-500"
    >
      <FileUploadTrigger
        index={index}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-md cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <Upload className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">
          {isDragActive
            ? `Drop ${label} here`
            : `Click to upload or drag ${label}`}
        </span>
        <FileUploadInput index={index} />
      </FileUploadTrigger>
    </FileUploadDropZone>
  );
}
