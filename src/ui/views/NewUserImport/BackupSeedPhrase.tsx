import React from 'react';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { Card } from '@/ui/component/NewUserImport';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import WordsMatrix from '@/ui/component/WordsMatrix';
import { copyTextToClipboard } from '@/ui/utils/clipboard';
import IconSuccess from '@/ui/assets/success.svg';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { IconCopyCC } from 'ui/assets/component/IconCopyCC';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { Button } from '@repo/ui/primitives';

export const BackupSeedPhrase = () => {
  const { t } = useTranslation();

  const history = useHistory();

  const { store, setStore } = useNewUserGuideStore();

  const mnemonics = React.useMemo(() => store.seedPhrase, [store.seedPhrase]);

  const onCopyMnemonics = React.useCallback(() => {
    mnemonics &&
      copyTextToClipboard(mnemonics).then(() => {
        message.success({
          icon: <img src={IconSuccess} className="icon icon-success" />,
          content: t('global.copied'),
          duration: 0.5,
        });
      });
  }, [mnemonics]);

  const handleNext = () => {
    setStore({
      seedPhrase: mnemonics,
      passphrase: '',
    });

    history.push('/new-user/import/seed-phrase/set-password?isCreated=true');
  };

  const { isDarkTheme } = useThemeMode();

  return (
    <Card
      onBack={() => {
        setStore({
          seedPhrase: '',
          passphrase: '',
        });
        if (history.length) {
          history.goBack();
        } else {
          history.replace('/new-user/create-seed-phrase');
        }
      }}
    >
      <div className="flex flex-col w-full items-center px-[10px] pb-[20px]">
        <div className="mt-[18px] mb-[9px] text-[28px] font-medium text-r-neutral-title1 text-center">
          {t('page.newAddress.seedPhrase.backup')}
        </div>
        <div className="text-[16px] text-primary-foreground font-normal text-center mb-20 mx-[10px]">
          {t('page.newAddress.seedPhrase.backupTips')}
        </div>

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
            'mx-auto mt-[24px] mb-[47px]',
            'cursor-pointer',
            'flex justify-center items-center gap-8',
            'text-14 font-medium text-primary-foreground',
            'hover:text-secondary-foreground'
          )}
          onClick={onCopyMnemonics}
        >
          <span>{t('page.newAddress.seedPhrase.copy')}</span>
          <IconCopyCC
            strokeColor={isDarkTheme ? '#030303' : 'white'}
            className="w-5 h-5 text-primary-foreground"
          />
        </div>
        <footer className="mt-auto w-full flex flex-col gap-2">
          <div className="text-[10px] font-medium text-r-neutral-title1 text-center">
            {t('page.newAddress.seedPhrase.backupTips2')}
          </div>
          <Button onClick={handleNext} className="w-full">
            {t('page.newAddress.seedPhrase.saved')}
          </Button>
        </footer>
      </div>
    </Card>
  );
};
