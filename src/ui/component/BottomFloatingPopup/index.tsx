import React from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

type BottomFloatingSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;

  className?: string; // card wrapper
  headerClassName?: string;
  contentClassName?: string; // content wrapper
  footerClassName?: string;
  hideCloseButton?: boolean;
};

export default function BottomFloatingSheet({
  open,
  onClose,
  children,
  header,
  footer,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  hideCloseButton = false,
}: BottomFloatingSheetProps) {
  if (!open) return null;

  const showHeader = Boolean(header) || !hideCloseButton;

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
            'relative w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up flex max-h-[80vh] flex-col overflow-hidden',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {showHeader && (
            <div className={clsx('px-6 pt-4', headerClassName)}>
              <div className="relative pr-8">{header}</div>
              {!hideCloseButton && (
                <X
                  size={22}
                  onClick={onClose}
                  className="absolute right-4 top-4 cursor-pointer text-gray-500 hover:text-gray-700"
                />
              )}
            </div>
          )}

          <div
            className={clsx(
              'min-h-0 flex-1 overflow-y-auto px-6 py-4',
              contentClassName
            )}
          >
            {children}
          </div>

          {footer && (
            <div
              className={clsx(
                'border-t border-gray-100 px-6 pb-6 pt-3',
                footerClassName
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
