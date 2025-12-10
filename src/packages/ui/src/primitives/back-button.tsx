'use client';

import { ArrowLeftIcon } from 'lucide-react';

function BackButton() {
  return (
    <button
      onClick={() => {
        window.history.back();
      }}
      aria-label="Go back"
      className="flex items-center"
    >
      <ArrowLeftIcon className="h-6 w-6" />
    </button>
  );
}

BackButton.displayName = 'BackButton';

export { BackButton };
