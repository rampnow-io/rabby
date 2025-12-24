import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { connectStore, useRabbyDispatch } from 'ui/store';
import { Button } from '@repo/ui/primitives';
import { ReactComponent as RcIconTips } from '@/ui/assets/new-user-import/tips.svg';
import { ReactComponent as IconDotCC } from '@/ui/assets/new-user-import/dot-cc.svg';
import { HeaderNavPage } from '@/ui/component';
import { UiProvider } from '@/ui/component/NewUserImport';
import SectionHeader from '@/ui/component/section-header/section-header';
import { Action, Content } from '@repo/ui';

function useQuestionsCheck() {
  const { t } = useTranslation();

  const QUESTIONS = React.useMemo(() => {
    return [
      {
        index: 1 as const,
        content: t('page.newAddress.seedPhrase.importQuestion1'),
      },
      {
        index: 2 as const,
        content: t('page.newAddress.seedPhrase.importQuestion2'),
      },
      {
        index: 3 as const,
        content: t('page.newAddress.seedPhrase.importQuestion3'),
      },
    ];
  }, []);

  return {
    questionChecks: QUESTIONS,
  };
}

const RiskCheck = () => {
  const dispatch = useRabbyDispatch();
  const { t } = useTranslation();
  const { questionChecks } = useQuestionsCheck();

  return (
    <UiProvider>
      <HeaderNavPage>
        {t('page.newUserImport.createNewAddress.title')}
      </HeaderNavPage>

      <SectionHeader
        className="text-center"
        title={t('page.newUserImport.createNewAddress.title')}
        description={t('page.newUserImport.createNewAddress.desc')}
      />
      <Content>
        <div className="flex flex-col gap-16">
          {questionChecks.map((item, index) => (
            <div
              key={item.index}
              className={clsx('flex justify-start gap-8', 'px-12')}
            >
              <IconDotCC
                className="mt-6 text-rabby-blue-default flex-shrink-0"
                viewBox="0 0 8 8"
              />
              <span className="text-15 text-r-neutral-title1 font-normal">
                {item.content}
              </span>
            </div>
          ))}
        </div>
      </Content>
      <Action>
        <Button
          onClick={() => dispatch.createMnemonics.stepTo('display')}
          className={clsx(
            'mt-[76px] h-[56px] shadow-none rounded-[8px]',
            'text-[17px] font-medium bg-r-blue-default',
            'w-full'
          )}
        >
          {t('page.newUserImport.createNewAddress.showSeedPhrase')}
        </Button>
      </Action>
    </UiProvider>
  );
};

export default connectStore()(RiskCheck);
