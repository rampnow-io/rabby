import React, { ReactNode, SyntheticEvent, useEffect, useState } from 'react';
import cx from 'clsx';
import IconCheck from 'ui/assets/check.svg';
import clsx from 'clsx';
import ThemeIcon from '../ThemeMode/ThemeIcon';

interface CheckboxProps {
  checked: boolean;
  defaultChecked?: boolean;
  onChange?(checked: boolean): void;
  background?: string;
  unCheckBackground?: string;
  width?: string;
  height?: string;
  className?: string;
  checkBoxClassName?: string;
  children?: ReactNode;
  checkIcon?: ReactNode;
  type?: 'circle' | 'square';
}

const Checkbox = ({
  checked,
  onChange,
  defaultChecked = false,
  background = 'var(--r-blue-default, #7084ff)',
  unCheckBackground = 'var(--r-neutral-line, #D3D8E0)',
  type = 'circle',
  width = '16px',
  height = '16px',
  checkBoxClassName,
  className,
  children,
  checkIcon,
}: CheckboxProps) => {
  const [checkState, setCheckState] = useState(defaultChecked);

  useEffect(() => {
    setCheckState(checked);
  }, [checked]);

  const handleValueChange = (e: SyntheticEvent, checked) => {
    e.stopPropagation();
    onChange && onChange(checked);
  };

  return (
    <div
      className={cx(
        'flex items-center gap-[8px] cursor-pointer',
        checkState && 'checked',
        className
      )}
      onClick={(e) => handleValueChange(e, !checkState)}
    >
      <div
        className={clsx(
          'flex items-center justify-center flex-shrink-0',
          type === 'circle' ? 'rounded-full' : 'rounded-[4px]',
          checkBoxClassName
        )}
        style={{
          width,
          height,
          backgroundColor: checkState ? background : unCheckBackground,
        }}
      >
        {checkIcon ?? (
          <ThemeIcon src={IconCheck} className="w-[12px] h-[12px]" />
        )}
      </div>
      {children && (
        <div className="flex-1 text-[14px] text-r-neutral-title-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default Checkbox;
