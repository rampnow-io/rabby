/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */

'use client';

import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Input } from 'antd';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BottomDrawer, Search } from '@repo/ui';
import { Button } from '@repo/ui/primitives';

import { useRabbyDispatch, useRabbyGetter, useRabbySelector } from '@/ui/store';
import { findChainByEnum, varyAndSortChainItems } from '@/utils/chain';

import { CHAINS_ENUM } from 'consts';
import IconSearch from 'ui/assets/search.svg';
import Empty from '../Empty';
import NetSwitchTabs, {
  NetSwitchTabsKey,
  useSwitchNetTab,
} from '../PillsSwitch/NetSwitchTabs';
import {
  SelectChainList,
  SelectChainListProps,
} from './components/SelectChainList';
import { LoadingBalances } from './LoadingBalances';
import { ReactComponent as RcIconCloseCC } from 'ui/assets/component/close-cc.svg';
import { Chain } from 'background/service/openapi';
import { Account } from '@/background/service/preference';
import { TDisableCheckChainFn } from './components/SelectChainItem';
import BottomFloatingSheet from '../BottomFloatingPopup';

interface ChainSelectorModalProps {
  visible?: boolean;
  value?: CHAINS_ENUM;
  onCancel(): void;
  onChange(val: CHAINS_ENUM): void;
  connection?: boolean;
  title?: ReactNode;
  className?: string;
  supportChains?: SelectChainListProps['supportChains'];
  disabledTips?: SelectChainListProps['disabledTips'];
  disableChainCheck?: TDisableCheckChainFn;
  hideTestnetTab?: boolean;
  hideMainnetTab?: boolean;
  showRPCStatus?: boolean;
  height?: number | string;
  excludeChains?: CHAINS_ENUM[];
  showClosableIcon?: boolean;
  account?: Account | null;
}

const useChainSelectorList = ({
  supportChains,
  netTabKey,
}: {
  supportChains?: Chain['enum'][];
  netTabKey?: NetSwitchTabsKey;
}) => {
  const [search, setSearch] = useState('');

  const { pinned, chainBalances } = useRabbySelector((state) => ({
    pinned:
      (state.preference.pinnedChain?.filter(Boolean) as CHAINS_ENUM[]) || [],
    chainBalances:
      netTabKey === 'testnet' ? {} : state.account.matteredChainBalances,
  }));

  const dispatch = useRabbyDispatch();

  const { mainnetList, testnetList } = useRabbySelector((state) => ({
    mainnetList: state.chains.mainnetList,
    testnetList: state.chains.testnetList,
  }));

  const { allSearched, matteredList, unmatteredList } = useMemo(() => {
    const result = varyAndSortChainItems({
      supportChains,
      searchKeyword: search.trim().toLowerCase(),
      matteredChainBalances: chainBalances,
      pinned,
      netTabKey,
      mainnetList,
      testnetList,
    });

    return {
      allSearched: result.allSearched,
      matteredList: search ? [] : result.matteredList,
      unmatteredList: search ? [] : result.unmatteredList,
    };
  }, [
    search,
    pinned,
    supportChains,
    chainBalances,
    netTabKey,
    mainnetList,
    testnetList,
  ]);

  useEffect(() => {
    dispatch.preference.getPreference('pinnedChain');
  }, []);

  return {
    matteredList,
    unmatteredList: search ? allSearched : unmatteredList,
    search,
    setSearch,
    pinned,
    handleStarChange: (chain: CHAINS_ENUM, value: boolean) => {
      value
        ? dispatch.preference.addPinnedChain(chain)
        : dispatch.preference.removePinnedChain(chain);
    },
    handleSort: (chains: Chain[]) => {
      dispatch.preference.updatePinnedChainList(chains.map((c) => c.enum));
    },
  };
};

