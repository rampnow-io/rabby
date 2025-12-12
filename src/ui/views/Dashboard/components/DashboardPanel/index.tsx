import { CHAINS_ENUM, KEYRING_TYPE, ThemeIconType } from '@/constant';
import RateModal from '@/ui/component/RateModal/RateModal';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useRabbySelector } from '@/ui/store';
import { usePerpsHomePnl } from '@/ui/views/Perps/hooks/usePerpsHomePnl';
import { findChainByID } from '@/utils/chain';
import { appIsDev } from '@/utils/env';
import { ga4 } from '@/utils/ga4';
import { matomoRequestEvent } from '@/utils/matomo-request';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/primitives';

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
  return (
    <div className="relative px-[16px] pt-[14px] pb-[12px]">
      <Tabs defaultValue="tokens">
        <TabsList>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>
        <TabsContent value="tokens">
          <AssetList visible={true} onClose={() => {}} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionHistory />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsTabPane isDesktop={false} />
        </TabsContent>
      </Tabs>
      <RateModal />
    </div>
  );
};
