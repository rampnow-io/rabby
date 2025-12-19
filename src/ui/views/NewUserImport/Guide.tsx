import React from 'react';
import { Card } from '@/ui/component/NewUserImport';
import rabbyLogo from '@/ui/assets/unlock/rabby.svg';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BackgroundSVG from '@/ui/assets/new-user-import/background.svg';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { Button, ButtonType } from '@repo/ui/primitives';
import { Illustration } from '@/ui/assets';

export const Guide = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const gotoCreate = React.useCallback(() => {
    history.push('/new-user/create-seed-phrase');
  }, []);

  const gotoImport = React.useCallback(() => {
    history.push('/new-user/import-list');
  }, []);

  return (
    <Card>
      <div className="flex flex-col w-full items-center px-[10px] pb-[20px]">
        <img src={Illustration} className="mt-[-19px] w-[500px] h-[255px]" />
        <div className="flex flex-col gap-3 mb-10">
          <div className="text-[28px] font-semibold text-r-neutral-title1 text-center">
            {t('page.newUserImport.guide.title')}
          </div>
          <div className="max-w-[320px] text-[14px] font-normal text-r-neutral-body text-center">
            {t('page.newUserImport.guide.desc')}
          </div>
        </div>
        <footer className="mt-auto w-full">
          <div className="flex flex-col items-center w-full gap-4">
            <Button
              onClick={gotoCreate}
              className="w-full text-[16px] font-medium h-12"
            >
              {t('page.newUserImport.guide.createNewAddress')}
            </Button>

            <Button
              onClick={gotoImport}
              buttonType={ButtonType.SECONDARY}
              className="w-full text-[16px] font-medium h-12"
            >
              {t('page.newUserImport.guide.importAddress')}
            </Button>
            <div className="max-w-[320px] text-[14px] font-normal text-r-neutral-body text-center">
              {t('page.newUserImport.guide.terms')}{' '}
            </div>
          </div>
        </footer>
      </div>
    </Card>
  );
};
