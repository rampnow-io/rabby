import { CHAINS_ENUM, KEYRING_TYPE, ThemeIconType } from '@/constant';
import RateModal from '@/ui/component/RateModal/RateModal';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useRabbySelector } from '@/ui/store';
import { usePerpsHomePnl } from '@/ui/views/Perps/hooks/usePerpsHomePnl';
import { findChainByID } from '@/utils/chain';
import { appIsDev } from '@/utils/env';
import { ga4 } from '@/utils/ga4';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { Badge, Col, Row, Skeleton, Tooltip, Tabs } from 'antd';
import clsx from 'clsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAsync } from 'react-use';
import styled from 'styled-components';
import IconAlertRed from 'ui/assets/alert-red.svg';
import { ReactComponent as RcIconEco } from 'ui/assets/dashboard/icon-eco.svg';
import { ReactComponent as RcIconGift } from 'ui/assets/gift-14.svg';
import { AssetList } from '@/ui/views/CommonPopup/AssetList/AssetList';
import TransactionHistory from '@/ui/views/TransactionHistory';
import { ApprovalsTabPane } from '@/ui/views/DesktopProfile/components/ApprovalsTabPane';

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

import { useGasAccountInfo } from '@/ui/views/GasAccount/hooks';
import ChainSelectorModal from 'ui/component/ChainSelector/Modal';
import {
  formatGasAccountUsdValueV2,
  openInternalPageInTab,
  splitNumberByStep,
  useWallet,
} from 'ui/utils';
import { ClaimRabbyFreeGasBadgeModal } from '../ClaimRabbyBadgeModal/freeGasBadgeModal';
import { EcologyPopup } from '../EcologyPopup';
import { Settings } from '../index';
import { RabbyPointsPopup } from '../RabbyPointsPopup';
import { RcIconExternal1CC, RcIconFullscreenCC } from '@/ui/assets/dashboard';
import { RecentConnectionsPopup } from '../RecentConnections';
import { useScroll, useSize } from 'ahooks';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { useCheckBridgePendingItem } from '@/ui/views/Bridge/hooks/history';

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;

  height: 264px;
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

export const DashboardPanel: React.FC<{ onSettingClick?(): void }> = ({
  onSettingClick,
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const [activeTab, setActiveTab] = useState('tokens');
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [approvalChain, setApprovalChain] = useState<CHAINS_ENUM | undefined>(
    undefined
  );

  const [badgeModalVisible, setBadgeModalVisible] = useState(false);

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

  const ref = useRef<HTMLDivElement | null>(null);
  const scroll = useScroll(ref);
  const scrollRatio = useMemo(() => {
    const top = scroll?.top ?? 0;
    const height = ref.current?.getBoundingClientRect()?.height ?? 0;
    const scrollHeight = ref.current?.scrollHeight ?? 440;
    const ratio = top / (scrollHeight - height);
    return ratio;
  }, [scroll?.top]);
  const { isDarkTheme } = useThemeMode();

  return (
    <div className="relative px-[16px] pt-[14px] pb-[12px]">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="dashboard-panel-tabs"
        tabBarStyle={{
          marginBottom: 16,
        }}
      >
        <Tabs.TabPane tab="Tokens" key="tokens">
          <div className="bg-r-neutral-card-1 p-[10px] rounded-[8px] overflow-auto max-h-[500px]">
            <AssetList visible={activeTab === 'tokens'} onClose={() => {}} />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Transactions" key="transactions">
          <div className="bg-r-neutral-card-1 p-[10px] overflow-auto rounded-[8px]  max-h-[500px]">
            <TransactionHistory />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Approvals" key="approvals">
          <div className="bg-r-neutral-card-1 p-[10px] rounded-[8px] overflow-auto max-h-[500px]">
            <ApprovalsTabPane isDesktop={false} desktopChain={approvalChain} />
          </div>
        </Tabs.TabPane>
      </Tabs>
      <RateModal />
    </div>
  );
};
