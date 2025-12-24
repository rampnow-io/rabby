'use client';

import React from 'react';
import { Image } from '@repo/ui/primitives';
import { cn } from '@repo/utils';
import { useHistory } from 'react-router-dom';
import { X } from 'lucide-react';

interface HeaderNavPageProps {
  disableNav?: boolean;
  handleBack?: () => void;
  children?: React.ReactNode;
  isCancelled?: boolean;
}

function HeaderNavPage({
  disableNav = false,
  handleBack,
  children,
  isCancelled = false,
}: HeaderNavPageProps) {
  const history = useHistory();

  const handleBackClick = () => {
    if (handleBack) {
      handleBack();
      return;
    }

    if (!disableNav) {
      history.goBack();
    }
  };

  return (
    <header className="flex items-end justify-between p-6 font-medium transition-all">
      {!isCancelled && (
        <button
          onClick={handleBackClick}
          aria-label="Go back"
          disabled={disableNav}
          className={cn(
            'transition-opacity',
            disableNav && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Image
            src="/image/icon/general/back.svg"
            width={24}
            height={24}
            draggable={false}
            alt="Back button"
          />
        </button>
      )}

      <div className="flex-1 text-center">{children}</div>

      <div className="w-6 flex justify-end">
        {isCancelled && (
          <X
            size={24}
            className="cursor-pointer text-neutral-600 hover:text-neutral-900"
            onClick={handleBackClick}
          />
        )}
      </div>
    </header>
  );
}

export default HeaderNavPage;
