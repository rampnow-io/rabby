import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';

import { PageHeader } from 'ui/component';
import AddressItem from './AddressItem';

import { ReactComponent as RcIconPinned } from 'ui/assets/icon-pinned.svg';
import { ReactComponent as RcIconPinnedFill } from 'ui/assets/icon-pinned-fill.svg';
import { ReactComponent as RcIconAddAddress } from '@/ui/assets/address/new-address.svg';
import { ReactComponent as RcIconRight } from '@/ui/assets/address/right.svg';
import { ReactComponent as RcNoMatchedAddress } from '@/ui/assets/address/no-matched-addr.svg';

import './style.less';

import { obj2query } from '@/ui/utils/url';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';

import clsx from 'clsx';

import { EVENTS, KEYRING_CLASS } from '@/constant';

import { useRequest } from 'ahooks';
import { SessionStatusBar } from '@/ui/component/WalletConnect/SessionStatusBar';
import { LedgerStatusBar } from '@/ui/component/ConnectStatus/LedgerStatusBar';
import { GridPlusStatusBar } from '@/ui/component/ConnectStatus/GridPlusStatusBar';

import useDebounceValue from '@/ui/hooks/useDebounceValue';

import { IDisplayedAccountWithBalance } from '@/ui/models/accountToDisplay';
import { SortInput } from './SortInput';

import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { KeystoneStatusBar } from '@/ui/component/ConnectStatus/KeystoneStatusBar';

import dayjs from 'dayjs';

import { useAccounts } from '@/ui/hooks/useAccounts';
import { useWallet } from '@/ui/utils';

function NoAddressUI() {
  const { t } = useTranslation();

  return (
    <div className="no-address pt-[90px]">
      <ThemeIcon
        className="no-data-image w-[52px] h-[52px]"
        src={RcNoMatchedAddress}
      />
      <p className="text-14 text-r-neutral-body mt-[24px]">
        {t('page.manageAddress.no-address')}
      </p>
    </div>
  );
}

function NoSearchedAddressUI() {
  const { t } = useTranslation();

  return (
    <div className="no-matched-address">
      <ThemeIcon
        className="no-data-image w-[52px] h-[52px]"
        src={RcNoMatchedAddress}
      />
      <p className="text-14 text-r-neutral-body mt-[24px]">
        {t('page.manageAddress.no-match')}
      </p>
    </div>
  );
}

