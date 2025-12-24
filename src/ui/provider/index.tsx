import { Wrapper } from '@repo/ui';
import { cn } from '@repo/utils/string';
import React from 'react';

interface Props {
  children?: React.ReactNode;
  isOnboarding?: boolean;
}

const onboardingClass = 'lg:!h-[583px] lg:!w-[458px]';
const normalClass = 'lg:!h-full lg:!w-full lg:!absolute';

export function UIContainer({ children, isOnboarding = false }: Props) {
  return (
    <Wrapper className={cn(isOnboarding ? onboardingClass : normalClass)}>
      {children}
    </Wrapper>
  );
}
