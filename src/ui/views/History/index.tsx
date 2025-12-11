import { Tabs } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';

import { ReactComponent as RcIconArrowRight } from '@/ui/assets/history/icon-arrow-right.svg';
import NetSwitchTabs, {
  useSwitchNetTab,
} from '@/ui/component/PillsSwitch/NetSwitchTabs';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { Empty, PageHeader } from 'ui/component';
import { HistoryList } from './components/HistoryList';
import { TestnetTransactionHistory } from '../TransactionHistory/TestnetTranasctionHistory';

const Null = () => null;

const History = () => {
  const { t } = useTranslation();
  const { isShowTestnet, selectedTab, onTabChange } = useSwitchNetTab();
  const renderTabBar = React.useCallback(() => <Null />, []);
  const history = useHistory();

  return (
    <div className="txs-history flex flex-col h-screen overflow-auto px-[20px] text-[12px] leading-[14px]">
      <PageHeader className="transparent-wrap" fixed>
        {t('page.transactions.title')}
      </PageHeader>
      {isShowTestnet && (
        <div className="flex-shrink-0">
          <NetSwitchTabs value={selectedTab} onTabChange={onTabChange} />
        </div>
      )}
      {selectedTab === 'mainnet' ? (
        <div
          className="
    filter-scam-nav inline-flex w-full h-[40px]
    px-[12px] py-[12px] justify-between items-center
    rounded-[6px] bg-r-neutral-card-1 mb-[12px]
    gap-[16px] cursor-pointer
    text-[13px] leading-[16px] font-medium text-r-neutral-body
    border border-transparent
    hover:border-blue-light hover:bg-blue-light hover:bg-opacity-10"
          onClick={() => {
            history.push(`/history/filter-scam?net=${selectedTab}`);
          }}
        >
          {t('page.transactions.filterScam.btn')}
          <ThemeIcon src={RcIconArrowRight} />
        </div>
      ) : null}
      <Tabs
        className="h-full"
        renderTabBar={renderTabBar}
        activeKey={selectedTab}
      >
        <Tabs.TabPane key="mainnet" destroyInactiveTabPane={false}>
          <HistoryList />
        </Tabs.TabPane>
        <Tabs.TabPane key="testnet">
          <TestnetTransactionHistory />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

const HistoryFilterScam = () => {
  const { t } = useTranslation();

  return (
    <div className="txs-history flex flex-col h-screen overflow-auto px-[20px] text-[12px] leading-[14px]">
      <PageHeader className="transparent-wrap" fixed>
        {t('page.transactions.filterScam.title')}
      </PageHeader>
      <HistoryList isFilterScam={true} />
    </div>
  );
};

export const HistoryPage = ({
  isFitlerScam = false,
}: {
  isFitlerScam?: boolean;
}) => {
  return isFitlerScam ? <HistoryFilterScam /> : <History />;
};
