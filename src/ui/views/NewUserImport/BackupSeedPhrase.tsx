import React from 'react';
import clsx from 'clsx';
import { Copy as CopyIcon } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import { UiProvider } from '@/ui/component/NewUserImport';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import WordsMatrix from '@/ui/component/WordsMatrix';
import { copyTextToClipboard } from '@/ui/utils/clipboard';
import IconSuccess from '@/ui/assets/success.svg';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { IconCopyCC } from 'ui/assets/component/IconCopyCC';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { Button, Copy } from '@repo/ui/primitives';
import { useWallet } from '@/ui/utils';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';

export const BackupSeedPhrase = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const { store, setStore } = useNewUserGuideStore();
  const { isDarkTheme } = useThemeMode();

  const mnemonics = store.seedPhrase;

  /**
   * 👉 Generate seed phrase on page load
   */
  React.useEffect(() => {
    if (!store.seedPhrase) {
      (async () => {
        const mnemonic = await wallet.generateMnemonic();
        setStore({
          seedPhrase: mnemonic,
          passphrase: '',
        });
      })();
    }
  }, [store.seedPhrase, setStore, wallet]);

  const onCopyMnemonics = React.useCallback(() => {
    if (!mnemonics) return;

    copyTextToClipboard(mnemonics).then(() => {
      message.success({
        icon: <img src={IconSuccess} className="icon icon-success" />,
        content: t('global.copied'),
        duration: 0.5,
      });
    });
  }, [mnemonics, t]);

  const handleNext = () => {
    history.push('/new-user/import/seed-phrase/set-password?isCreated=true');
  };

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            // optional: clear store if user goes back
            setStore({
              seedPhrase: '',
              passphrase: '',
            });

            if (history.length) {
              history.goBack();
            } else {
              history.replace('/new-user/guide');
            }
          }}
        />
        <SectionHeader
          className="flex flex-col items-center"
          title={t('page.newAddress.seedPhrase.backup')}
          description={t('page.newAddress.seedPhrase.backupTips')}
        />
        <Content>
          <div className="flex flex-col items-center gap-6">
            {mnemonics && (
              <WordsMatrix
                focusable={false}
                closable={false}
                words={mnemonics.split(' ')}
                className="bg-transparent w-full"
              />
            )}
            <div
              className={clsx(
                'cursor-pointer',
                'flex justify-center items-center gap-4'
              )}
              onClick={onCopyMnemonics}
            >
              <span>{t('page.newAddress.seedPhrase.copy')}</span>
              <CopyIcon className="h-3 w-3" />
            </div>
          </div>
        </Content>
        <Action className="flex flex-col gap-4">
          <div className="text-[10px] font-medium text-r-neutral-title1 text-center">
            {t('page.newAddress.seedPhrase.backupTips2')}
          </div>
          <Button onClick={handleNext} className="w-full">
            {t('page.newAddress.seedPhrase.saved')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
