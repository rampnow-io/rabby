'use client';

import type { ReactNode } from 'react';
import { useFileUploadContext } from '../file-upload-context';

interface FileUploadClearProps {
  index: number;
  children: ReactNode;
  className?: string;
}

/**
 * Clickable element that clears selected file
 * Primitive component that can be styled as needed
 */
export function FileUploadClear({
  index,
  children,
  className,
}: FileUploadClearProps) {
  const { clearFile } = useFileUploadContext();

  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      onClick={() => clearFile(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clearFile(index);
        }
      }}
    >
      {children}
    </div>
  );
}
