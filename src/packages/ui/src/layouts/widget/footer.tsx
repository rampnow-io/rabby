import { cn } from '@repo/utils';
import React from 'react';

const Footer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn('flex flex-row justify-center py-2', className)}
    {...props}
  />
));
Footer.displayName = 'Footer';

export default Footer;
