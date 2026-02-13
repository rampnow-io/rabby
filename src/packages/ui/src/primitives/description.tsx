import { cn } from '@repo/utils';
import React from 'react';

const Description = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-sm leading-[17px] text-secondary-foreground',
      className
    )}
    {...props}
  />
));
Description.displayName = 'Description';

export { Description };
