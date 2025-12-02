import { matomoRequestEvent } from '@/utils/matomo-request';
import clsx from 'clsx';
import {
  CHAINS_ENUM,
  KEYRING_CLASS,
  KEYRING_ICONS_WHITE,
  KEYRING_TYPE,
  ThemeIconType,
  WALLET_BRAND_CONTENT,
} from 'consts';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useInterval } from 'react-use';
import { ReactComponent as RcIconCopy } from 'ui/assets/icon-copy-1.svg';
import WatchLogo from 'ui/assets/waitcup.svg';

import { AddressViewer } from 'ui/component';
import { useRabbyDispatch, useRabbySelector } from 'ui/store';
import { useWallet } from 'ui/utils';

import { getKRCategoryByType } from '@/utils/transaction';

import IconAlertRed from 'ui/assets/alert-red.svg';

import {
  RcIconApprovalsCC,
  RcIconBridgeCC,
  RcIconGasAccountCC,
  RcIconMobileSyncCC,
  RcIconSettingCC,
  RcIconNftCC,
  RcIconPerpsCC,
  RcIconPointsCC,
  RcIconReceiveCC,
  RcIconSendCC,
  RcIconSwapCC,
  RcIconTransactionsCC,
  RcIconSearchCC,
  RcIconDappsCC,
  RcIconManageCC,
} from 'ui/assets/dashboard/panel';

import {
  RcIconAddWalletCC,
  RcIconExternal1CC,
  RcIconQrCodeCC,
} from '@/ui/assets/dashboard';
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
import PendingTxs from '../PendingTxs';
import Queue from '../Queue';
import { Badge, Popover, Tooltip } from 'antd';
import QRCode from 'qrcode.react';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { CurrentConnection } from '../CurrentConnection';

const Container = styled.div`
  width: 100%;
  height: 350px;
  background: #ffff;
  position: relative;
  overflow: hidden;
  padding: 12px 16px;
`;

