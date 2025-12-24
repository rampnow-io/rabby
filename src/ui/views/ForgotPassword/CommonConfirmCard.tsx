import { UiProvider } from '@/ui/component/NewUserImport';
import React from 'react';
import clsx from 'clsx';
import { Button } from '@repo/ui/primitives';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import { A } from 'ts-toolbelt';
import SectionHeader from '@/ui/component/section-header/section-header';

export const CommonConfirmCard: React.FC<{
  hasStep?: boolean;
  onNext: () => void;
  logoClassName?: string;
  logo?: React.ReactNode;
  titleText?: string;
  descriptionText?: string;
  buttonText?: string;
}> = ({
  hasStep = false,
  onNext,
  logoClassName,
  logo,
  titleText,
  descriptionText,
  buttonText,
}) => {
  return (
    <UiProvider>
      <Container>
        <HeaderNavPage />
        <Content>
          <div className={clsx('w-80 m-auto', logoClassName)}>{logo}</div>

          <SectionHeader
            className="text-center"
            title={titleText!}
            description={descriptionText!}
          />
        </Content>
        <Action>
          <Button
            onClick={onNext}
            className={clsx(
              'h-[48px] shadow-none rounded-[6px]',
              'text-[15px] font-medium'
            )}
          >
            {buttonText}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
