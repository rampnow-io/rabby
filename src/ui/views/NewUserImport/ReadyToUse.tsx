import React, { useEffect, useMemo, useState } from 'react';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Button } from '@repo/ui/primitives';
import { RoundedLogo } from '@/ui/assets';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import { useWallet } from '@/ui/utils';
import { useRabbySelector } from '@/ui/store';
import { ConfettiFireworks } from '@repo/ui/components/confetti/fire-works';

const ShortcutKey = ({
  label,
  isActive,
}: {
  label: string;
  isActive: boolean;
}) => (
  <div
    className={
      'w-[110px] flex items-center justify-center h-[74px] rounded-[12px] ' +
      'border border-solid border-rabby-neutral-line bg-r-neutral-card-1 ' +
      'text-center text-[16px] font-semibold text-r-neutral-title1 shadow-[0_4px_12px_rgba(0,0,0,0.04)] ' +
      (isActive
        ? 'border border-[#7CFF6B] to-[#FFC857] text-white shadow-[0_0_0_2px_rgba(124,255,107,0.45)]'
        : '')
    }
  >
    {label}
  </div>
);

export const ReadyToUse = () => {
  const wallet = useWallet();
  const selectedColor = useRabbySelector((s) => s.newUserGuide.accountColor);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  }, []);
  const shortcutKeys = useMemo(() => {
    return [isMac ? 'Cmd' : 'Ctrl', 'Shift', 'R'];
  }, [isMac]);

  useEffect(() => {
    const keyToLabel = (event: KeyboardEvent) => {
      if (event.metaKey || event.key === 'Meta') return isMac ? 'Cmd' : 'Ctrl';
      if (event.ctrlKey || event.key === 'Control') return 'Ctrl';
      if (event.shiftKey || event.key === 'Shift') return 'Shift';
      if (event.key.toLowerCase() === 'r') return 'R';
      return null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const label = keyToLabel(event);
      if (!label) return;
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(label);
        return next;
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const label = keyToLabel(event);
      if (!label) return;
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(label);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleOpenWallet = async () => {
    // Save the selected color to the current account before closing
    if (selectedColor) {
      try {
        const currentAccount = await wallet.getCurrentAccount();
        if (currentAccount) {
          await wallet.updateAccountColor(
            currentAccount.address.toLowerCase(),
            selectedColor
          );
        }
      } catch (error) {
        console.error('Failed to save account color:', error);
      }
    }

    // Send message to background script to open side panel
    chrome.runtime.sendMessage({ type: 'SETUP_COMPLETE' }, () => {
      window.close();
    });
  };

  return (
    <ConfettiFireworks>
      <UiProvider>
        <Container>
          <HeaderNavPage />
          <Content>
            <div className="flex flex-col items-center gap-4">
              <img
                src={RoundedLogo}
                alt="Rampnow logo"
                className="w-[48px] h-[48px]"
              />
              <div className="flex flex-col items-center text-[24px] font-medium text-primary-foreground">
                <div>Your Rampnow wallet is</div>
                <div className=" text-primary">ready 🎉</div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {shortcutKeys.map((key) => (
                  <ShortcutKey
                    key={key}
                    label={key}
                    isActive={activeKeys.has(key)}
                  />
                ))}
              </div>

              <div className="text-xs text-center text-[#454745]">
                Try pressing the shortcut key to quickly open the wallet. 👀
              </div>
            </div>
          </Content>
          <Action>
            <Button
              onClick={() => {
                handleOpenWallet();
              }}
            >
              Open Rampnow Wallet
            </Button>
          </Action>
        </Container>
      </UiProvider>
    </ConfettiFireworks>
  );
};
