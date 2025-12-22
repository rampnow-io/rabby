import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';
import QRCode from 'qrcode.react';
import { useHistory, useLocation } from 'react-router-dom';
import clsx from 'clsx';

import IconMaskIcon from '@/ui/assets/create-mnemonics/mask-lock.svg';
import { ReactComponent as IconRcMask } from '@/ui/assets/create-mnemonics/mask-lock.svg';
import IconCopy from 'ui/assets/component/icon-copy.svg';

import { Copy } from 'ui/component';
import { Button } from '@repo/ui/primitives';

const AddressBackupPrivateKey: React.FC<{
  isInModal?: boolean;
  onClose?(): void;
}> = ({ isInModal, onClose }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { state } = useLocation<{ data: string }>();

  const data = state?.data;
  const [masked, setMasked] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!data) {
      isInModal ? onClose?.() : history.goBack();
    }
  }, [data, history, isInModal, onClose]);

  if (!data) return null;

  return (
    <div
      className={clsx(
        'page-address-backup flex flex-col h-full bg-white',
        isInModal && 'min-h-0 h-[600px]'
      )}
    >
      {/* ================= HEADER ================= */}
      <header className="shrink-0 px-4 py-3 text-center font-semibold text-[16px]">
        {t('page.backupPrivateKey.title')}
      </header>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-auto px-4 flex flex-col">
        {/* Alert */}
        <div className="alert mt-2 mb-4 text-[14px] leading-[18px]">
          <InfoCircleOutlined className="mr-1" />
          {t('page.backupPrivateKey.alert')}
        </div>

        {/* Center area */}
        <div className="relative flex-1 flex flex-col justify-center items-center">
          {/* QR MASK */}
          {masked && (
            <div
              onClick={() => setMasked(false)}
              className="
                absolute inset-0 z-10
                flex flex-col items-center justify-center
                rounded-[12px]
                bg-black/40
                cursor-pointer
              "
            >
              <img src={IconMaskIcon} className="w-[44px] h-[44px]" />
              <p className="mt-3 text-white text-[14px] text-center px-4">
                {t('page.backupPrivateKey.clickToShowQr')}
              </p>
            </div>
          )}

          {/* QR CODE */}
          <div
            className="p-3 rounded-[16px] bg-white border"
            style={masked ? { filter: 'blur(4px)' } : {}}
          >
            <QRCode value={data} size={200} />
          </div>

          {/* PRIVATE KEY SECTION */}
          <div className="w-full mt-6">
            {!showKey ? (
              <button
                onClick={() => setShowKey(true)}
                className="flex items-center gap-2 text-r-neutral-foot text-[14px]"
              >
                <IconRcMask width={20} height={20} />
                {t('page.backupPrivateKey.clickToShow')}
              </button>
            ) : (
              <div className="mt-3 p-3 rounded-[8px] bg-r-neutral-card-2">
                <p className="break-all text-[13px] leading-[18px]">{data}</p>
              </div>
            )}

            <div className="mt-3">
              <Copy icon={IconCopy} data={data} />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="sticky w-full bottom-0 bg-white border-t p-4">
        <Button className="w-full h-[48px]" onClick={() => history.goBack()}>
          {t('global.Done')}
        </Button>
      </div>
    </div>
  );
};

export default AddressBackupPrivateKey;
