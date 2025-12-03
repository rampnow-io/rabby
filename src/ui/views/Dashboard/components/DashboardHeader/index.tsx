import { matomoRequestEvent } from '@/utils/matomo-request';
import clsx from 'clsx';
import { KEYRING_TYPE, ThemeIconType } from 'consts';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useInterval } from 'react-use';
import { ReactComponent as RcIconCopy } from 'ui/assets/icon-copy-1.svg';

import { AddressViewer } from 'ui/component';
import { useRabbyDispatch } from 'ui/store';
import { useWallet } from 'ui/utils';

import { getKRCategoryByType } from '@/utils/transaction';

import IconAlertRed from 'ui/assets/alert-red.svg';

import {
  RcIconBridgeCC,
  RcIconSettingCC,
  RcIconReceiveCC,
  RcIconSendCC,
  RcIconSwapCC,
} from 'ui/assets/dashboard/panel';

import { RcIconExternal1CC } from '@/ui/assets/dashboard';
import { CommonSignal } from '@/ui/component/ConnectStatus/CommonSignal';
import { useWalletConnectIcon } from '@/ui/component/WalletConnect/useWalletConnectIcon';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { copyAddress } from '@/ui/utils/clipboard';
import { ga4 } from '@/utils/ga4';
import { useMemoizedFn } from 'ahooks';
import styled from 'styled-components';
import { ReactComponent as IconArrowRight } from 'ui/assets/dashboard/arrow-right.svg';
import { BalanceView } from '../BalanceView/BalanceView';
import { useHomeBalanceViewOuterPrefetch } from '../BalanceView/useHomeBalanceView';
import { Badge, Tooltip } from 'antd';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { CurrentConnection } from '../CurrentConnection';

const Container = styled.div`
  width: 100%;
  height: 235px;
  background: #ffff;
  position: relative;
  overflow: hidden;
  padding: 12px 16px;
`;

