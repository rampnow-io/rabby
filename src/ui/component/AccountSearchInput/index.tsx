import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, InputProps, Popover } from 'antd';
import { TextAreaProps } from 'antd/lib/input/TextArea';
import { groupBy } from 'lodash';
import { useClickAway } from 'react-use';

import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { KEYRING_CLASS } from '@/constant';
import { sortAccountsByBalance } from '@/ui/utils/account';
import useDebounceValue from '@/ui/hooks/useDebounceValue';
import { useThemeMode } from '@/ui/hooks/usePreference';
import cx from 'clsx';

import AddressItem from './AddressItem';
import type { IDisplayedAccountWithBalance } from '@/ui/models/accountToDisplay';
import { useTranslation } from 'react-i18next';
import { ReactComponent as RcNoMatchedAddress } from '@/ui/assets/address/no-matched-addr.svg';
import ThemeIcon from '../ThemeMode/ThemeIcon';

function useSearchAccount(searchKeyword?: string) {
  const {
    accountsList,
    highlightedAddresses = [],
    loadingAccounts,
  } = useRabbySelector((s) => ({
    ...s.accountToDisplay,
    highlightedAddresses: s.addressManagement.highlightedAddresses,
  }));

  const [sortedAccountsList, watchSortedAccountsList] = React.useMemo(() => {
    const restAccounts = [...accountsList];
    let highlightedAccounts: typeof accountsList = [];
    let watchModeHighlightedAccounts: typeof accountsList = [];

    highlightedAddresses.forEach((highlighted) => {
      const idx = restAccounts.findIndex(
        (account) =>
          account.address === highlighted.address &&
          account.brandName === highlighted.brandName
      );
      if (idx > -1) {
        if (restAccounts[idx].type === KEYRING_CLASS.WATCH) {
          watchModeHighlightedAccounts.push(restAccounts[idx]);
        } else {
          highlightedAccounts.push(restAccounts[idx]);
        }
        restAccounts.splice(idx, 1);
      }
    });

    const data = groupBy(restAccounts, (e) =>
      e.type === KEYRING_CLASS.WATCH ? '1' : '0'
    );

    highlightedAccounts = sortAccountsByBalance(highlightedAccounts);
    watchModeHighlightedAccounts = sortAccountsByBalance(
      watchModeHighlightedAccounts
    );

    return [
      highlightedAccounts.concat(data['0'] || []).filter(Boolean),
      watchModeHighlightedAccounts.concat(data['1'] || []).filter(Boolean),
    ];
  }, [accountsList, highlightedAddresses]);

  const debouncedSearchKeyword = useDebounceValue(searchKeyword, 250);

  const {
    accountList,
    filteredAccounts,
    noAnyAccount,
    noAnySearchedAccount,
  } = useMemo(() => {
    const result = {
      accountList: [
        ...(sortedAccountsList || []),
        ...(watchSortedAccountsList || []),
      ],
      filteredAccounts: [] as typeof sortedAccountsList,
      noAnyAccount: false,
      noAnySearchedAccount: false,
    };

    result.filteredAccounts = [...result.accountList];

    if (debouncedSearchKeyword) {
      const lKeyword = debouncedSearchKeyword.toLowerCase();
      result.filteredAccounts = result.accountList.filter((account) => {
        const aliasName = account.alianName?.toLowerCase();
        let addrIncludeKw = false;
        if (lKeyword.replace(/^0x/, '').length >= 2) {
          addrIncludeKw = account.address.toLowerCase().includes(lKeyword);
        }
        return aliasName?.includes(lKeyword) || addrIncludeKw;
      });
    }

    result.noAnyAccount = result.accountList.length <= 0 && !loadingAccounts;
    result.noAnySearchedAccount =
      !!debouncedSearchKeyword &&
      result.filteredAccounts.length <= 0 &&
      !loadingAccounts;

    return result;
  }, [sortedAccountsList, watchSortedAccountsList, debouncedSearchKeyword]);

  const dispatch = useRabbyDispatch();

  useEffect(() => {
    dispatch.addressManagement.getHilightedAddressesAsync().then(() => {
      dispatch.accountToDisplay.getAllAccountsToDisplay();
    });
  }, []);

  return {
    accountList,
    filteredAccounts,
    noAnyAccount,
    noAnySearchedAccount,
  };
}

