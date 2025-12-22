import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';
import IconMaskIcon from '@/ui/assets/create-mnemonics/mask-lock.svg';
import { ReactComponent as RcIconCopyCC } from 'ui/assets/component/icon-copy-cc.svg';
import IconSuccess from 'ui/assets/success.svg';
import { message } from 'antd';
import { copyTextToClipboard } from '@/ui/utils/clipboard';
import clsx from 'clsx';
import WordsMatrix from '@/ui/component/WordsMatrix';
import { useHistory, useLocation } from 'react-router-dom';
import IconBack from 'ui/assets/back.svg';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { Slip39TextareaContainer } from './Slip39TextAreaContainer';
import { Popup } from '@/ui/component';
import QRCode from 'qrcode.react';
import { ReactComponent as RcIconQrCode } from 'ui/assets/qrcode-cc.svg';
import { usePopupContainer } from '@/ui/hooks/usePopupContainer';
import { Button } from '@repo/ui/primitives';

const AddressBackupMnemonics: React.FC<{
  isInModal?: boolean;
  onClose?(): void;
}> = ({ isInModal, onClose }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { state } = useLocation<{
    data: string;
    goBack?: boolean;
  }>();

  const data = state?.data;
  const [masked, setMasked] = useState(true);
  const { getContainer } = usePopupContainer();

  const onCopyMnemonics = React.useCallback(() => {
    copyTextToClipboard(data).then(() => {
      message.success({
        icon: <img src={IconSuccess} className="icon icon-success" />,
        content: t('global.copied'),
        duration: 0.5,
      });
    });
  }, [data, t]);

  const handleShowQrCode = () => {
    Popup.open({
      title: t('page.backupSeedPhrase.qrCodePopupTitle'),
      height: 476,
      closable: true,
      getContainer,
      content: (
        <div>
          <div className="flex items-start gap-8 px-[12px] py-[10px] rounded-[4px] bg-r-red-light text-r-red-default mb-[20px]">
            <InfoCircleOutlined className="rotate-180" />
            <div className="text-[14px] leading-[18px]">
              {t('page.backupSeedPhrase.qrCodePopupTips')}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="p-[12px] rounded-[16px] border-rabby-neutral-line border bg-white">
              <QRCode value={data} size={240} />
            </div>
          </div>
        </div>
      ),
    });
  };

  const isSlip39 = React.useMemo(() => data?.split('\n').length > 1, [data]);

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
        {!!state?.goBack && (
          <img
            src={IconBack}
            className="absolute icon icon-back  filter invert cursor-pointer"
            onClick={() => history.goBack()}
          />
        )}
        {t('page.backupSeedPhrase.title')}
      </header>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-auto px-4">
        <div className="alert mb-20">
          <InfoCircleOutlined className="rotate-180" />
          {t('page.backupSeedPhrase.alert')}
        </div>

        <div className="relative">
          {/* MASK */}
          <div
            onClick={() => setMasked(false)}
            className={clsx('mask', !masked && 'hidden')}
          >
            <img src={IconMaskIcon} className="w-[44px] h-[44px]" />
            <p className="mt-[16px] mb-0 text-white">
              {t('page.backupSeedPhrase.clickToShow')}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-[24px] justify-center mb-20">
            <div
              onClick={handleShowQrCode}
              className={clsx(
                'copy text-r-neutral-foot cursor-pointer',
                masked ? 'invisible' : 'visible'
              )}
            >
              <ThemeIcon src={RcIconQrCode} className="w-[16px] h-[16px]" />
              {t('page.backupSeedPhrase.showQrCode')}
            </div>

            <div
              onClick={onCopyMnemonics}
              className={clsx(
                'copy text-r-neutral-foot cursor-pointer',
                masked ? 'invisible' : 'visible'
              )}
            >
              <ThemeIcon src={RcIconCopyCC} className="w-[16px] h-[16px]" />
              {t('page.backupSeedPhrase.copySeedPhrase')}
            </div>
          </div>

          {/* SEED CONTENT */}
          <div
            className="rounded-[6px] w-full"
            style={masked ? { filter: 'blur(3px)' } : {}}
          >
            {isSlip39 ? (
              <Slip39TextareaContainer data={data} />
            ) : (
              <WordsMatrix
                className="w-full bg-r-neutral-card-2"
                focusable={false}
                closable={false}
                words={data.split(' ')}
              />
            )}
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="sticky bottom-0 w-full bg-white border-t p-4">
        <Button className="w-full h-[48px]" onClick={() => history.goBack()}>
          {t('global.Done')}
        </Button>
      </div>
    </div>
  );
};

export default AddressBackupMnemonics;
