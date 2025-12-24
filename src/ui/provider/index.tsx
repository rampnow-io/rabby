import { Wrapper } from '@repo/ui';
import React from 'react';

interface Props {
  children?: React.ReactNode;
}

export function UIContainer({ children }: Props) {
  return <Wrapper className="lg:!h-[583px] lg:!w-[458px]">{children}</Wrapper>;
}
