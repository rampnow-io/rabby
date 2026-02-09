import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { Button, ButtonType } from '@repo/ui/primitives';
import { FallbackSiteLogo } from '@/ui/component';
import { X } from 'lucide-react';

interface DisconnectModalProps {
  visible: boolean;
  origin?: string;
  icon?: string;
  lastUsed?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({
  visible,
  origin,
  icon,
  lastUsed,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [visible]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsVisible(false);
      setTimeout(() => {
        onCancel();
      }, 500);
    } catch (error) {
      console.error('Disconnect failed:', error);
      setIsLoading(false);
    }
  }, [onConfirm, onCancel]);

  const handleCancel = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onCancel();
    }, 500);
  }, [onCancel]);

  return (
    <BottomFloatingSheet
      open={isVisible}
      onClose={handleCancel}
      contentClassName="!px-2 !pt-2 !pb-2"
      hideCloseButton
    >
      <div className="w-full flex flex-col">
        {/* Header with title and close button */}
        <div className="flex justify-between items-center px-4 pt-4 pb-4 ">
          <h1 className="text-lg font-medium text-primary-foreground">
            {origin || 'Unknown'}
          </h1>

          <X
            size={16}
            onClick={handleCancel}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          />
        </div>

        {/* Content */}
        <div className="px-4 pt-6 pb-6 flex flex-col">
          {/* Icon and App Info */}
          <div className="flex flex-col gap-3 mb-6">
            {icon && (
              <FallbackSiteLogo
                url={icon}
                origin={origin || 'Unknown'}
                width="40px"
                style={{
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                }}
              />
            )}
            <p className="text-sm text-r-neutral-body">App Info</p>
          </div>

          {/* Information Table */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-start">
              <span className="text-sm text-r-neutral-body">URL</span>
              <a
                href={origin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-secondary-foreground font-medium underline truncate ml-4 hover:text-blue-600"
              >
                {origin || 'Unknown'}
              </a>
            </div>
          </div>

          {/* Disconnect Button - Outlined style */}
          <Button
            type="button"
            className="w-full border border-r-red-default text-r-red-default "
            buttonType={ButtonType.SECONDARY}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Disconnect'}
          </Button>
        </div>
      </div>
    </BottomFloatingSheet>
  );
};
