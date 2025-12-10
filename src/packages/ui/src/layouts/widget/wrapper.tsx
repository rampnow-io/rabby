import { Snackbar } from '@repo/ui';
import { cn } from '@repo/utils';
import React from 'react';

interface WrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
}

const Wrapper = React.forwardRef<HTMLDivElement, WrapperProps>(
  ({ className, header, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed flex h-full w-full flex-col overflow-hidden bg-white lg:!relative lg:!h-[720px] lg:!w-[500px] lg:rounded-[32px]',
        className
      )}
      data-modal-root
      {...props}
    >
      <div className="flex h-full flex-col">{children}</div>
      <Snackbar />
    </div>
  )
);
Wrapper.displayName = 'Wrapper';

export default Wrapper;
