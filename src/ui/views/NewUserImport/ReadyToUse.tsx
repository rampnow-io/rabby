import React, { useEffect, useMemo } from 'react';
import { Card } from '@/ui/component/NewUserImport';
import { Button } from '@repo/ui/primitives';
import { RoundedLogo } from '@/ui/assets';

const ShortcutKey = ({ label }: { label: string }) => (
  <div
    className={
      'min-w-[64px] px-4 py-[10px] rounded-[12px] ' +
      'border border-solid border-rabby-neutral-line bg-r-neutral-card-1 ' +
      'text-center text-[16px] font-semibold text-r-neutral-title1 shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
    }
  >
    {label}
  </div>
);

export const ReadyToUse = () => {
  const shortcutKeys = useMemo(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    return isMac ? ['Shift', 'Cmd', 'R'] : ['Shift', 'Ctrl', 'R'];
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Shift+Command+R on macOS or Shift+Ctrl+R on Windows
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const isShiftR = event.shiftKey && event.code === 'KeyR';

      if (isMac && isShiftR && event.metaKey) {
        event.preventDefault();
        window.close();
      } else if (!isMac && isShiftR && event.ctrlKey) {
        event.preventDefault();
        window.close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Card className="mx-[22px]">
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <img
          src={RoundedLogo}
          alt="Rampnow logo"
          className="w-[48px] h-[48px] mb-6"
        />

        <div className="text-[24px] font-semibold text-r-neutral-title1">
          Your Rampnow wallet is ready
        </div>

        <div className="mt-8 flex items-center gap-3">
          {shortcutKeys.map((key) => (
            <ShortcutKey key={key} label={key} />
          ))}
        </div>

        <div className="mt-4 text-[14px] text-r-neutral-body max-w-[280px]">
          Try pressing the shortcut to quickly open the wallet.
        </div>
        <footer className="w-full mt-auto">
          <Button
            onClick={() => window.close()}
            className={
              'mt-8 w-full h-[56px] rounded-[12px] text-[17px] font-medium shadow-none'
            }
          >
            Open Rampnow Wallet
          </Button>
        </footer>
      </div>
    </Card>
  );
};
