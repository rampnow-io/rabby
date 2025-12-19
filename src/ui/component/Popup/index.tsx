import BottomDrawer from '@repo/ui/components/bottom-drawer';
import { DrawerProps } from 'antd';
import clsx from 'clsx';
import React, { ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ReactComponent as RcIconCloseCC } from 'ui/assets/component/close-cc.svg';

const closeIcon = (
  <RcIconCloseCC className="w-[20px] h-[20px] text-r-neutral-foot" />
);

export interface PopupProps extends DrawerProps {
  onCancel?(): void;
  children?: ReactNode;
  isSupportDarkMode?: boolean;
  isNew?: boolean;
  isLoading?: boolean;
}

const Popup = ({
  children,
  closable = false,
  placement = 'bottom',
  className,
  onClose,
  onCancel,
  isSupportDarkMode,
  isNew,
  closeIcon: customCloseIcon,
  bodyStyle,
  headerStyle,
  contentWrapperStyle,
  height,
  destroyOnClose = true,
  visible = false,
  title,
  afterVisibleChange,
}: PopupProps) => {
  const handleClose = (e?: any) => {
    onClose?.(e as any);
    onCancel?.();
  };

  if (!visible) {
    afterVisibleChange?.(false);
  }

  if (!visible) {
    return null;
  }
  afterVisibleChange?.(true);

  const containerStyle = useMemo(() => {
    const computedHeight = typeof height === 'number' ? `${height}px` : height;
    return {
      ...(computedHeight ? { height: computedHeight } : {}),
      ...contentWrapperStyle,
    } as React.CSSProperties;
  }, [height, contentWrapperStyle]);

  return (
    <BottomDrawer
      variant={placement === 'bottom' ? 'semi' : 'full'}
      rootSelector="root"
      close={handleClose}
      className={clsx(
        'custom-popup',
        isSupportDarkMode && 'is-support-darkmode',
        className,
        {
          'is-new': isNew,
        }
      )}
    >
      <div
        className="flex flex-col w-full overflow-hidden"
        style={containerStyle}
      >
        {(title || closable) && (
          <div
            className={clsx(
              'flex items-center justify-between px-20 pt-16 pb-12 border-b border-rabby-neutral-line'
            )}
            style={headerStyle}
          >
            {title &&
              (typeof title === 'string' ? (
                <h2 className="text-r-neutral-title-1 text-[20px] font-medium">
                  {title}
                </h2>
              ) : (
                title
              ))}
            {closable && (
              <button
                onClick={handleClose}
                className="p-0 border-0 bg-transparent cursor-pointer"
              >
                {(customCloseIcon as ReactNode) || closeIcon}
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto" style={bodyStyle}>
          {children}
        </div>
      </div>
    </BottomDrawer>
  );
};

const open = (
  config: PopupProps & {
    content?: ReactNode;
  }
) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  function destroy() {
    root.unmount();
    container.parentElement?.removeChild(container);
  }

  function render({
    visible = true,
    content,
    onClose,
    onCancel,
    ...props
  }: any) {
    setTimeout(() => {
      const handleCancel = () => {
        close && close();
        onClose && onClose();
        onCancel && onCancel();
      };
      root.render(
        <Popup visible={false} onClose={handleCancel} {...props}>
          {content}
        </Popup>
      );
      if (visible) {
        setTimeout(() => {
          root.render(
            <Popup visible={visible} onClose={handleCancel} {...props}>
              {content}
            </Popup>
          );
        });
      }
    });
  }

  function close() {
    render({
      visible: false,
      afterVisibleChange: (v) => {
        if (!v) {
          destroy();
        }
      },
    });
  }

  render(config);
  return {
    destroy: close,
  };
};

Popup.open = Popup.info = open;

export default Popup;
