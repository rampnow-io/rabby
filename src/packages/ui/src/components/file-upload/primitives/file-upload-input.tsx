'use client';

import { useFileUploadContext } from '../file-upload-context';

interface FileUploadInputProps {
  index: number;
  className?: string;
}

/**
 * Hidden file input element
 * Primitive component that renders the actual <input type="file">
 */
export function FileUploadInput({ index, className }: FileUploadInputProps) {
  const { inputRefs, acceptedFormats, selectFile } = useFileUploadContext();

  const inputRef = inputRefs[index];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    selectFile(index, file);
  };

  return (
    <input
      ref={inputRef}
      type="file"
      accept={acceptedFormats.join(',')}
      className={className || 'hidden'}
      onChange={handleChange}
    />
  );
}
