import React from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

type BottomFloatingSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;

  className?: string; // card wrapper
  contentClassName?: string; // content wrapper
  hideCloseButton?: boolean;
};

export default function BottomFloatingSheet({
  open,
  onClose,
  children,
  className,
  contentClassName,
  hideCloseButton = false,
}: BottomFloatingSheetProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
        <div
          className={clsx(
            'relative w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {!hideCloseButton && (
            <X
              size={22}
              onClick={onClose}
              className="absolute right-4 top-4 cursor-pointer text-gray-500 hover:text-gray-700"
            />
          )}

          <div
            className={clsx(
              'px-6 pt-4 pb-6 min-h-[160px] max-h-[70vh] overflow-y-auto',
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
