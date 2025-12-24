import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';

import { HeaderNavPage, PageHeader } from 'ui/component';
import AddressItem from './AddressItem';

import { ReactComponent as RcIconPinned } from 'ui/assets/icon-pinned.svg';
import { ReactComponent as RcIconPinnedFill } from 'ui/assets/icon-pinned-fill.svg';
import { ReactComponent as RcIconAddAddress } from '@/ui/assets/address/new-address.svg';
import { ReactComponent as RcIconRight } from '@/ui/assets/address/right.svg';
import { ReactComponent as RcNoMatchedAddress } from '@/ui/assets/address/no-matched-addr.svg';

import { obj2query } from '@/ui/utils/url';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import clsx from 'clsx';

import { EVENTS, KEYRING_CLASS } from '@/constant';
import { useRequest } from 'ahooks';

import { SessionStatusBar } from '@/ui/component/WalletConnect/SessionStatusBar';
import { LedgerStatusBar } from '@/ui/component/ConnectStatus/LedgerStatusBar';
import { GridPlusStatusBar } from '@/ui/component/ConnectStatus/GridPlusStatusBar';
import { KeystoneStatusBar } from '@/ui/component/ConnectStatus/KeystoneStatusBar';

import useDebounceValue from '@/ui/hooks/useDebounceValue';
import { IDisplayedAccountWithBalance } from '@/ui/models/accountToDisplay';

import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useAccounts } from '@/ui/hooks/useAccounts';
import { useWallet } from '@/ui/utils';
import { Button } from '@repo/ui/primitives';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content } from '@repo/ui';
import SectionHeader from '@/ui/component/section-header/section-header';

/* ---------- empty states ---------- */

function NoAddressUI() {
  const { t } = useTranslation();
  return (
    <div className="pt-[90px] flex flex-col items-center">
      <ThemeIcon className="w-[52px] h-[52px]" src={RcNoMatchedAddress} />
      <p className="text-14 text-r-neutral-body mt-[24px]">
        {t('page.manageAddress.no-address')}
      </p>
    </div>
  );
}

function NoSearchedAddressUI() {
  const { t } = useTranslation();
  return (
    <div className="pt-[90px] flex flex-col items-center">
      <ThemeIcon className="w-[52px] h-[52px]" src={RcNoMatchedAddress} />
      <p className="text-14 text-r-neutral-body mt-[24px]">
        {t('page.manageAddress.no-match')}
      </p>
    </div>
  );
}

/* ---------- main ---------- */

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

  const { loading: isUpdatingBalance } = useRequest(
    () => dispatch.accountToDisplay.updateAllBalance(),
    { manual: true }
  );

  const matchAccount = useCallback(
    (acc: IDisplayedAccountWithBalance, kw: string) => {
      const lower = acc.address.toLowerCase();
      const alias = acc.alianName?.toLowerCase() ?? '';
      const allowPartial = kw.replace(/^0x/, '').length >= 2;
      return (
        lower === kw ||
        alias.includes(kw) ||
        (allowPartial && lower.includes(kw))
      );
    },
    []
  );

  const {
    filteredAccounts,
    accountList,
    noAnyAccount,
    noAnySearchedAccount,
  } = useMemo(() => {
    const base = allSortedAccountList;
    let list: any =
      addressSortStore.sortType === 'addressType' ? sortedAccountsList : base;

    if (debouncedSearchKeyword) {
      const kw = debouncedSearchKeyword.toLowerCase();
      list =
        addressSortStore.sortType === 'addressType'
          ? list
              .map((g: any[]) => g.filter((a) => matchAccount(a, kw)))
              .filter((g: any[]) => g.length > 0)
          : list.filter((a: any) => matchAccount(a, kw));
    }

    return {
      filteredAccounts: list,
      accountList: base,
      noAnyAccount: base.length === 0 && !loadingAccounts,
      noAnySearchedAccount: list.length === 0 && !loadingAccounts,
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
      ['address', 'brandName', 'type'].every(
        (k) => acc[k]?.toLowerCase() === currentAccount[k]?.toLowerCase()
      )
    );
  }, [accountList, currentAccount, enableSwitch]);

  const gotoAddAddress = () => history.push('/add-address');
  const gotoManageAddress = () => history.push('/settings/address?back=true');

  const switchAccount = async (acc: IDisplayedAccountWithBalance) => {
    await dispatch.account.changeAccountAsync(acc);
    history.push('/dashboard');
  };

  const renderAddressRow = (acc: IDisplayedAccountWithBalance) => {
    const fav = highlightedAddresses.some(
      (h) => h.address === acc.address && h.brandName === acc.brandName
    );

    return (
      <div key={acc.address} className="px-[20px] mb-3">
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
                fav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
      </div>
    );
  };

  /* ---------- status checks ---------- */
  const isWalletConnect =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.WALLETCONNECT;
  const isLedger =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.HARDWARE.LEDGER;
  const isKeystone = accountList[currentAccountIndex]?.brandName === 'Keystone';
  const isGridPlus =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.HARDWARE.GRIDPLUS;
  const isCoinbase =
    accountList[currentAccountIndex]?.type === KEYRING_CLASS.Coinbase;

  return (
    <UIContainer>
      <Container>
        <HeaderNavPage />
        <SectionHeader
          className="text-center"
          title={
            enableSwitch
              ? t('page.manageAddress.current-address')
              : t('page.manageAddress.address-management')
          }
        />
        <Content>
          {/* ✅ CURRENT ADDRESS – DO NOT REMOVE */}
          {currentAccountIndex !== -1 && accountList[currentAccountIndex] && (
            <div className="px-[20px] mb-4">
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
                    type={accountList[currentAccountIndex].type}
                    className="m-[16px] mt-0 bg-[#0000001A]"
                  />
                )}
                {isLedger && (
                  <LedgerStatusBar className="m-[16px] mt-0 bg-[#0000001A]" />
                )}
                {isKeystone && (
                  <KeystoneStatusBar className="m-[16px] mt-0 bg-[#0000001A]" />
                )}
                {isGridPlus && (
                  <GridPlusStatusBar className="m-[16px] mt-0 bg-[#0000001A]" />
                )}
                {isCoinbase && (
                  <SessionStatusBar
                    address={accountList[currentAccountIndex].address}
                    brandName={KEYRING_CLASS.Coinbase}
                    type={KEYRING_CLASS.Coinbase}
                    className="m-[16px] mt-0 bg-[#0000001A]"
                  />
                )}
              </AddressItem>
            </div>
          )}

          {/* Manage link */}
          <div className="flex justify-end items-center text-13 px-5 py-2">
            <div
              className="flex items-center cursor-pointer"
              onClick={gotoManageAddress}
            >
              <span>{t('page.manageAddress.manage-address')}</span>
              <RcIconRight className="relative top-1" />
            </div>
          </div>

          {/* List */}
          {noAnyAccount ? (
            <NoAddressUI />
          ) : noAnySearchedAccount ? (
            <NoSearchedAddressUI />
          ) : (
            <div className="overflow-y-auto pb-[100px]">
              {(filteredAccounts as IDisplayedAccountWithBalance[]).map(
                renderAddressRow
              )}
            </div>
          )}
        </Content>
        <Action>
          <Button onClick={gotoAddAddress} className="w-full">
            {t('page.manageAddress.addNewAddress')}
          </Button>
        </Action>
      </Container>
    </UIContainer>
  );
};

export default AddressManagement;
