import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { isValidAddress } from '@ethereumjs/util';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { groupBy } from 'lodash';
import PQueue from 'p-queue';

import { findAccountByPriority } from '@/utils/account';
import { FullscreenContainer } from '@/ui/component/FullscreenContainer';
import { getUiType, isSameAddress, openInternalPageInTab } from '@/ui/utils';
import { PageHeader } from '@/ui/component';
import { connectStore, useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { EnterAddress } from './components/EnterAddress';
import { padWatchAccount } from './util';
import { AddressRiskAlert } from '@/ui/component/AddressRiskAlert';
import { useWallet } from '@/ui/utils/WalletContext';

// icons
import { ReactComponent as RcWhitelistGuardCC } from '@/ui/assets/component/whitelist-guard-cc.svg';

const unimportedBalancesCache: Record<string, number> = {};
const queue = new PQueue({ interval: 1000, intervalCap: 8, concurrency: 8 }); // 每秒最多5个

import TabImported from './components/TabImported';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { query2obj } from '@/ui/utils/url';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/primitives';

type FocusTab = 'whitelist' | 'imported';
const OuterInput = styled.div`
  border: 1px solid var(--r-neutral-line);
  &:hover {
    border: 1px solid var(--r-blue-default, #7084ff);
    cursor: text;
  }
`;

const isTab = getUiType().isTab;
const isDesktop = getUiType().isDesktop;
const getContainer =
  isTab || isDesktop ? '.js-rabby-popup-container' : undefined;

const SelectToAddress = ({}: {}) => {
  const dispatch = useRabbyDispatch();
  const wallet = useWallet();
  const { t } = useTranslation();

  const { accountsList, whitelist } = useRabbySelector((s) => ({
    accountsList: s.accountToDisplay.accountsList,
    whitelist: s.whitelist.whitelist,
  }));

  // main state
  const [inputingAddress, setInputingAddress] = useState(false);

  const [unimportedBalances, setUnimportedBalances] = useState<
    Record<string, number>
  >({});

  const importedWhitelistAccounts = useMemo(() => {
    const groupAccounts = groupBy(accountsList, (item) =>
      item.address.toLowerCase()
    );
    const uniqueAccounts = Object.values(groupAccounts).map((item) =>
      findAccountByPriority(item)
    );
    return [...uniqueAccounts].filter((a) =>
      whitelist?.some((w) => isSameAddress(w, a.address))
    );
  }, [accountsList, whitelist]);

  const unimportedWhitelistAccounts = useMemo(() => {
    return whitelist
      ?.filter(
        (w) =>
          !importedWhitelistAccounts.some((a) => isSameAddress(w, a.address))
      )
      .map((w) => padWatchAccount(w));
  }, [importedWhitelistAccounts, whitelist]);

  const fetchData = async () => {
    dispatch.accountToDisplay.getAllAccountsToDisplay();
    dispatch.whitelist.getWhitelistEnabled();
    dispatch.whitelist.getWhitelist();
  };

  const handleChange = (address: string, type?: string) => {
    if (!isValidAddress(address)) {
      console.error('[SelectToAddress] Invalid address:', address);
      return;
    }
    // Normalize address to lowercase for consistency
    const normalizedAddress = address.toLowerCase();
    console.log(
      '[SelectToAddress] Address selected:',
      normalizedAddress,
      'type:',
      type
    );
    forceUpdateUnimportedBalances(normalizedAddress);
  };

  const forceUpdateUnimportedBalances = useCallback(
    async (address: string) => {
      const lowerAddress = address.toLowerCase();
      try {
        const res = await wallet.getInMemoryAddressBalance(lowerAddress);
        const balance = res?.total_usd_value || 0;
        unimportedBalancesCache[lowerAddress] = balance;
        setUnimportedBalances((prev) => ({
          ...prev,
          [lowerAddress]: balance,
        }));
      } catch (e) {
        unimportedBalancesCache[lowerAddress] = 0;
        setUnimportedBalances((prev) => ({
          ...prev,
          [lowerAddress]: 0,
        }));
      }
    },
    [wallet]
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (
      !unimportedWhitelistAccounts ||
      unimportedWhitelistAccounts.length === 0
    ) {
      return;
    }
    const fetchBalances = async () => {
      queue.clear();
      await Promise.all(
        unimportedWhitelistAccounts.map((acc) =>
          queue.add(async () => {
            if (cancelled) {
              return;
            }
            if (unimportedBalancesCache[acc.address] !== undefined) {
              // 已有缓存，直接set
              setUnimportedBalances((prev) => ({
                ...prev,
                [acc.address]: unimportedBalancesCache[acc.address],
              }));
              return;
            }
            const cachedBalance = await wallet.getAddressCacheBalance(
              acc.address
            );
            if (typeof cachedBalance?.total_usd_value === 'number') {
              unimportedBalancesCache[acc.address] =
                cachedBalance.total_usd_value;
              setUnimportedBalances((prev) => ({
                ...prev,
                [acc.address]: cachedBalance.total_usd_value,
              }));
              return;
            }
            if (!cancelled) {
              forceUpdateUnimportedBalances(acc.address);
            }
          })
        )
      );
    };
    fetchBalances();
    return () => {
      cancelled = true;
      queue.clear();
    };
  }, [forceUpdateUnimportedBalances, unimportedWhitelistAccounts, wallet]);

  return (
    <div>
      <div>
        {inputingAddress ? (
          <EnterAddress
            onCancel={() => {
              setInputingAddress(false);
            }}
            onNext={handleChange}
          />
        ) : (
          <OuterInput
            className={`
                border border-r-neutral-line rounded-[8px] bg-r-neutral-card1
                text-r-neutral-foot text-[15px] 
                h-[52px] leading-[52px] px-[15px] justify-center items-center
                hover:cursor-text hover:border-r-blue-default
              `}
            onClick={() => setInputingAddress(true)}
          >
            {t('page.selectToAddress.enterAddressOrENS')}
          </OuterInput>
        )}
      </div>

      {!inputingAddress && <TabImported handleChange={handleChange} />}
    </div>
  );
};

export default connectStore()(SelectToAddress);