const HeaderWrap = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  overflow: auto;

  .panel-item {
    height: 70px;
    width: 100%;
    cursor: pointer;
    border-radius: 16px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--r-neutral-card2, #f2f4f7);

    &:hover {
      background: var(--r-blue-light1, #edf0ff);
    }

    &-icon {
      width: 24px;
      height: 24px;
      justify-self: center;
      margin-bottom: 6px;
      color: var(--r-neutral-title1, #192945);

      &.icon-spin {
        animation: icn-spin 1.5s linear infinite;
      }

      &.icon-rabby-mobile {
        width: 24px;
        height: 24px;
        margin-bottom: 4px;
      }

      &.icon-points {
        width: 24px;
        height: 24px;
        margin-bottom: 4px;
      }
    }

    &-label {
      font-weight: 500;
      font-size: 13px;
      line-height: 16px;
      color: var(--r-neutral-title-1, rgba(25, 41, 69, 1));
      text-align: center;
    }

    @keyframes icn-spin {
      100% {
        transform: rotate(360deg);
      }
    }

    .icon-alert {
      position: absolute;
      right: 33px;
      top: 7px;
    }
  }

  .ant-badge {
    .ant-badge-count {
      background-color: var(--r-blue-default, #7084ff);
      padding: 2px 6px;
      font-size: 13px;
      line-height: 1;
      height: 18px;
      border-radius: 90px;
      box-shadow: none;
    }
    &.alert .ant-badge-count {
      background-color: #ec5151;
    }
    &.round .ant-badge-count {
      padding: 2px 4.5px !important;
    }
  }
`;

export const DashboardHeader: React.FC<{ onSettingClick?(): void }> = ({
  onSettingClick,
}) => {
  const history = useHistory();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();
  const { t } = useTranslation();

  const ref = React.useRef<HTMLDivElement>(null);
  const { isDarkTheme } = useThemeMode();

  const currentAccount = useCurrentAccount();

  const isGnosis = currentAccount?.type === KEYRING_TYPE.GnosisKeyring;

  useInterval(() => {
    if (!currentAccount) return;
    if (currentAccount.type === KEYRING_TYPE.GnosisKeyring) return;

    dispatch.transactions.getPendingTxCountAsync(currentAccount.address);
  }, 30000);

  useEffect(() => {
    if (currentAccount) {
      if (currentAccount.type !== KEYRING_TYPE.GnosisKeyring) {
        dispatch.transactions.getPendingTxCountAsync(currentAccount.address);
      }

      wallet
        .getAlianName(currentAccount?.address.toLowerCase())
        .then((name) => {
          dispatch.account.setField({ alianName: name });
        });
    }
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

  type IPanelItem = {
    icon: ThemeIconType;
    content: string;
    onClick: import('react').MouseEventHandler<HTMLElement>;
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

  const panelItems = {
    swap: {
      icon: RcIconSwapCC,
      eventKey: 'Fund',
      content: t('page.dashboard.home.panel.swap'),
      onClick: () => {
        history.push('/dex-swap?rbisource=dashboard');
      },
    } as IPanelItem,
    send: {
      icon: RcIconSendCC,
      eventKey: 'Send',
      content: t('page.dashboard.home.panel.send'),
      onClick: () => {
        history.push('/send-token?rbisource=dashboard');
      },
    } as IPanelItem,
    bridge: {
      icon: RcIconBridgeCC,
      eventKey: 'Bridge',
      content: t('page.dashboard.home.panel.bridge'),
      onClick: () => {
        history.push('/bridge');
      },
    } as IPanelItem,
    receive: {
      icon: RcIconReceiveCC,
      eventKey: 'Receive',
      content: t('page.dashboard.home.panel.receive'),
    } as IPanelItem,
  };

  const brandIcon = useWalletConnectIcon(currentAccount);

  const pickedPanelKeys = useMemo<
    ('swap' | 'send' | 'bridge' | 'receive')[]
  >(() => {
    return isGnosis
      ? ['swap', 'send', 'bridge', 'receive']
      : ['swap', 'send', 'bridge', 'receive'];
  }, [isGnosis]);

  return (
    <Container>
      <div className="flex mb-[8px] items-center gap-[16px] relative">
        <div className="ml-auto flex items-center gap-[8px]">
          <div className="rounded-[5px] cursor-pointer text-r-neutral-title-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]">
            <CurrentConnection />
          </div>

          <div
            className="py-[6px] px-[8px] rounded-[5px] cursor-pointer text-black bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]"
            onClick={onSettingClick}
          >
            <RcIconSettingCC />
          </div>
        </div>
      </div>

      {currentAccount && (
        <div className="flex items-center gap-[8px]">
          <div
            className="flex items-center gap-[6px] px-[8px] py-[6px] rounded-[6px] cursor-pointer bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]"
            onClick={handleSwitchAddress}
          >
            <div className="relative">
              <CommonSignal
                type={currentAccount.type}
                brandName={currentAccount.brandName}
                address={currentAccount.address}
              />
            </div>
            {currentAccount && (
              <AddressViewer
                address={currentAccount.address}
                showArrow={false}
                className="text-[12px] leading-[14px] text-black opacity-60"
              />
            )}
            <IconArrowRight />
          </div>

          <RcIconCopy
            viewBox="0 0 16 16"
            className="w-[16px] h-[16px] cursor-pointer !text-gray-title opacity-60 hover:opacity-80"
            onClick={() => {
              copyAddress(currentAccount.address);
              matomoRequestEvent({
                category: 'AccountInfo',
                action: 'headCopyAddress',
                label: [
                  getKRCategoryByType(currentAccount?.type),
                  currentAccount?.brandName,
                ].join('|'),
              });

              ga4.fireEvent('Click_CopyAddress', {
                event_category: 'Front Page Click',
              });
            }}
          />
        </div>
      )}
      {dashboardBalanceCacheInited && (
        <BalanceView currentAccount={currentAccount} />
      )}
      <HeaderWrap
        ref={ref}
        style={
          isDarkTheme
            ? {
                backgroundColor: 'rgb(41,43,57)',
              }
            : undefined
        }
      >
        {pickedPanelKeys.map((panelKey, index) => {
          const item = panelItems[panelKey] as IPanelItem;
          if (item.hideForGnosis && isGnosis) return null;
          return (
            <div key={panelKey} className="bg-r-neutral-bg-2 rounded-[16px]">
              {item.disabled ? (
                <Tooltip
                  {...(item.commingSoonBadge && { visible: false })}
                  title={
                    item.disableReason || t('page.dashboard.home.comingSoon')
                  }
                  overlayClassName="rectangle direction-tooltip"
                  autoAdjustOverflow={false}
                >
                  <div key={index} className="disable-direction">
                    <ThemeIcon src={item.icon} className="images" />
                    <div className="panel-item-label">{item.content} </div>
                  </div>
                </Tooltip>
              ) : (
                <div
                  key={index}
                  onClick={(evt) => {
                    matomoRequestEvent({
                      category: 'Dashboard',
                      action: 'clickEntry',
                      label: item.eventKey,
                    });

                    ga4.fireEvent(`Entry_${item.eventKey}`, {
                      event_category: 'Dashboard',
                    });

                    item?.onClick(evt);
                  }}
                  className="panel-item group"
                >
                  {item.showAlert && (
                    <ThemeIcon src={IconAlertRed} className="icon icon-alert" />
                  )}
                  {item.badge ? (
                    <Badge
                      count={item.badge}
                      size="small"
                      className={clsx(
                        {
                          alert: item.badgeAlert && !item.badgeClassName,
                        },
                        item.badgeClassName
                      )}
                    >
                      <ThemeIcon
                        src={item.icon}
                        className={clsx([
                          item.iconSpin && 'icon-spin',
                          'panel-item-icon',
                        ])}
                      />
                    </Badge>
                  ) : (
                    <ThemeIcon
                      src={item.icon}
                      className={clsx(['panel-item-icon', item.iconClassName])}
                    />
                  )}
                  <div className="panel-item-label">{item.content}</div>
                  {item.subContent}
                  {item.commingSoonBadge && (
                    <div className="coming-soon-badge">
                      {t('page.dashboard.home.soon')}
                    </div>
                  )}
                  {item.isFullscreen && (
                    <div className="absolute top-[6px] right-[6px] opacity-50 text-r-neutral-foot hidden group-hover:block">
                      <RcIconExternal1CC />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </HeaderWrap>
    </Container>
  );
};
