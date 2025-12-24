import React from 'react';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { ReactComponent as IconDotCC } from '@/ui/assets/new-user-import/dot-cc.svg';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/ui/utils';
import { useAsync } from 'react-use';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { ReactComponent as RcIconTips } from '@/ui/assets/new-user-import/tips.svg';
import { Button } from '@repo/ui/primitives';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';

export const CreateSeedPhrase = () => {
  const { t } = useTranslation();

  const history = useHistory();

  const { setStore } = useNewUserGuideStore();

  const tipList = React.useMemo(
    () => [
      t('page.newUserImport.createNewAddress.tip1'),
      t('page.newUserImport.createNewAddress.tip2'),
      t('page.newUserImport.createNewAddress.tip3'),
    ],
    []
  );

  const wallet = useWallet();

  const { value } = useAsync(async () => wallet.generateMnemonic(), []);

  const showSeedPhrase = () => {
    if (value) {
      setStore({
        seedPhrase: value,
        passphrase: '',
      });
      history.push('/new-user/backup-seed-phrase');
    }
  };

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            if (history.length) {
              history.goBack();
            } else {
              history.replace('/new-user/guide');
            }
          }}
        />
        <SectionHeader
          className="text-center"
          title={t('page.newUserImport.createNewAddress.title')}
          description={t('page.newUserImport.createNewAddress.desc')}
        />
        <Content>
          <div className="flex flex-col gap-16">
            {tipList.map((item, index) => (
              <div
                key={item}
                className={clsx('flex justify-start gap-2', 'px-12')}
              >
                <IconDotCC
                  className="mt-6 text-rabby-blue-default flex-shrink-0"
                  viewBox="0 0 8 8"
                />
                <span className="text-15 text-r-neutral-title1 font-normal">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </Content>
        <Action>
          <Button onClick={showSeedPhrase} className="w-full">
            {t('page.newUserImport.createNewAddress.showSeedPhrase')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
