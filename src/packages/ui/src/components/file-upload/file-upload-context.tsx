'use client';

import { createContext, useContext } from 'react';
import type { FileUploadContext } from './types';

const FileUploadCtx = createContext<FileUploadContext | null>(null);

export const FileUploadProvider = FileUploadCtx.Provider;

export function useFileUploadContext() {
  const context = useContext(FileUploadCtx);
  if (!context) {
    throw new Error(
      'File upload components must be used within FileUpload.Controller'
    );
  }
  return context;
}
