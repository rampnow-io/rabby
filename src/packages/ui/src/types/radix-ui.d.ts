/// <reference types="react" />

// Extend Radix UI component props to include children for React 19 compatibility
declare module '@radix-ui/react-popover' {
  import type { ReactNode, ComponentPropsWithoutRef } from 'react';
  
  interface PopoverTriggerProps extends ComponentPropsWithoutRef<'button'> {
    children?: ReactNode;
    asChild?: boolean;
  }
  
  interface PopoverContentProps extends ComponentPropsWithoutRef<'div'> {
    children?: ReactNode;
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
  }
}
