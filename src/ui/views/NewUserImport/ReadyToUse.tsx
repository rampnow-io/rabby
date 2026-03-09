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
      'w-[110px] flex items-center justify-center h-[74px] rounded-[12px] transition-all duration-200 ' +
      'border border-solid bg-r-neutral-card-1 ' +
      'text-center text-[16px] font-semibold text-[#171923] ' +
      (isActive
        ? 'border-[#63BD4F] shadow-[0_0_22px_rgba(187,240,86,0.65)]'
        : 'border-rabby-neutral-line shadow-[0_4px_12px_rgba(0,0,0,0.04)]')
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
    return isMac ? ['Shift', 'Cmd', 'R'] : ['Shift', 'Ctrl', 'R'];
  }, [isMac]);

  useEffect(() => {
    const updateKeys = (event: KeyboardEvent) => {
      const next = new Set<string>();

      if (event.shiftKey) {
        next.add('Shift');
      }

      if (isMac) {
        if (event.metaKey) {
          next.add('Cmd');
        }
      } else {
        if (event.ctrlKey) {
          next.add('Ctrl');
        }
      }

      if (event.key.toLowerCase() === 'r') {
        next.add('R');
      }

      setActiveKeys(next);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      updateKeys(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      updateKeys(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMac]);

  const handleOpenWallet = async () => {
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
                <div className="inline-block bg-[linear-gradient(180deg,#B0D966_0%,#50BE3A_100%)] bg-clip-text text-transparent">
                  ready
                </div>
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
            <Button onClick={handleOpenWallet}>Open Rampnow Wallet</Button>
          </Action>
        </Container>
      </UiProvider>
    </ConfettiFireworks>
  );
};
