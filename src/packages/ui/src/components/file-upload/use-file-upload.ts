'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FileUploadConfig, FileUploadContext } from './types';

const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'application/pdf'];
/**
 * Headless hook for file upload logic
 * Manages state and provides actions for file selection
 */
export function useFileUpload(
  config: FileUploadConfig = {}
): FileUploadContext {
  const {
    maxFiles = 1,
    acceptedFormats = ACCEPTED_FORMATS,
    maxSizeKb,
    onFileSelect,
    initialFiles = [],
  } = config;

  // Create a ref that holds an array of input element refs
  const inputRefsArray = useRef<(HTMLInputElement | null)[]>([]);

  // Create stable ref objects that point to array indices
  const inputRefs = useMemo(() => {
    return Array.from({ length: maxFiles }, (_, index) => ({
      get current() {
        return inputRefsArray.current[index] || null;
      },
      set current(element: HTMLInputElement | null) {
        inputRefsArray.current[index] = element;
      },
    })) as React.RefObject<HTMLInputElement>[];
  }, [maxFiles]);

  const [files, setFiles] = useState<File[]>(initialFiles.slice(0, maxFiles));
  const [dragActiveIndex, setDragActiveIndex] = useState<number | null>(null);

  // Call onFileSelect when files change (outside of render)
  useEffect(() => {
    onFileSelect?.(files.filter((f) => f !== null));
  }, [files, onFileSelect]);

  const updateFiles = useCallback((updater: (prev: File[]) => File[]) => {
    setFiles((prev) => updater(prev));
  }, []);

  const selectFile = useCallback(
    (index: number, file: File | null) => {
      if (index < 0 || index >= maxFiles) return;

      if (file && maxSizeKb && file.size > maxSizeKb * 1024) {
        console.warn(`File size exceeds ${maxSizeKb}KB limit`);
        return;
      }

      updateFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index] = file as File;
        return newFiles;
      });
    },
    [maxFiles, maxSizeKb, updateFiles]
  );

  const clearFile = useCallback(
    (index: number) => {
      if (index < 0 || index >= maxFiles) {
        return;
      }

      updateFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index] = null as any;
        return newFiles.filter((f) => f !== null);
      });

      const ref = inputRefs[index];
      if (ref?.current) ref.current.value = '';
    },
    [maxFiles, inputRefs, updateFiles]
  );

  const triggerFileInput = useCallback(
    (index: number) => {
      if (index < 0 || index >= maxFiles) {
        return;
      }
      inputRefs[index]?.current?.click();
    },
    [maxFiles, inputRefs]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    setDragActiveIndex(index);
  }, []);

  const handleDragLeave = useCallback((index: number) => {
    setDragActiveIndex(null);
  }, []);

  const handleDrop = useCallback(
    (index: number, event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActiveIndex(null);

      if (index < 0 || index >= maxFiles) return;

      const droppedFiles = Array.from(event.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      const file = droppedFiles[0];

      // Check file type if acceptedFormats is specified
      if (acceptedFormats && acceptedFormats.length > 0) {
        const isValidType = acceptedFormats.some((type) => {
          if (type.endsWith('/*')) {
            // Handle mime type wildcards like "image/*"
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType + '/');
          }
          return file.type === type;
        });

        if (!isValidType) {
          console.warn(`File type ${file.type} not accepted`);
          return;
        }
      }

      selectFile(index, file);
    },
    [maxFiles, acceptedFormats, selectFile]
  );

  return {
    // State
    files,
    maxFiles,
    acceptedFormats,
    inputRefs,
    dragActiveIndex,
    // Actions
    selectFile,
    clearFile,
    triggerFileInput,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
  };
}