const AddressManagement: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();

  const enableSwitch = location.pathname === '/switch-address';

  const dispatch = useRabbyDispatch();
  const wallet = useWallet();

  const {
    sortedAccountsList,
    addressSortStore,
    accountsList,
    highlightedAddresses,
    fetchAllAccounts,
    loadingAccounts,
    allSortedAccountList,
  } = useAccounts();

  const [searchKeyword, setSearchKeyword] = React.useState(
    addressSortStore?.search || ''
  );
  const debouncedSearchKeyword = useDebounceValue(searchKeyword, 250);

  useEffect(() => {
    fetchAllAccounts();
  }, [fetchAllAccounts]);

  useEffect(() => {
    dispatch.preference.setAddressSortStoreValue({
      key: 'search',
      value: searchKeyword,
    });
  }, [searchKeyword, dispatch.preference]);

  useEffect(() => {
    dispatch.whitelist.init();
  }, [dispatch.whitelist]);

  const { runAsync: updateAllBalance, loading: isUpdatingBalance } = useRequest(
    () => dispatch.accountToDisplay.updateAllBalance(),
    {
      manual: true,
    }
  );

  const matchAccount = useCallback(
    (acc: IDisplayedAccountWithBalance, kw: string) => {
      const lower = acc.address.toLowerCase();
      const alias = acc.alianName?.toLowerCase() ?? '';
      const allowPartial = kw.replace(/^0x/, '').length >= 2;

      const partial = allowPartial && lower.includes(kw);

      return lower === kw || alias.includes(kw) || partial;
    },
    []
  );

  const {
    filteredAccounts,
    accountList,
    noAnyAccount,
    noAnySearchedAccount,
  } = useMemo<{
    filteredAccounts:
      | IDisplayedAccountWithBalance[]
      | IDisplayedAccountWithBalance[][];
    accountList: IDisplayedAccountWithBalance[];
    noAnyAccount: boolean;
    noAnySearchedAccount: boolean;
  }>(() => {
    const base = allSortedAccountList;

    let list:
      | IDisplayedAccountWithBalance[]
      | IDisplayedAccountWithBalance[][] =
      addressSortStore.sortType === 'addressType'
        ? (sortedAccountsList as IDisplayedAccountWithBalance[][])
        : base;

    if (debouncedSearchKeyword) {
      const kw = debouncedSearchKeyword.toLowerCase();

      if (addressSortStore.sortType === 'addressType') {
        list = (list as IDisplayedAccountWithBalance[][])
          .map((group) => group.filter((a) => matchAccount(a, kw)))
          .filter((g) => g.length > 0);
      } else {
        list = (list as IDisplayedAccountWithBalance[]).filter((a) =>
          matchAccount(a, kw)
        );
      }
    }

    return {
      filteredAccounts: list,
      accountList: base,
      noAnyAccount: base.length === 0 && !loadingAccounts,
      noAnySearchedAccount: (list as any).length === 0 && !loadingAccounts,
    };
  }, [
    allSortedAccountList,
    sortedAccountsList,
    debouncedSearchKeyword,
    matchAccount,
    loadingAccounts,
    addressSortStore.sortType,
  ]);

  const currentAccount = useRabbySelector((s) => s.account.currentAccount);

  const currentAccountIndex = useMemo(() => {
    if (!currentAccount || !enableSwitch) return -1;
    return accountList.findIndex((acc) =>
      (['address', 'brandName', 'type'] as const).every(
        (k) => acc[k]?.toLowerCase() === currentAccount[k]?.toLowerCase()
      )
    );
  }, [accountList, currentAccount, enableSwitch]);

  const gotoAddAddress = useCallback(() => history.push('/add-address'), [
    history,
  ]);
  const gotoManageAddress = useCallback(
    () => history.push('/settings/address?back=true'),
    [history]
  );

  const switchAccount = useCallback(
    async (acc: IDisplayedAccountWithBalance) => {
      await dispatch.account.changeAccountAsync(acc);
      history.push('/dashboard');
    },
    [dispatch.account, history]
  );

  const AddNewAddressColumn = useMemo(
    () => (
      <div
        onClick={gotoAddAddress}
        className="mt-24 h-[52px] flex items-center justify-center gap-[8px] bg-r-neutral-card-1 rounded-lg cursor-pointer"
      >
        <RcIconAddAddress className="text-r-blue-default w-[20px] h-[20px]" />
        <span className="text-13 text-r-blue-default font-medium">
          {t('page.manageAddress.addNewAddress')}
        </span>
      </div>
    ),
    [gotoAddAddress, t]
  );

  const renderAddressRow = (
    acc: IDisplayedAccountWithBalance,
    isLast = false
  ) => {
    const fav = highlightedAddresses.some(
      (h) => h.address === acc.address && h.brandName === acc.brandName
    );

    return (
      <div key={acc.address} className="address-wrap-with-padding px-[20px]">
        <AddressItem
          balance={acc.balance}
          address={acc.address}
          type={acc.type}
          brandName={acc.brandName}
          alias={acc.alianName}
          isUpdatingBalance={isUpdatingBalance}
          enableSwitch={enableSwitch}
          onSwitchCurrentAccount={() => switchAccount(acc)}
          onClick={() =>
            history.push(
              `/settings/address-detail?${obj2query({
                address: acc.address,
                type: acc.type,
                brandName: acc.brandName,
                byImport: String(acc.byImport ?? ''),
              })}`
            )
          }
          extra={
            <div
              className={clsx(
                'icon-star border-none px-0',
                fav ? 'is-active' : 'opacity-0 group-hover:opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation();
                dispatch.addressManagement.toggleHighlightedAddressAsync({
                  address: acc.address,
                  brandName: acc.brandName,
                });
                wallet.emitEvent(EVENTS.RELOAD_ACCOUNT_LIST);
              }}
            >
              <ThemeIcon
                className="w-[13px] h-[13px]"
                src={fav ? RcIconPinnedFill : RcIconPinned}
              />
            </div>
          }
        />

        {isLast && AddNewAddressColumn}
      </div>
    );
  };

  const isWalletConnect =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.WALLETCONNECT;
  const isLedger =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.HARDWARE.LEDGER;
  const isKeystone = accountList[currentAccountIndex]?.brandName === 'Keystone';
  const isGridPlus =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.HARDWARE.GRIDPLUS;
  const isCoinbase =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.Coinbase;

  const hasStatusBar = isWalletConnect || isLedger || isGridPlus || isCoinbase;

  const listHeight =
    currentAccountIndex === -1 ? 471 : hasStatusBar ? 368 : 417;

  return (
    <div className="page-address-management px-0 overflow-hidden">
      <PageHeader className="pt-[24px] mx-[20px]">
        {enableSwitch
          ? t('page.manageAddress.current-address')
          : t('page.manageAddress.address-management')}
        <div className="bg-r-neutral-card1 rounded absolute top-20 right-0 w-[32px] h-[28px] flex items-center justify-center">
          <RcIconAddAddress
            className="text-r-blue-default w-[20px] h-[20px] cursor-pointer"
            onClick={gotoAddAddress}
          />
        </div>
      </PageHeader>
      {currentAccountIndex !== -1 && accountList[currentAccountIndex] && (
        <div className="address-wrap-with-padding px-[20px]">
          <AddressItem
            balance={accountList[currentAccountIndex].balance}
            address={accountList[currentAccountIndex].address}
            type={accountList[currentAccountIndex].type}
            brandName={accountList[currentAccountIndex].brandName}
            alias={accountList[currentAccountIndex].alianName}
            isCurrentAccount
            isUpdatingBalance={isUpdatingBalance}
            onClick={() =>
              history.push(
                `/settings/address-detail?${obj2query({
                  address: accountList[currentAccountIndex].address,
                  type: accountList[currentAccountIndex].type,
                  brandName: accountList[currentAccountIndex].brandName,
                  byImport: String(
                    accountList[currentAccountIndex].byImport ?? ''
                  ),
                })}`
              )
            }
          >
            {isWalletConnect && (
              <SessionStatusBar
                address={accountList[currentAccountIndex].address}
                brandName={accountList[currentAccountIndex].brandName}
                className="m-[16px] mt-0 text-white bg-[#0000001A]"
                type={accountList[currentAccountIndex].type}
              />
            )}
            {isLedger && (
              <LedgerStatusBar className="m-[16px] mt-0 text-white bg-[#0000001A]" />
            )}
            {isKeystone && (
              <KeystoneStatusBar className="m-[16px] mt-0 text-white bg-[#0000001A]" />
            )}
            {isGridPlus && (
              <GridPlusStatusBar className="m-[16px] mt-0 text-white bg-[#0000001A]" />
            )}
            {isCoinbase && (
              <SessionStatusBar
                address={accountList[currentAccountIndex].address}
                brandName={KEYRING_CLASS.Coinbase}
                className="m-[16px] mt-0 text-white bg-[#0000001A]"
                type={KEYRING_CLASS.Coinbase}
              />
            )}
          </AddressItem>
        </div>
      )}
      <div className="flex justify-between items-center text-r-neutral-body text-13 px-20 py-[12px]">
        <SortInput
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />

        <div
          className="flex items-center cursor-pointer"
          onClick={gotoManageAddress}
        >
          <span>{t('page.manageAddress.manage-address')}</span>
          <RcIconRight className="relative top-1" />
        </div>
      </div>
      {noAnyAccount ? (
        <NoAddressUI />
      ) : noAnySearchedAccount ? (
        <NoSearchedAddressUI />
      ) : (
        <div
          className="address-group-list management overflow-y-auto"
          style={{ maxHeight: listHeight }}
        >
          {addressSortStore.sortType === 'addressType'
            ? (filteredAccounts as IDisplayedAccountWithBalance[][]).map(
                (group, gIndex) => (
                  <div key={gIndex} className="address-type-container p-[8px]">
                    {group.map((acc) => renderAddressRow(acc))}
                    {gIndex === filteredAccounts.length - 1 && (
                      <div className="mx-20">{AddNewAddressColumn}</div>
                    )}
                  </div>
                )
              )
            : (filteredAccounts as IDisplayedAccountWithBalance[]).map(
                (acc, idx) =>
                  renderAddressRow(acc, idx === filteredAccounts.length - 1)
              )}
        </div>
      )}
    </div>
  );
};

export default AddressManagement;
