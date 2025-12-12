import React, { useEffect, useRef } from 'react';
import { Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import IconArrowRight from 'ui/assets/arrow-right-gray.svg';
import { Button } from '@repo/ui/primitives';

const QRCodeCheckerDetail = ({
  visible,
  data,
  okText = 'Try Again',
  cancelText = 'Cancel',
  onOk,
  onCancel,
}: {
  visible: boolean;
  data: string;
  okText?: string;
  cancelText?: string;
  onOk(): void;
  onCancel(): void;
}) => {
  const inputEl = useRef<any>(null);
  const { t } = useTranslation();
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        if (inputEl.current) {
          inputEl.current.focus();
        }
      }, 100);
    }
  }, [visible]);

  return (
    <Drawer
      title="Error"
      placement="bottom"
      className="signature-qr-checker-drawer"
      visible={visible}
      destroyOnClose
      onClose={onCancel}
      height={620}
      closeIcon={
        <img src={IconArrowRight} className="w-14 icon icon-drawer-close" />
      }
    >
      <div className="signature-qr-checker-detail">
        <div className="container">{t(data)}</div>
        <div className="footer">
          <div className="buttons">
            <Button onClick={onCancel}>{cancelText}</Button>
            <Button onClick={onOk}>{okText}</Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default QRCodeCheckerDetail;
