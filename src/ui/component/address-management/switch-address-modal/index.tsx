import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { X, Eye, EyeOff } from 'lucide-react';
import { useRequest } from 'ahooks';
import { truncate } from '@repo/utils';

import {
  Action,
  BottomDrawer,
  Container,
  Content,
  useEventRef,
} from '@repo/ui';
import { Button, ButtonType } from '@repo/ui/primitives';

import { IDisplayedAccountWithBalance } from '@/ui/models/accountToDisplay';
import { useAccounts } from '@/ui/hooks/useAccounts';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { obj2query } from '@/ui/utils/url';
import useDebounceValue from '@/ui/hooks/useDebounceValue';
import { getAvatarColor, getAvatarColorStyle } from '../utils';

import AddressCard from './address-card/address-card';
import AddWalletModal from '../add-wallet';
import { UIContainer } from '@/ui/provider';

import AddWalletModalTrigger from '../add-wallet';

const SwitchAddress = () => {
  const history = useHistory();
  const dispatch = useRabbyDispatch();

  const [addWalletVisible, setAddWalletVisible] = useState(false);
  const [hiddenBalance, setHiddenBalance] = useState(false);

  const enableSwitch = true;

  const {
    sortedAccountsList,
    addressSortStore,
    fetchAllAccounts,
    loadingAccounts,
    allSortedAccountList,
  } = useAccounts();

  const { loading: isUpdatingBalance } = useRequest(
    () => dispatch.accountToDisplay.updateAllBalance(),
    { manual: true }
  );

  const [searchKeyword, setSearchKeyword] = useState(
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

  const matchAccount = useCallback(
    (acc: IDisplayedAccountWithBalance, kw: string) => {
      const lower = acc.address.toLowerCase();
      const alias = acc.alianName?.toLowerCase() ?? '';
      return lower.includes(kw) || alias.includes(kw);
    },
    []
  );

  const filteredAccounts = useMemo(() => {
    const base =
      addressSortStore.sortType === 'addressType'
        ? sortedAccountsList
        : allSortedAccountList;

    if (!debouncedSearchKeyword) return base;

    const kw = debouncedSearchKeyword.toLowerCase();

    if (Array.isArray(base[0])) {
      return (base as IDisplayedAccountWithBalance[][])
        .map((g) => g.filter((a) => matchAccount(a, kw)))
        .filter((g) => g.length > 0);
    }

    return (base as IDisplayedAccountWithBalance[]).filter((a) =>
      matchAccount(a, kw)
    );
  }, [
    allSortedAccountList,
    sortedAccountsList,
    debouncedSearchKeyword,
    matchAccount,
    addressSortStore.sortType,
  ]);

  const flatAccounts = useMemo(() => {
    return Array.isArray(filteredAccounts[0])
      ? (filteredAccounts as IDisplayedAccountWithBalance[][]).flat()
      : (filteredAccounts as IDisplayedAccountWithBalance[]);
  }, [filteredAccounts]);

  const currentAccount = useRabbySelector((s) => s.account.currentAccount);

  const currentAccountIndex = useMemo(() => {
    if (!currentAccount) return -1;
    return allSortedAccountList.findIndex((acc) =>
      ['address', 'brandName', 'type'].every(
        (k) => acc[k]?.toLowerCase() === currentAccount[k]?.toLowerCase()
      )
    );
  }, [allSortedAccountList, currentAccount]);

  const switchAccount = async (acc: IDisplayedAccountWithBalance) => {
    await dispatch.account.changeAccountAsync(acc);
    history.push('/dashboard');
  };

  const handleAddNewAddress = () => {
    history.push('/add-new-wallet');
  };

  const handleToggleBalance = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setHiddenBalance((v) => !v);
  };

  return (
    <UIContainer>
      <Container>
        <div className="p-6 flex justify-between items-center">
          <X
            size={24}
            onClick={() => {
              history.goBack();
            }}
            className="cursor-pointer text-gray-600 hover:text-gray-800"
          />
          <div className="text-2xl font-medium">Wallets</div>
          <div className="w-6" />
        </div>

        {currentAccount &&
          currentAccountIndex >= 0 &&
          allSortedAccountList[currentAccountIndex] && (
            <div className="mb-10 bg-white">
              <div className="relative w-[305px] h-[250px] mx-auto bg-black rounded-[36px] flex flex-col items-center justify-center">
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2
                     w-[284px] h-[70px] 
                     rounded-t-[28px]
                       border border-[#BFBDFF] bg-[#D2D0FF]"
                />

                <div
                  className="absolute top-5 left-1/2 -translate-x-1/2
                     w-[284px] h-[70px]
                     rounded-t-[28px]
                     border  border-[#94C3FF] bg-[#A8CEFE]"
                />

                <div
                  className="absolute top-12 left-1/2 -translate-x-1/2
                     w-[284px] h-[90px]
                     rounded-[26px]
                     border  border-[#DCFFB3] bg-[#F1FFE1]
                     p-4"
                >
                  <div className="flex gap-2 items-center">
                    {(() => {
                      const colorOrClass = allSortedAccountList[
                        currentAccountIndex
                      ]?.color
                        ? getAvatarColor(
                            allSortedAccountList[currentAccountIndex]?.color
                          )
                        : 'bg-[#DCFFB3]';
                      const avatarClass = colorOrClass?.startsWith('#')
                        ? ''
                        : colorOrClass;
                      const avatarStyle = getAvatarColorStyle(colorOrClass);

                      return (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-base font-medium ${avatarClass}`}
                          style={
                            avatarStyle || {
                              backgroundColor: '#DCFFB3',
                              color: '#000',
                            }
                          }
                        >
                          {allSortedAccountList[currentAccountIndex].alianName
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      );
                    })()}

                    <div>
                      <div className="text-[8px] font-medium text-primary-foreground">
                        {allSortedAccountList[currentAccountIndex].alianName ||
                          `Account ${currentAccountIndex + 1}`}
                      </div>

                      <div className="text-[10px] font-medium text-primary-foreground">
                        {truncate(
                          allSortedAccountList[currentAccountIndex].address,
                          [6, 4]
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2
             w-[305px] h-[140px]
             rounded-t-[20px] rounded-b-[36px]
             bg-black
             flex flex-col items-center justify-center gap-2
             cursor-pointer
             overflow-hidden"
                  onClick={handleToggleBalance}
                >
                  {/* SVG LEATHER OVERLAY */}
                  <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                    <filter id="noise">
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.8"
                        numOctaves="2"
                      />
                    </filter>
                    <rect
                      width="100%"
                      height="100%"
                      filter="url(#noise)"
                      fill="white"
                    />
                  </svg>

                  {/* CONTENT */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    {hiddenBalance ? (
                      <div className="text-xl tracking-widest text-white">
                        *****
                      </div>
                    ) : (
                      <div className="text-xl font-semibold text-white">
                        $
                        {Number(
                          allSortedAccountList[currentAccountIndex]?.balance ||
                            0
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    )}

                    <div className="text-[11px] text-gray-500">
                      Total Balance
                    </div>

                    <div className="mt-1 text-gray-500">
                      {hiddenBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ACCOUNT LIST */}
        <Content>
          {flatAccounts.map((acc) => (
            <div key={acc.address} className="mb-3">
              <AddressCard
                balance={acc.balance}
                address={acc.address}
                type={acc.type}
                brandName={acc.brandName}
                alias={acc.alianName}
                color={acc.color}
                isUpdatingBalance={isUpdatingBalance}
                enableSwitch={enableSwitch}
                isCurrentAccount={
                  currentAccount?.address?.toLowerCase() ===
                  acc.address.toLowerCase()
                }
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
              />
            </div>
          ))}
        </Content>

        {/* ADD WALLET */}
        <Action>
          <Button
            buttonType={ButtonType.SECONDARY}
            onClick={handleAddNewAddress}
            className="w-full py-3 rounded-full"
          >
            Add new wallet
          </Button>
        </Action>
      </Container>
    </UIContainer>
  );
};

export default SwitchAddress;