const ChainSelectorBottomDrawer = ({
  title,
  onCancel,
  onChange,
  value,
  visible,
  connection = false,
  className,
  supportChains,
  disabledTips,
  hideTestnetTab = false,
  hideMainnetTab = false,
  showRPCStatus = false,
  height = 540,
  excludeChains,
  showClosableIcon = true,
  account,
  disableChainCheck,
}: ChainSelectorModalProps) => {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useRabbyDispatch();

  const { isShowTestnet, selectedTab, onTabChange } = useSwitchNetTab({
    hideTestnetTab,
  });

  const {
    matteredList: _matteredList,
    unmatteredList: _unmatteredList,
    handleStarChange,
    handleSort,
    search,
    setSearch,
    pinned,
  } = useChainSelectorList({
    supportChains,
    netTabKey: !hideMainnetTab ? selectedTab : 'testnet',
  });

  const [matteredList, unmatteredList] = useMemo(() => {
    if (!excludeChains?.length) return [_matteredList, _unmatteredList];

    return [
      _matteredList.filter((c) => !excludeChains.includes(c.enum)),
      _unmatteredList.filter((c) => !excludeChains.includes(c.enum)),
    ];
  }, [_matteredList, _unmatteredList, excludeChains]);

  useEffect(() => {
    if (!value) return;
    const chain = findChainByEnum(value);
    onTabChange(chain?.isTestnet ? 'testnet' : 'mainnet');
  }, [value]);

  useEffect(() => {
    dispatch.account.getMatteredChainBalance({
      currentAccountAddress: account?.address,
    });
  }, [account?.address]);

  const isLoading = useRabbyGetter(
    (s) => s.account.isLoadingMateeredChainBalances
  );

  if (!visible) return null;

  return (
    <BottomFloatingSheet
      hideCloseButton
      open={visible}
      header={
        <div>
          <div className="flex items-center pb-4 justify-between">
            <h2 className="text-primary-foreground text-xl font-medium">
              {title || t('page.bridge.select-chain')}
            </h2>
            {showClosableIcon && (
              <div className="bg-[#EAEAEA] p-1 rounded-full">
                <RcIconCloseCC
                  className="w-[15px] h-[15px] cursor-pointer text-[#000000]"
                  onClick={onCancel}
                />
              </div>
            )}
          </div>

          {isShowTestnet && !hideMainnetTab && (
            <NetSwitchTabs
              value={selectedTab}
              onTabChange={onTabChange}
              className="h-[28px] mt-[16px]"
            />
          )}

          <Search
            placeholder={t('component.ChainSelectorModal.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[42px]"
          />
        </div>
      }
      onClose={onCancel}
      className={clsx(className)}
      contentClassName="!px-2 !pt-2 !pb-2"
    >
      <div className="h-[600px] flex flex-col p-4">
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <LoadingBalances loading />
          ) : (
            <>
              <SelectChainList
                supportChains={supportChains}
                data={matteredList}
                pinned={pinned}
                onStarChange={handleStarChange}
                onSort={handleSort}
                onChange={(val) => {
                  onChange(val);
                  onCancel();
                }}
                value={value}
                disabledTips={disabledTips}
                showRPCStatus={showRPCStatus}
                disableChainCheck={disableChainCheck}
              />

              <SelectChainList
                supportChains={supportChains}
                data={unmatteredList}
                pinned={pinned}
                onStarChange={handleStarChange}
                onChange={(val) => {
                  onChange(val);
                  onCancel();
                }}
                value={value}
                disabledTips={disabledTips}
                showRPCStatus={showRPCStatus}
                disableChainCheck={disableChainCheck}
              />

              {matteredList.length === 0 && unmatteredList.length === 0 && (
                <div className="pt-[70px] text-center">
                  <Empty>{t('component.ChainSelectorModal.noChains')}</Empty>

                  {selectedTab === 'testnet' && (
                    <Button
                      className="w-[200px] h-[44px] mt-[40px]"
                      onClick={() => history.push('/custom-testnet')}
                    >
                      {t('component.ChainSelectorModal.addTestnet')}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BottomFloatingSheet>
  );
};

export default ChainSelectorBottomDrawer;
