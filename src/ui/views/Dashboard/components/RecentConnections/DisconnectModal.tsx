import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { Button } from '@repo/ui/primitives';

interface DisconnectModalProps {
  visible: boolean;
  origin?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({
  visible,
  origin,
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
      hideCloseButton
    >
      <div className="px-4 pt-6 pb-6">
        <h2 className="text-lg font-semibold text-primary-foreground mb-3">
          Disconnect App?
        </h2>
        {origin && (
          <p className="text-sm text-r-neutral-body mb-6 leading-5">
            Are you sure you want to disconnect from{' '}
            <strong className="text-r-neutral-title-1">{origin}</strong>?
          </p>
        )}
        <div className="flex gap-3">
          <Button
            type="button"
            className="flex-1"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {t('global.cancel')}
          </Button>
          <Button type="button" className="flex-1" onClick={handleConfirm}>
            {t('global.Confirm')}
          </Button>
        </div>
      </div>
    </BottomFloatingSheet>
  );
};
