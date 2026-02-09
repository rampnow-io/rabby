import { Empty, Modal, Popup } from '@/ui/component';
import { message } from 'antd';
import { ConnectedSite } from 'background/service/permission';
import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { openInTab, useWallet } from 'ui/utils';
import ConnectionList from './ConnectionList';
import { useRabbyDispatch, useRabbySelector } from 'ui/store';
import clsx from 'clsx';
import { SvgIconCross } from '@/ui/assets';
import { Button } from '@repo/ui/primitives';
import { DisconnectModal } from './DisconnectModal';

interface RecentConnectionsProps {
  visible?: boolean;
  onClose?(): void;
  canBack?: boolean;
}

const RecentConnections = ({
  visible = false,
  onClose,
  canBack,
}: RecentConnectionsProps) => {
  const { t } = useTranslation();
  const dispatch = useRabbyDispatch();
  const connections = useRabbySelector((state) => state.permission.websites);

  const list = useMemo(() => {
    return connections.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [connections]);

  const pinnedList = useMemo(() => {
    return connections
      .filter((item) => item && item.isTop)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [connections]);

  const recentList = useMemo(() => {
    return connections.filter((item) => item && !item.isTop);
  }, [connections]);

  const handleClick = (connection: ConnectedSite) => {
    matomoRequestEvent({
      category: 'Dapps',
      action: 'openDapp',
      label: connection.origin,
      transport: 'beacon',
    });

    openInTab(connection.origin);
  };

  const handlePinChange = (item: ConnectedSite) => {
    if (item.isTop) {
      dispatch.permission.unpinWebsite(item.origin);
    } else {
      dispatch.permission.pinWebsite(item.origin);
    }
  };
  const handleRemove = async (origin: string) => {
    setSelectedOrigin(origin);
    setDisconnectModalVisible(true);
  };

  const handleDisconnectConfirm = async () => {
    if (!selectedOrigin) return;

    await dispatch.permission.removeWebsite(selectedOrigin);
    matomoRequestEvent({
      category: 'Dapps',
      action: 'disconnectDapp',
      label: selectedOrigin,
    });
    message.success({
      icon: <i />,
      content: (
        <span className="text-white">
          {t('page.dashboard.recentConnection.disconnected')}
        </span>
      ),
    });
  };

  const removeAll = async () => {
    try {
      await dispatch.permission.clearAll();
      matomoRequestEvent({
        category: 'Dapps',
        action: 'disconnectAllDapps',
      });
    } catch (e) {
      console.error(e);
    }
    message.success({
      icon: <i />,
      content: (
        <span className="text-white">
          {t('page.dashboard.recentConnection.disconnected')}
        </span>
      ),
    });
  };

  const handleRemoveAll = async () => {
    Modal.info({
      className: 'recent-connections-confirm-modal',
      centered: true,
      closable: true,
      okText: t('global.Confirm'),
      width: 360,
      onOk: removeAll,
      autoFocusButton: null,
      closeIcon: (
        <SvgIconCross className="w-14 fill-current text-r-neutral-body" />
      ),
      content: (
        <div>
          <div className="title">
            <Trans
              count={recentList.length}
              i18nKey="page.dashboard.recentConnection.disconnectRecentlyUsed.title"
            ></Trans>
          </div>
        </div>
      ),
    });
  };

  useEffect(() => {
    dispatch.permission.getWebsites();
  }, []);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-col h-full">
      {list?.length ? (
        <>
          <div className="flex-1 overflow-auto px-[16px] pt-[16px] space-y-[8px]">
            <ConnectionList
              onRemove={handleRemove}
              onClick={handleClick}
              onPin={handlePinChange}
              data={pinnedList}
            ></ConnectionList>
            <ConnectionList
              onRemove={handleRemove}
              onClick={handleClick}
              onPin={handlePinChange}
              data={recentList}
            ></ConnectionList>
          </div>
          {list?.length > 0 && (
            <footer
              className={clsx(
                'border-t-[0.5px] border-t-solid border-t-rabby-neutral-line px-[16px]',
                'py-[16px] bg-r-neutral-bg1'
              )}
            >
              <Button
                className="btn-disconnect-all w-full"
                onClick={handleRemoveAll}
              >
                {t('page.dashboard.recentConnection.disconnectAll')}
              </Button>
            </footer>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-r-neutral-body text-sm">
              {t('page.dashboard.recentConnection.noConnectedDapps')}
            </p>
          </div>
        </div>
      )}
      <DisconnectModal
        visible={disconnectModalVisible}
        origin={selectedOrigin || undefined}
        onConfirm={handleDisconnectConfirm}
        onCancel={() => {
          setDisconnectModalVisible(false);
          setSelectedOrigin(null);
        }}
      />
    </div>
  );
};

export const RecentConnectionsPopup: React.FC<RecentConnectionsProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Popup
      visible={visible}
      onClose={onClose}
      height={488}
      bodyStyle={{ height: '100%', padding: '0 20px 0 20px' }}
      destroyOnClose
      className="settings-popup-wrapper"
      isSupportDarkMode
    >
      <RecentConnections visible={visible} onClose={onClose} canBack={false} />
    </Popup>
  );
};
export default RecentConnections;