function NoSearchedAddressUI() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-[120px]">
      <ThemeIcon className="w-[28px] h-[28px]" src={RcNoMatchedAddress} />
      <p className="text-[13px] mt-[10px] text-r-neutral-body">
        {t('component.AccountSearchInput.noMatchAddress')}
      </p>
    </div>
  );
}

interface AccountSearchInputProps extends TextAreaProps {
  onSelectedAccount?: (account: IDisplayedAccountWithBalance) => void;
}

const AccountSearchInput = React.forwardRef<any, AccountSearchInputProps>(
  (
    {
      onSelectedAccount,
      value,
      onChange,
      ...inputProps
    }: AccountSearchInputProps,
    ref
  ) => {
    const searchKeyword = useMemo(() => value + '', [value]);
    const { filteredAccounts, noAnySearchedAccount } = useSearchAccount(
      searchKeyword
    );
    const { isDarkTheme } = useThemeMode();

    const [inputFocusing, setInputFocusing] = useState(false);
    const isInputAddrLike = useMemo(
      () => searchKeyword?.startsWith('0x') && searchKeyword?.length === 42,
      [searchKeyword]
    );

    const wrapperRef = useRef<HTMLDivElement>(null);

    useClickAway(wrapperRef, (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as HTMLElement)) {
        setInputFocusing(false);
      }
    });

    return (
      <div ref={wrapperRef} className="w-full">
        <Popover
          trigger={['none']}
          visible={!!searchKeyword && !isInputAddrLike && inputFocusing}
          placement="bottom"
          className="account-search-popover-input"
          overlayClassName={cx(
            'w-[336px]',
            '[&_.ant-popover-arrow]:hidden',
            '[&_.ant-popover-inner-content]:rounded-md',
            '[&_.ant-popover-inner-content]:p-1',
            '[&_.ant-popover-inner-content]:max-h-[194px]',
            '[&_.ant-popover-inner-content]:overflow-auto',
            '[&_.ant-popover-inner-content]:border',
            '[&_.ant-popover-inner-content]:border-[var(--r-neutral-line,#d3d8e0)]',
            '[&_.ant-popover-inner-content]:bg-[var(--r-neutral-bg-1,#fff)]',
            {
              'dark:[&_.ant-popover-inner]:shadow-[0_8px_24px_rgba(0,0,0,0.4)]': isDarkTheme,
            }
          )}
          align={{ targetOffset: [0, 10] }}
          getPopupContainer={() => wrapperRef.current || document.body}
          destroyTooltipOnHide
          content={
            <div className="max-h-[400px] overflow-auto py-[8px]">
              {noAnySearchedAccount ? (
                <NoSearchedAddressUI />
              ) : (
                filteredAccounts.map((account, idx) => (
                  <div
                    key={`account-${account.brandName}-${account.address}-${idx}`}
                    className="px-4 py-2 hover:bg-r-neutral-card-2 cursor-pointer transition-colors"
                  >
                    <AddressItem
                      balance={account.balance}
                      address={account.address}
                      type={account.type}
                      brandName={account.brandName}
                      alias={account.alianName}
                      onConfirm={() => onSelectedAccount?.(account)}
                    />
                  </div>
                ))
              )}
            </div>
          }
        >
          <Input.TextArea
            autoComplete="off"
            autoFocus
            autoSize
            spellCheck={false}
            {...inputProps}
            ref={ref}
            value={searchKeyword}
            className={cx(
              'border transition-colors',
              'hover:border-[var(--r-blue-default,#7084ff)]',
              'focus:border-[var(--r-blue-default,#7084ff)]'
            )}
            onChange={onChange}
            onFocus={(e) => {
              setInputFocusing(true);
              inputProps.onFocus?.(e);
            }}
          />
        </Popover>
      </div>
    );
  }
);

export default AccountSearchInput;
