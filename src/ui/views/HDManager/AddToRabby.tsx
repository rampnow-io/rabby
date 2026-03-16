import React from 'react';
import RcSwitch from 'rc-switch';
import { ReactComponent as LoadingSVG } from '@/ui/assets/swap/loading.svg';

interface Props {
  onChange?: (value: boolean) => Promise<void>;
  checked?: boolean;
}
export const AddToRabby: React.FC<Props> = ({ checked, onChange }) => {
  const [locked, setLocked] = React.useState(false);

  const handleOnChange = React.useCallback(async (value: boolean) => {
    setLocked(true);
    await onChange?.(value);
    setLocked(false);
  }, []);
  return (
    <RcSwitch
      disabled={locked}
      onChange={handleOnChange}
      prefixCls="ant-switch"
      className="AddToRabby"
      checked={checked}
      loadingIcon={
        <div className="ant-switch-handle">
          {locked ? (
            <LoadingSVG className="icon-loading animate-spin" />
          ) : checked ? (
            <span
              className="icon"
              style={{
                display: 'block',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'var(--r-blue-default, #7084FF)',
              }}
            />
          ) : (
            <span
              className="icon"
              style={{
                display: 'block',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'var(--r-neutral-foot, #B0B8C5)',
              }}
            />
          )}
        </div>
      }
    />
  );
};
