import clsx from 'clsx';
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';

import { DARK_MODE_TYPE } from '@/constant';
import SystemIcon from '@/ui/assets/settings/theme-system.svg';
import LightIcon from '@/ui/assets/settings/theme-light.svg';
import DarkIcon from '@/ui/assets/settings/theme-dark.svg';
import { Button } from '@repo/ui/primitives';

export default function SwitchThemeModal({
  visible,
  onFinish,
  onCancel,
}: {
  visible: boolean;
  onFinish(): void;
  onCancel(): void;
}) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<DARK_MODE_TYPE | null>(
    null
  );

  const themeMode = useRabbySelector((state) => state.preference.themeMode);
  const dispatch = useRabbyDispatch();

  const handleCancel = useCallback(() => {
    setIsVisible(false);
    setSelectedTheme(null);
    setTimeout(() => {
      onCancel();
    }, 500);
  }, [onCancel]);

  const handleSelect = useCallback((value: DARK_MODE_TYPE) => {
    setSelectedTheme(value);
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedTheme) {
      try {
        // Dispatch the theme change - always dispatch when a theme is selected
        await (dispatch.preference as any).switchThemeMode(selectedTheme);

        // Close modal after successful change
        setIsVisible(false);
        setSelectedTheme(null);

        setTimeout(() => {
          onFinish();
        }, 500);
      } catch (error) {
        console.error('Failed to switch theme:', error);
        // Still close modal even if there's an error
        setIsVisible(false);
        setSelectedTheme(null);
        setTimeout(() => {
          onFinish();
        }, 500);
      }
    }
  }, [selectedTheme, dispatch, onFinish]);
  useEffect(() => {
    if (visible) {
      setSelectedTheme(themeMode);
      setTimeout(() => {
        setIsVisible(visible);
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [visible]);

  const themeOptions = [
    {
      id: 'system',
      code: DARK_MODE_TYPE.system,
      label: 'System',
      icon: SystemIcon,
    },
    {
      id: 'light',
      code: DARK_MODE_TYPE.light,
      label: 'Light',
      icon: LightIcon,
    },
    {
      id: 'dark',
      code: DARK_MODE_TYPE.dark,
      label: 'Dark',
      icon: DarkIcon,
    },
  ].filter((x) => x.code !== DARK_MODE_TYPE.system || !!process.env.DEBUG);

  return (
    <BottomFloatingSheet
      open={isVisible}
      onClose={handleCancel}
      hideCloseButton
    >
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-xl font-medium text-primary-foreground  mb-6">
          Select Appearance
        </h2>

        <div className="flex gap-4 justify-center mb-6">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.code)}
              className={clsx(
                'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all',
                selectedTheme === option.code
                  ? 'border-3 border-primary ring-2 ring-primary-foreground/30'
                  : 'border-2 border-r-neutral-line hover:border-r-neutral-title-1'
              )}
            >
              <img
                src={option.icon}
                alt={option.label}
                className="w-20 h-24 object-contain rounded-lg"
              />
              <span className="text-sm font-medium text-r-neutral-title-1">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleSave}
          disabled={!selectedTheme}
        >
          Save
        </Button>
      </div>
    </BottomFloatingSheet>
  );
}
