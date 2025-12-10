import { cn } from '@repo/utils';
import React from 'react';

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex h-full flex-col bg-[#FFFFFF]', className)}
      {...props}
    >
      {children}
    </div>
  );
});
Container.displayName = 'Container';

export default Container;
