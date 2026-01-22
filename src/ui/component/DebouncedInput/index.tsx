import React from 'react';
import { Input, InputSize } from '@repo/ui/primitives';

const DebouncedInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> & {
    value?: string;
    onChange?: (value: string) => void;
  }
>(({ value = '', onChange, ...props }, ref) => {
  return (
    <Input
      {...props}
      subClassName="bg-transparent border-none"
      ref={ref}
      sizeVariant={InputSize.SM}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
});

export default DebouncedInput;
