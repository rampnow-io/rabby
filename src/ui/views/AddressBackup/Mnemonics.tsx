import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';
import IconSuccess from 'ui/assets/success.svg';
import { message } from 'antd';
import { copyTextToClipboard } from '@/ui/utils/clipboard';
import WordsMatrix from '@/ui/component/WordsMatrix';
import { useHistory, useLocation } from 'react-router-dom';
import { Slip39TextareaContainer } from './Slip39TextAreaContainer';
import { HeaderNavPage, Popup } from '@/ui/component';
import QRCode from 'qrcode.react';
import { usePopupContainer } from '@/ui/hooks/usePopupContainer';
import { Button, Copy } from '@repo/ui/primitives';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';
import MaskModal from './components/mask-modal';

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

  const isSlip39 = React.useMemo(() => data?.split('\n').length > 1, [data]);

  useEffect(() => {
    if (!data) {
      isInModal ? onClose?.() : history.goBack();
    }
  }, [data, history, isInModal, onClose]);

  if (!data) return null;

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            if (history.length) {
              history.push('/');
            }
          }}
        >
          <div className="text-primary-foreground text-xl font-normal">
            Secret recovery phrase
          </div>
        </HeaderNavPage>
        <Content>
          <div className="">
            {/* SEED CONTENT */}
            <div
              className="rounded-[6px] w-full"
              style={masked ? { filter: 'blur(3px)' } : {}}
            >
              {isSlip39 ? (
                <Slip39TextareaContainer data={data} />
              ) : (
                <WordsMatrix
                  className="w-full "
                  focusable={false}
                  closable={false}
                  words={data.split(' ')}
                />
              )}
            </div>
            <div className="flex justify-center gap-1 mt-6">
              <p className="text-primary-foreground text-[14px]">
                copy to clipboard
              </p>
              <Copy value={`${data}`} />
            </div>
          </div>
        </Content>
        <Action className="gap-2">
          <p className="text-secondary-foreground text-xs text-center">
            Just make sure nobody’s looking! 👀
          </p>
          <Button onClick={() => history.goBack()}>{t('global.Done')}</Button>
        </Action>
      </Container>
      <MaskModal onView={() => setMasked(false)} />
    </UiProvider>
  );
};

export default AddressBackupMnemonics;
