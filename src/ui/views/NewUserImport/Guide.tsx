import React from 'react';

import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, ButtonType, substituteLinks } from '@repo/ui/primitives';
import { Illustration } from '@/ui/assets';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';

export const Guide = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const gotoCreate = React.useCallback(() => {
    history.push('/new-user/import/seed-phrase/set-password?isCreated=true');
  }, []);

  const gotoImport = React.useCallback(() => {
    history.push('/new-user/import-list');
  }, []);

  return (
    <UiProvider>
      <Container>
        <Content>
          <img src={Illustration} className="mt-[-19px] w-[500px] h-[255px]" />
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="text-2xl font-medium text-primary-foreground text-center">
              {t('page.newUserImport.guide.title')}
            </div>
            <div className="max-w-[320px] text-sm font-medium text-[#71717A] text-center">
              {t('page.newUserImport.guide.desc')}
            </div>
          </div>
        </Content>
        <Action className="flex flex-col gap-3 items-center">
          <Button
            onClick={gotoCreate}
            className="w-full text-[16px] font-medium "
          >
            {t('page.newUserImport.guide.createNewAddress')}
          </Button>

          <Button
            onClick={gotoImport}
            buttonType={ButtonType.SECONDARY}
            className="w-full text-[16px] font-medium "
          >
            {t('page.newUserImport.guide.importAddress')}
          </Button>
          <div className="w-[200px] text-[8px] font-normal text-[#606060] text-center">
            {substituteLinks(
              'By continuing, you accept our {Terms & Conditions} and {Privacy Policy}.',
              {
                'Terms & Conditions': '#',
                'Privacy Policy': '#',
              }
            )}
          </div>
        </Action>
      </Container>
    </UiProvider>
  );
};
