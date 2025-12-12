import React from 'react';
import { Card } from '@/ui/component/NewUserImport';
import rabbyLogo from '@/ui/assets/unlock/rabby.svg';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BackgroundSVG from '@/ui/assets/new-user-import/background.svg';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { Button, ButtonType } from '@repo/ui/primitives';

export const Guide = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const gotoCreate = React.useCallback(() => {
    history.push('/new-user/create-seed-phrase');
  }, []);

  const gotoImport = React.useCallback(() => {
    history.push('/new-user/import-list');
  }, []);

  const { isDarkTheme } = useThemeMode();

  return (
    <Card
      cardStyle={
        isDarkTheme
          ? {}
          : {
              backgroundImage: `url(${BackgroundSVG})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }
      }
    >
      <div className="flex flex-col w-full items-center">
        <img src={rabbyLogo} className="mt-[100px] w-[100px] h-[100px]" />
        <div className="my-12 text-24 font-medium text-r-neutral-title1">
          {t('page.newUserImport.guide.title')}
        </div>
        <div className="max-w-[320px] text-14 font-normal text-r-neutral-foot text-center">
          {t('page.newUserImport.guide.desc')}
        </div>

        <Button onClick={gotoCreate} className="w-full">
          {t('page.newUserImport.guide.createNewAddress')}
        </Button>

        <Button
          onClick={gotoImport}
          buttonType={ButtonType.SECONDARY}
          className="w-full"
        >
          {t('page.newUserImport.guide.importAddress')}
        </Button>
      </div>
    </Card>
  );
};
