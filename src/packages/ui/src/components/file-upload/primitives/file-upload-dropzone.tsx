'use client';

import { cn } from '@repo/utils';
import { useFileUploadContext } from '../file-upload-context';

export interface FileUploadDropZoneProps {
  index: number;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

/**
 * Primitive component for drag-and-drop file upload area
 * Handles drag events and applies active state styling
 */
export function FileUploadDropZone({
  index,
  children,
  className,
  activeClassName,
}: FileUploadDropZoneProps) {
  const {
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    dragActiveIndex,
  } = useFileUploadContext();

  const isActive = dragActiveIndex === index;

  return (
    <div
      onDrop={(e) => handleDrop(index, e)}
      onDragOver={handleDragOver}
      onDragEnter={() => handleDragEnter(index)}
      onDragLeave={() => handleDragLeave(index)}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </div>
  );
}
