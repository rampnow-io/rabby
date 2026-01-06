import { matomoRequestEvent } from '@/utils/matomo-request';
import clsx from 'clsx';
import { KEYRING_TYPE, ThemeIconType } from 'consts';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useInterval } from 'react-use';
import { AddressViewer } from 'ui/component';
import { useRabbyDispatch } from 'ui/store';
import { useWallet } from 'ui/utils';
import { getKRCategoryByType } from '@/utils/transaction';
import {
  RcIconSettingCC,
  RcIconReceiveCC,
  RcIconSendCC,
  RcIconSwapCC,
  RcIconBuyCC,
} from 'ui/assets/dashboard/panel';
import { RcIconExternal1CC } from '@/ui/assets/dashboard';
import { CommonSignal } from '@/ui/component/ConnectStatus/CommonSignal';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { copyAddress } from '@/ui/utils/clipboard';
import { ga4 } from '@/utils/ga4';
import { useMemoizedFn } from 'ahooks';
import { BalanceView } from '../BalanceView/BalanceView';
import { useHomeBalanceViewOuterPrefetch } from '../BalanceView/useHomeBalanceView';
import { Badge, Tooltip } from 'antd';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { CurrentConnection } from '../CurrentConnection';
import IconAlertRed from 'ui/assets/alert-red.svg';

type IPanelItem = {
  icon: ThemeIconType;
  content: string;
  onClick: React.MouseEventHandler<HTMLElement>;
  badge?: number;
  badgeAlert?: boolean;
  badgeClassName?: string;
  iconSpin?: boolean;
  hideForGnosis?: boolean;
  showAlert?: boolean;
  disabled?: boolean;
  commingSoonBadge?: boolean;
  disableReason?: string;
  eventKey: string;
  iconClassName?: string;
  subContent?: React.ReactNode;
  isFullscreen?: boolean;
};

export const DashboardHeader: React.FC<{ onSettingClick?(): void }> = ({
  onSettingClick,
}) => {
  const history = useHistory();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const { isDarkTheme } = useThemeMode();
  const currentAccount = useCurrentAccount();

  const isGnosis = currentAccount?.type === KEYRING_TYPE.GnosisKeyring;

  useInterval(() => {
    if (!currentAccount || isGnosis) return;
    dispatch.transactions.getPendingTxCountAsync(currentAccount.address);
  }, 30000);

  useEffect(() => {
    if (!currentAccount) return;

    if (!isGnosis) {
      dispatch.transactions.getPendingTxCountAsync(currentAccount.address);
    }

    wallet.getAlianName(currentAccount.address.toLowerCase()).then((name) => {
      dispatch.account.setField({ alianName: name });
      setDisplayName(name || '');
    });
  }, [currentAccount]);

  const { dashboardBalanceCacheInited } = useHomeBalanceViewOuterPrefetch(
    currentAccount?.address
  );

  const handleSwitchAddress = useMemoizedFn(() => {
    matomoRequestEvent({
      category: 'Front Page Click',
      action: 'Click',
      label: 'Change Address',
    });

    ga4.fireEvent('Click_ChangeAddress', {
      event_category: 'Front Page Click',
    });

    history.push('/switch-address');
  });

  const panelItems: Record<'receive' | 'send' | 'swap' | 'buy', IPanelItem> = {
    receive: {
      icon: RcIconReceiveCC,
      eventKey: 'Receive',
      content: t('page.dashboard.home.panel.receive'),
      onClick: () => history.push('/receive'),
    },
    send: {
      icon: RcIconSendCC,
      eventKey: 'Send',
      content: t('page.dashboard.home.panel.send'),
      onClick: () => history.push('/send-token?rbisource=dashboard'),
    },
    swap: {
      icon: RcIconSwapCC,
      eventKey: 'Swap',
      content: t('page.dashboard.home.panel.swap'),
      onClick: () => history.push('/dex-swap?rbisource=dashboard'),
    },
    buy: {
      icon: RcIconBuyCC,
      eventKey: 'Buy',
      content: t('page.dashboard.home.panel.buy'),
      onClick: () => history.push('/buy'),
    },
  };

  const pickedPanelKeys = useMemo(
    () => ['receive', 'send', 'swap', 'buy'] as const,
    []
  );

  return (
    <div className="w-full bg-white pt-[60px] px-4 pb-4 rounded-b-[24px]">
      {/* Top Right */}

      {/* Account */}
      {currentAccount && (
        <div className="flex justify-between">
          <div className="flex items-center gap-2 p-2 rounded-full bg-black/[0.02] max-w-[200px]">
            <div
              onClick={() => {
                copyAddress(currentAccount.address);
                matomoRequestEvent({
                  category: 'AccountInfo',
                  action: 'headCopyAddress',
                  label: [
                    getKRCategoryByType(currentAccount.type),
                    currentAccount.brandName,
                  ].join('|'),
                });
              }}
              className="h-10 w-10 flex items-center justify-center rounded-full cursor-pointer
                       bg-gradient-to-br from-[#BFDBFE] to-[#0071FF]"
            >
              👀
            </div>

            <div
              onClick={handleSwitchAddress}
              className="flex flex-col justify-start cursor-pointer pr-2"
            >
              {/* <CommonSignal
              type={currentAccount.type}
              brandName={currentAccount.brandName}
              address={currentAccount.address}
            /> */}
              <div
                className="text-[13px] text-secondary-foreground font-medium truncate max-w-[86px]"
                title={displayName}
              >
                {displayName}
              </div>
              <AddressViewer
                address={currentAccount.address}
                showArrow={false}
              />
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <div className="rounded cursor-pointer ">
              <CurrentConnection />
            </div>
            <div className="cursor-pointer rounded " onClick={onSettingClick}>
              <RcIconSettingCC />
            </div>
          </div>
        </div>
      )}

      {dashboardBalanceCacheInited && (
        <BalanceView currentAccount={currentAccount} />
      )}

      {/* Panels */}
      <div
        className={clsx(
          'relative grid grid-cols-4 gap-2 overflow-auto',
          isDarkTheme && 'bg-[#292B39]'
        )}
      >
        {pickedPanelKeys.map((key) => {
          const item = panelItems[key];
          if (item.hideForGnosis && isGnosis) return null;

          return (
            <div
              key={key}
              onClick={(e) => {
                matomoRequestEvent({
                  category: 'Dashboard',
                  action: 'clickEntry',
                  label: item.eventKey,
                });
                ga4.fireEvent(`Entry_${item.eventKey}`, {
                  event_category: 'Dashboard',
                });
                item.onClick(e);
              }}
              className="group h-[74px] cursor-pointer rounded-[16px]
                         border border-[var(--r-neutral-card2,#f2f4f7)]
                         bg-white hover:bg-[var(--r-neutral-card2,#f2f4f7)]
                         flex flex-col items-center justify-center relative"
            >
              {item.showAlert && (
                <ThemeIcon
                  src={IconAlertRed}
                  className="absolute right-2 top-2"
                />
              )}

              <ThemeIcon
                src={item.icon}
                className={clsx(
                  'w-6 h-6 mb-1',
                  item.iconSpin && 'animate-spin'
                )}
              />

              <div className="text-[13px] font-medium leading-4 text-center">
                {item.content}
              </div>

              {item.isFullscreen && (
                <div className="absolute top-1.5 right-1.5 opacity-50 hidden group-hover:block">
                  <RcIconExternal1CC />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
