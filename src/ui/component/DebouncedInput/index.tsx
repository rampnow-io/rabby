import React from 'react';

import useDebounceValue from '@/ui/hooks/useDebounceValue';
import { Input } from '@repo/ui/primitives';

/**
 * @description same as antd's Input, but with debounce
 */
const DebouncedInput = React.forwardRef(
  (
    {
      debounce = 250,
      ...props
    }: Omit<
      React.ComponentPropsWithoutRef<typeof Input>,
      'value' | 'onChange'
    > & {
      value?: string;
      onChange?: (value: string) => any;
      debounce?: number;
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const [value, _setValue] = React.useState<string>(props.value || '');

    React.useEffect(() => {
      _setValue(props.value || '');
    }, [props.value]);

    React.useEffect(() => {
      if (props.autoFocus) inputRef.current?.focus();
    }, [props.autoFocus]);

    const debouncedValue = useDebounceValue(value, debounce);
    React.useEffect(() => {
      props.onChange?.(debouncedValue);
    }, [debouncedValue]);

    return (
      <Input
        {...props}
        className={'border-none p-0 outline-none'}
        ref={inputRef}
        value={value}
        onChange={(evt) => {
          _setValue(evt.target.value || '');
        }}
      />
    );
  }
);

export default DebouncedInput;
