import { Wrapper } from '@repo/ui';
import { cn } from '@repo/utils/string';
import React from 'react';

interface Props {
  children?: React.ReactNode;
  isOnboarding?: boolean;
}

const onboardingClass = 'lg:!h-[583px] lg:!w-[458px] lg:!rounded-[22px]';
const normalClass =
  'lg:!h-full lg:!w-full lg:!absolute lg:!min-w-[375px] lg:!overflow-x-auto';

export function UIContainer({ children, isOnboarding = false }: Props) {
  return (
    <Wrapper className={cn(isOnboarding ? onboardingClass : normalClass)}>
      {children}
    </Wrapper>
  );
}
