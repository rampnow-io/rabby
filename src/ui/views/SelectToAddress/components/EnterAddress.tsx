import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isValidAddress } from '@ethereumjs/util';
import { debounce, flatten } from 'lodash';
import styled from 'styled-components';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';

import { isSameAddress, useAlias, useCexId, useWallet } from 'ui/utils';

import { IconClearCC } from '@/ui/assets/component/IconClear';
import { ReactComponent as RcIconWarningCC } from '@/ui/assets/warning-cc.svg';
import { AccountList } from './AccountList';
import { useAccounts } from '@/ui/hooks/useAccounts';
import { AddressTypeCard } from '@/ui/component/AddressRiskAlert';
import { KEYRING_TYPE } from '@/constant';
import { ellipsisAddress } from '@/ui/utils/address';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  Input,
} from '@repo/ui/primitives';

/* ---------------------------------- */
/* Address Type Card (FIXED)           */
/* ---------------------------------- */
const WhitelistAddressTypeCard = ({
  address,
  type,
  brandName,
}: {
  address?: string;
  type?: string;
  brandName?: string;
}) => {
  if (!address || !isValidAddress(address)) {
    return null;
  }

  const [cexInfo] = useCexId(address);
  const [aliasName] = useAlias(address);

  const resolvedType = useMemo(() => type || KEYRING_TYPE.WatchAddressKeyring, [
    type,
  ]);

  const resolvedBrandName = useMemo(() => brandName || resolvedType, [
    brandName,
    resolvedType,
  ]);

  const displayAlias = useMemo(() => aliasName || ellipsisAddress(address), [
    aliasName,
    address,
  ]);

  return (
    <div className="mt-[20px] w-full">
      <AddressTypeCard
        address={address}
        type={resolvedType}
        brandName={resolvedBrandName}
        allowEditAlias
        aliasName={displayAlias}
        className="bg-r-neutral-card1"
        cexInfo={{
          id: cexInfo?.id,
          name: cexInfo?.name,
          logo: cexInfo?.logo,
          isDeposit: Boolean(cexInfo?.id),
        }}
      />
    </div>
  );
};

/* ---------------------------------- */
/* Main Component                      */
/* ---------------------------------- */
export const EnterAddress = ({
  onNext,
  onCancel,
}: {
  onNext: (address: string, type?: string) => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();

  const { fetchAllAccounts, allSortedAccountList } = useAccounts();
  const { whitelist } = useRabbySelector((s) => ({
    whitelist: s.whitelist.whitelist,
  }));

  const textareaRef = useRef<HTMLInputElement>(null);

  const form = useForm<{ address: string }>({
    defaultValues: { address: '' },
  });

  const address = form.watch('address');

  const [ensResult, setEnsResult] = useState<{
    addr: string;
    name: string;
  } | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [isFocusAddress, setIsFocusAddress] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  /* ---------- derived ---------- */
  const isValidAddr = useMemo(() => isValidAddress(address), [address]);

  const hasError = !!address && !isValidAddr && !ensResult?.addr;
  const disableSubmit = !address || hasError;

  const filteredAccounts = useMemo(() => {
    const lower = address.toLowerCase();
    const flattened = flatten(allSortedAccountList);
    if (!lower) return flattened;

    return flattened.filter((acc) => {
      return (
        acc.address.toLowerCase().includes(lower) ||
        acc.brandName?.toLowerCase().includes(lower) ||
        acc.alianName?.toLowerCase().includes(lower)
      );
    });
  }, [allSortedAccountList, address]);

  const showSearchError = hasError && !filteredAccounts.length;

  /* ---------- effects ---------- */
  useEffect(() => {
    fetchAllAccounts();
    dispatch.whitelist.getWhitelist();
    const timer = setTimeout(() => setShouldRender(true), 300);
    return () => clearTimeout(timer);
  }, [fetchAllAccounts, dispatch.whitelist]);

  const handleConfirmENS = (addr: string) => {
    form.setValue('address', addr);
    setTags([`ENS: ${ensResult?.name || ''}`]);
    setEnsResult(null);
  };

  const handleValuesChange = useMemo(
    () =>
      debounce(async (value: string) => {
        setTags([]);
        if (!isValidAddress(value)) {
          try {
            const result = await wallet.openapi.getEnsAddressByName(value);
            setEnsResult(result?.addr ? result : null);
          } catch {
            setEnsResult(null);
          }
        } else {
          setEnsResult(null);
        }
      }, 300),
    [wallet]
  );

  const onSubmit = () => {
    const finalAddress = ensResult?.addr || address;
    if (finalAddress && isValidAddress(finalAddress)) {
      onNext(finalAddress);
    }
  };

  /* ---------- render ---------- */
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {/* ========== SCROLLABLE CONTENT ========== */}
        <div className="flex-1 overflow-auto">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      ref={textareaRef}
                      maxLength={44}
                      placeholder={t('page.selectToAddress.enterAddressOrENS')}
                      spellCheck={false}
                      className={clsx(
                        'h-[80px] rounded-[8px]',
                        showSearchError && 'border border-r-red-default'
                      )}
                      onFocus={() => setIsFocusAddress(true)}
                      onBlur={() => setIsFocusAddress(false)}
                      onChange={(e) => {
                        field.onChange(e);
                        handleValuesChange(e.target.value);
                      }}
                    />

                    <div className="absolute right-[16px] bottom-[16px]">
                      <IconClearCC
                        onClick={() => {
                          form.setValue('address', '');
                          handleValuesChange('');
                          textareaRef.current?.focus();
                        }}
                        className={clsx(
                          isFocusAddress && address
                            ? 'opacity-100 cursor-pointer'
                            : 'opacity-0'
                        )}
                      />
                    </div>
                  </div>
                </FormControl>

                {showSearchError && (
                  <div className="mt-[8px] text-r-red-default text-[13px] flex gap-[4px]">
                    <RcIconWarningCC />
                    {t('page.whitelist.invalidAddress')}
                  </div>
                )}
              </FormItem>
            )}
          />

          {tags.length > 0 && (
            <ul className="mt-[13px]">
              {tags.map((tag) => (
                <li key={tag} className="text-[13px] text-r-neutral-body">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {ensResult && (
            <div
              className="mt-[12px] p-[12px] bg-r-neutral-card1 rounded-[8px] cursor-pointer"
              onClick={() => handleConfirmENS(ensResult.addr)}
            >
              {ensResult.addr}
            </div>
          )}

          {isValidAddr && (
            <WhitelistAddressTypeCard
              address={address}
              type={
                filteredAccounts?.[0]?.address &&
                isSameAddress(address, filteredAccounts[0].address)
                  ? filteredAccounts[0].type
                  : KEYRING_TYPE.WatchAddressKeyring
              }
              brandName={
                filteredAccounts?.[0]?.address &&
                isSameAddress(address, filteredAccounts[0].address)
                  ? filteredAccounts[0].brandName
                  : undefined
              }
            />
          )}

          {shouldRender && !isValidAddr && (
            <AccountList
              list={filteredAccounts}
              whitelist={whitelist}
              onChange={(acc) => onNext(acc.address, acc.type)}
            />
          )}
        </div>

        {/* ========== FIXED BOTTOM BUTTON ========== */}
        {shouldRender && (
          <div className="border-t bg-r-neutral-bg2 p-[16px]">
            <Button
              type="submit"
              disabled={disableSubmit}
              className="w-full h-[48px] text-[16px]"
            >
              {t('global.confirm')}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