const WrapContainer = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  overflow: auto;

  border-radius: 8px;
  background-color: var(--r-neutral-card2, #f2f4f7);

  .panel-item {
    height: 88px;
    width: 100%;
    cursor: pointer;

    background: var(--r-neutral-card1, #fff);

    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

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
  const [approvalRiskAlert, setApprovalRiskAlert] = useState(0);
  const [currentConnectedSiteChain, setCurrentConnectedSiteChain] = useState(
    CHAINS_ENUM.ETH
  );

  const ref = React.useRef<HTMLDivElement>(null);
  const { isDarkTheme } = useThemeMode();

  const currentAccount = useCurrentAccount();

  const { pendingTransactionCount: pendingTxCount } = useRabbySelector((s) => ({
    ...s.transactions,
  }));

  const [displayName, setDisplayName] = useState<string>('');
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
          setDisplayName(name!);
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

  const handleAddAddress = useMemoizedFn(() => {
    // matomoRequestEvent({
    //   category: 'Front Page Click',
    //   action: 'Click',
    //   label: 'Add Address',
    // });

    // ga4.fireEvent('Click_AddAddress', {
    //   event_category: 'Front Page Click',
    // });

    history.push('/add-address');
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

  const giftUsdValue = useRabbySelector((s) => s.gift.giftUsdValue);
  const hasClaimedGift = useRabbySelector((s) => s.gift.hasClaimedGift);

  const hasGiftEligibility = useMemo(() => {
    return giftUsdValue > 0 && !hasClaimedGift;
  }, [giftUsdValue, hasClaimedGift]);

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
    // queue: {
    //   icon: RcIconTransactionsCC,
    //   eventKey: 'Queue',
    //   content: t('page.dashboard.home.panel.queue'),
    //   badge: gnosisPendingCount,
    //   onClick: () => {
    //     history.push('/gnosis-queue');
    //   },
    // } as IPanelItem,
    // transactions: {
    //   icon: RcIconTransactionsCC,
    //   eventKey: 'Transactions',
    //   content: t('page.dashboard.home.panel.transactions'),
    //   onClick: () => {
    //     history.push('/history');
    //   },
    // } as IPanelItem,
    // security: {
    //   icon: RcIconApprovalsCC,
    //   eventKey: 'Approvals',
    //   content: t('page.dashboard.home.panel.approvals'),
    //   onClick: async (evt) => {
    //     // openInternalPageInTab('approval-manage');
    //     await wallet.openInDesktop('/desktop/profile/approvals');
    //     window.close();
    //   },
    //   badge: approvalRiskAlert,
    //   badgeAlert: approvalRiskAlert > 0,
    //   isFullscreen: true,
    // } as IPanelItem,
    // nft: {
    //   icon: RcIconNftCC,
    //   eventKey: 'NFT',
    //   content: t('page.dashboard.home.panel.nft'),
    //   onClick: () => {
    //     history.push('/nft');
    //   },
    // } as IPanelItem,
    // gasAccount: {
    //   icon: RcIconGasAccountCC,
    //   eventKey: 'GasAccount',
    //   content: t('page.dashboard.home.panel.gasAccount'),
    //   onClick: () => {
    //     history.push('/gas-account');
    //   },
    //   subContent: hasGiftEligibility ? (
    //     <div className="absolute top-[6px] right-[6px]">
    //       <div
    //         className={clsx(
    //           'text-r-green-default text-[10px] leading-[12px] font-medium',
    //           'flex items-center px-[3px] py-[2px] rounded-[4px] bg-r-green-light'
    //         )}
    //       >
    //         <RcIconGift viewBox="0 0 14 14" />
    //         {Number.isInteger(giftUsdValue)
    //           ? '$' + splitNumberByStep(giftUsdValue)
    //           : formatGasAccountUsdValueV2(giftUsdValue)}
    //       </div>
    //     </div>
    //   ) : null,
    // } as IPanelItem,
    // mobile: {
    //   icon: RcIconMobileSyncCC,
    //   eventKey: 'Rabby Mobile',
    //   content: t('page.dashboard.home.panel.mobile'),
    //   onClick: () => {
    //     openInternalPageInTab('sync');
    //   },
    //   isFullscreen: true,
    // } as IPanelItem,
    // perps: {
    //   icon: RcIconPerpsCC,
    //   eventKey: 'Perps',
    //   iconClassName: 'icon-perps',
    //   subContent: perpsPositionInfo.show ? (
    //     <div
    //       className={clsx(
    //         'absolute bottom-[4px] text-[11px] leading-[13px] font-medium',
    //         perpsPositionInfo.pnl > 0
    //           ? 'text-r-green-default'
    //           : 'text-r-red-default'
    //       )}
    //     >
    //       {perpsPositionInfo.pnl >= 0 ? '+' : '-'}$
    //       {splitNumberByStep(Math.abs(perpsPositionInfo.pnl).toFixed(2))}
    //     </div>
    //   ) : isFetching ? (
    //     <div className="absolute bottom-[4px] text-[11px] font-medium">
    //       <Skeleton.Button
    //         active={true}
    //         className="h-[10px] block rounded-[2px]"
    //         style={{ width: 42 }}
    //       />
    //     </div>
    //   ) : null,
    //   content: t('page.dashboard.home.panel.perps'),
    //   onClick: () => {
    //     history.push('/perps');
    //   },
    // } as IPanelItem,
    // searchDapp: {
    //   icon: RcIconSearchCC,
    //   eventKey: 'Search Dapp',
    //   content: t('page.dashboard.home.panel.searchDapp'),
    //   onClick: () => {
    //     openInternalPageInTab('dapp-search');
    //   },
    //   isFullscreen: true,
    // } as IPanelItem,
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
      {currentAccount && (
        <div className={clsx('flex mb-[8px] items-center gap-[16px] relative')}>
          <div className="flex items-center gap-[8px]">
            <div
              className={clsx(
                'flex items-center gap-[6px] px-[8px] py-[6px] rounded-[6px] cursor-pointer',
                'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
              )}
              onClick={handleSwitchAddress}
            >
              <div className="relative">
                <img
                  className={clsx('w-[20px] h-[20px]')}
                  src={
                    brandIcon ||
                    WALLET_BRAND_CONTENT[currentAccount.brandName]?.image ||
                    (currentAccount.type === KEYRING_CLASS.WATCH
                      ? WatchLogo
                      : KEYRING_ICONS_WHITE[currentAccount.type])
                  }
                />
                <CommonSignal
                  type={currentAccount.type}
                  brandName={currentAccount.brandName}
                  address={currentAccount.address}
                />
              </div>
              <div
                className="text-[15px] leading-[18px] font-medium text-black truncate max-w-[86px]"
                title={displayName}
              >
                {displayName}
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
              className="w-[16px] h-[16px] cursor-pointer text-black opacity-60 hover:opacity-80"
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

            {/* <Popover
              trigger={'click'}
              content={
                <div className="mx-[-4px]">
                  <QRCode value={currentAccount.address} size={190}></QRCode>
                </div>
              }
            >
              <RcIconQrCodeCC className="w-[16px] h-[16px] text-r-neutral-title2 cursor-pointer opacity-60 hover:opacity-80" />
            </Popover> */}
          </div>

          <div className="ml-auto flex items-center gap-[8px]">
            <div
              className={clsx(
                'rounded-[5px] cursor-pointer text-r-neutral-title-2',
                'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
              )}
            >
              <CurrentConnection onChainChange={setCurrentConnectedSiteChain} />
            </div>

            <div
              className={clsx(
                'py-[6px] px-[8px] rounded-[5px] cursor-pointer text-black',
                'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
              )}
              onClick={onSettingClick}
            >
              <RcIconSettingCC />
            </div>
          </div>
        </div>
      )}
      {dashboardBalanceCacheInited && (
        <BalanceView currentAccount={currentAccount} />
      )}
      <WrapContainer
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
            <div key={panelKey} className="bg-r-neutral-bg-2">
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
      </WrapContainer>

      {/* {isGnosis ? (
        <Queue
          // count={gnosisPendingCount || 0}
          count={0}
          className={clsx(
            'transition-all'
            // !false ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        />
      ) : (
        pendingTxCount > 0 && <PendingTxs pendingTxCount={pendingTxCount} />
      )} */}
    </Container>
  );
};
