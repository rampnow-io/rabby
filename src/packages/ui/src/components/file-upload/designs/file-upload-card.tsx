'use client';

import { cn } from '@repo/utils';
import { X } from 'lucide-react';
import { Card } from '../../../primitives';
import { useFileUploadContext } from '../file-upload-context';
import {
  FileUploadClear,
  FileUploadDropZone,
  FileUploadInput,
  FileUploadTrigger,
} from '../primitives';

interface FileUploadCardProps {
  title: string;
  description?: string;
  className?: string;
  labels?: string[];
}

/**
 * Pre-built card design for file upload
 * Uses the headless primitives to build a complete UI
 */
export function FileUploadCard({
  title,
  description,
  className,
  labels,
}: FileUploadCardProps) {
  const { files, maxFiles } = useFileUploadContext();

  const getLabel = (index: number) => {
    return labels?.[index] ?? '';
  };

  return (
    <Card
      className={cn('rounded-lg w-full p-4 flex flex-col gap-4', className)}
    >
      <div className="flex justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      {description && (
        <div className="text-sm text-gray-500">{description}</div>
      )}

      {Array.from({ length: maxFiles }).map((_, index) => (
        <FileRow
          key={index}
          label={getLabel(index)}
          index={index}
          file={files[index] || null}
        />
      ))}
    </Card>
  );
}

interface FileRowProps {
  label: string;
  index: number;
  file: File | null;
}

function FileRow({ label, index, file }: FileRowProps) {
  const { dragActiveIndex } = useFileUploadContext();
  const isDragActive = dragActiveIndex === index;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">{label}</p>

          {file ? (
            <FileUploadClear
              index={index}
              className="cursor-pointer text-gray-500 hover:text-red-600"
            >
              <X />
            </FileUploadClear>
          ) : null}
        </div>
      )}

      {!label && file && (
        <div className="flex justify-end">
          <FileUploadClear
            index={index}
            className="cursor-pointer text-gray-500 hover:text-red-600"
          >
            <X />
          </FileUploadClear>
        </div>
      )}

      {file ? (
        <div className="bg-gray-100 p-3 rounded-md">
          <div className="text-sm truncate">{file.name}</div>
          <div className="text-xs text-gray-500">
            {(file.size / 1024).toFixed(1)} KB
          </div>
        </div>
      ) : (
        <FileUploadDropZone
          index={index}
          className={cn(
            'border-2 border-dashed rounded-md p-6 transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
          activeClassName="border-blue-500 bg-blue-50"
        >
          <FileUploadTrigger index={index} className="w-full">
            <div className="text-center cursor-pointer">
              <p className="text-sm text-gray-500">
                {isDragActive
                  ? 'Drop file here'
                  : 'Click to upload or drag and drop'}
              </p>
            </div>
          </FileUploadTrigger>
        </FileUploadDropZone>
      )}

      <FileUploadInput index={index} />
    </div>
  );
}
