import React, { useEffect } from 'react';
import WordsMatrix from '@/ui/component/WordsMatrix';
import clsx from 'clsx';
import { connectStore, useRabbyDispatch, useRabbySelector } from 'ui/store';
import { useWallet } from 'ui/utils';
import { IconCopyCC } from 'ui/assets/component/IconCopyCC';
import { Copy as CopyIcon } from 'lucide-react';
import IconSuccess from 'ui/assets/success.svg';
import { message } from 'antd';
import { copyTextToClipboard } from '@/ui/utils/clipboard';
import { KEYRING_CLASS } from '@/constant';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { Button } from '@repo/ui/primitives';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';

const DisplayMnemonic = () => {
  const dispatch = useRabbyDispatch();
  const wallet = useWallet();
  useEffect(() => {
    dispatch.createMnemonics.prepareMnemonicsAsync();
  }, []);
  const history = useHistory();
  const { t } = useTranslation();
  const { mnemonics } = useRabbySelector((s) => ({
    mnemonics: s.createMnemonics.mnemonics,
  }));

  const onCopyMnemonics = React.useCallback(() => {
    copyTextToClipboard(mnemonics).then(() => {
      message.success({
        icon: <img src={IconSuccess} className="icon icon-success" />,
        content: t('global.copied'),
        duration: 0.5,
      });
    });
  }, [mnemonics]);

  const { isDarkTheme } = useThemeMode();

  const onSubmit = React.useCallback(async () => {
    await wallet.createKeyringWithMnemonics(mnemonics);

    // Passphrase is not supported on new creation
    const keyring = await wallet.getKeyringByMnemonic(mnemonics, '');
    const keyringId = await wallet.getMnemonicKeyRingIdFromPublicKey(
      keyring!.publicKey!
    );
    dispatch.importMnemonics.switchKeyring({
      stashKeyringId: keyringId as number,
    });

    const accounts = await dispatch.importMnemonics.getAccounts({
      start: 0,
      end: 1,
    });
    await dispatch.importMnemonics.setSelectedAccounts([accounts[0].address]);
    await dispatch.importMnemonics.confirmAllImportingAccountsAsync();

    history.push({
      pathname: '/new-user/success',
      search: `?hd=${
        KEYRING_CLASS.MNEMONIC
      }&keyringId=${keyringId}&isCreated=${true}`,
    });
    dispatch.createMnemonics.reset();
  }, [mnemonics]);

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => dispatch.createMnemonics.stepTo('risk-check')}
        >
          <div className="text-primary-foreground text-xl font-medium">
            {t('page.newAddress.seedPhrase.backup')}
          </div>
        </HeaderNavPage>

        <Content>
          <div className="flex flex-col items-center gap-6 pt-5">
            {mnemonics && (
              <WordsMatrix
                focusable={false}
                closable={false}
                words={mnemonics.split(' ')}
                className="bg-transparent"
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
          <Button onClick={onSubmit}>
            {t('page.newAddress.seedPhrase.saved')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};

export default connectStore()(DisplayMnemonic);
