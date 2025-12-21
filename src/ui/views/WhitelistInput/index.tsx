import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { Switch, message } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { isValidAddress } from '@ethereumjs/util';

import { FullscreenContainer } from '@/ui/component/FullscreenContainer';
import { getUiType, isSameAddress, useWallet } from '@/ui/utils';
import { PageHeader } from '@/ui/component';
import { connectStore, useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { AddressRiskAlert } from '@/ui/component/AddressRiskAlert';
import { CexListSelectModal, IExchange } from '@/ui/component/CexSelect';
import { AccountSelectorModal } from '@/ui/component/AccountSelector/AccountSelectorModal';

// icons
import { ReactComponent as RcIconWarningCC } from '@/ui/assets/warning-cc.svg';
import { ReactComponent as RcIconDownCC } from '@/ui/assets/dashboard/arrow-down-cc.svg';
import IconSuccess from 'ui/assets/success.svg';
import { IconClearCC } from '@/ui/assets/component/IconClear';
import { ReactComponent as RcIconContactCC } from '@/ui/assets/contact-cc.svg';
import { Button, Input } from '@repo/ui/primitives';

const isTab = getUiType().isTab;
const isDesktop = getUiType().isDesktop;
const getContainer =
  isTab || isDesktop ? '.js-rabby-popup-container' : undefined;

const SectionHeader = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: var(--r-neutral-title1);
`;

const AliasInputWrapper = styled.div`
  .ant-input {
    font-size: 15px !important;
  }
`;

const WhitelistInput = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();

  const { exchanges } = useRabbySelector((s) => ({
    exchanges: s.exchange.exchanges,
  }));

  const [inputAddress, setInputAddress] = useState('');
  const [inputAlias, setInputAlias] = useState('');
  const [isCex, setIsCex] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<IExchange | null>(
    null
  );

  const [isValidAddr, setIsValidAddr] = useState(true);
  const [showAddressRiskAlert, setShowAddressRiskAlert] = useState(false);
  const [showCexListModal, setShowCexListModal] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [isFocusAddress, setIsFocusAddress] = useState(false);
  const [isFocusAlias, setIsFocusAlias] = useState(false);

  const resetState = useCallback(() => {
    setInputAddress('');
    setInputAlias('');
    setIsCex(false);
    setSelectedExchange(null);
    setIsValidAddr(true);
    wallet.setPageStateCache({ path: '/whitelist-input', states: {} });
  }, [wallet]);

  const handleClickBack = useCallback(() => {
    history.length > 1 ? history.goBack() : history.replace('/');
    wallet.clearPageStateCache();
  }, [history, wallet]);

  const detectAddress = useCallback(
    async (address: string) => {
      if (!isValidAddress(address)) return;

      const cexId = await wallet.getCexId(address);
      const local = exchanges.find(
        (e) => e.id.toLowerCase() === cexId?.toLowerCase()
      );

      if (cexId && local) {
        setIsCex(true);
        setSelectedExchange(local);
      }

      const alias = await wallet.getAlianName(address);
      setInputAlias(alias || '');
    },
    [exchanges, wallet]
  );

  const handleInputChangeAddress = useCallback(
    (v: string) => {
      setInputAddress(v);

      if (!isValidAddress(v)) {
        setIsValidAddr(!v);
        setIsCex(false);
        setSelectedExchange(null);
      } else {
        setIsValidAddr(true);
        detectAddress(v);
      }

      wallet.setPageStateCache({
        path: '/whitelist-input',
        states: { inputAddress: v },
      });
    },
    [detectAddress, wallet]
  );

  const confirmToWhitelist = async (address: string) => {
    dispatch.whitelist.getWhitelist();
    await wallet.updateAlianName(
      address,
      inputAlias || '',
      isCex && selectedExchange?.id ? selectedExchange.id : ''
    );
    setShowAddressRiskAlert(false);
    wallet.clearPageStateCache();
    handleClickBack();
    message.success({
      icon: <img src={IconSuccess} className="icon icon-success" />,
      content: t('page.whitelist.tips.added'),
    });
  };

  const handleSubmit = async () => {
    if (!isValidAddress(inputAddress)) {
      setIsValidAddr(false);
      return;
    }

    const whitelist = await wallet.getWhitelist();
    if (whitelist.some((a) => isSameAddress(a, inputAddress))) {
      message.error({ content: t('page.whitelist.tips.repeated') });
      return;
    }

    setShowAddressRiskAlert(true);
  };

  return (
    <FullscreenContainer className={isDesktop ? 'h-[600px]' : 'h-[700px]'}>
      <div
        className={clsx(
          'send-token px-4 flex flex-col h-full',
          isDesktop || isTab
            ? 'rounded-[8px] shadow-[0px_40px_80px_rgba(43,57,143,0.4)]'
            : ''
        )}
      >
        <PageHeader onBack={handleClickBack} forceShowBack>
          {t('page.whitelist.title')}
        </PageHeader>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-auto flex flex-col gap-[20px] mt-[20px]">
          <div className="flex flex-col gap-[8px] relative">
            <div className="flex justify-between items-center">
              <SectionHeader>{t('page.whitelist.address')}</SectionHeader>
              <RcIconContactCC
                width={20}
                height={20}
                className="cursor-pointer"
                onClick={() => setShowAddressSelector(true)}
              />
            </div>

            <Input
              maxLength={44}
              placeholder={t('page.whitelist.enterAddress')}
              value={inputAddress}
              onFocus={() => setIsFocusAddress(true)}
              onBlur={() => setIsFocusAddress(false)}
              onChange={(e) => handleInputChangeAddress(e.target.value)}
            />

            <div className="absolute right-[16px] bottom-[16px]">
              <IconClearCC
                onClick={() => handleInputChangeAddress('')}
                className={clsx(
                  isFocusAddress && inputAddress ? 'opacity-100' : 'opacity-0'
                )}
              />
            </div>

            {!isValidAddr && (
              <div className="text-r-red-default text-[13px] flex gap-[4px]">
                <RcIconWarningCC />
                {t('page.whitelist.invalidAddress')}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[8px]">
            <SectionHeader>{t('page.whitelist.name')}</SectionHeader>
            <AliasInputWrapper className="relative">
              <Input
                value={inputAlias}
                placeholder={t('page.whitelist.nameYourAddress')}
                onFocus={() => setIsFocusAlias(true)}
                onBlur={() => setIsFocusAlias(false)}
                onChange={(e) => setInputAlias(e.target.value)}
              />
              <div className="absolute right-[16px] bottom-[16px]">
                <IconClearCC
                  onClick={() => setInputAlias('')}
                  className={clsx(
                    isFocusAlias && inputAlias ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </div>
            </AliasInputWrapper>
          </div>

          <div className="flex justify-between items-center">
            <SectionHeader>{t('page.whitelist.exchangeAddress')}</SectionHeader>
            <Switch checked={isCex} onChange={setIsCex} />
          </div>
        </main>

        <div className="border-t bg-r-neutral-bg2 p-4">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!isValidAddr || !inputAddress}
          >
            {t('global.confirm')}
          </Button>
        </div>
      </div>

      <AddressRiskAlert
        address={inputAddress}
        visible={showAddressRiskAlert}
        getContainer={getContainer}
        editAlias={inputAlias}
        editCex={isCex ? selectedExchange : null}
        forWhitelist
        onConfirm={() => confirmToWhitelist(inputAddress)}
        onCancel={() => setShowAddressRiskAlert(false)}
      />

      <CexListSelectModal
        visible={showCexListModal}
        onCancel={() => setShowCexListModal(false)}
        onSelect={(cex) => {
          setSelectedExchange(cex);
          setShowCexListModal(false);
        }}
        getContainer={getContainer}
      />

      <AccountSelectorModal
        visible={showAddressSelector}
        onChange={(acc) => handleInputChangeAddress(acc.address)}
        onCancel={() => setShowAddressSelector(false)}
        getContainer={getContainer}
      />
    </FullscreenContainer>
  );
};

export default connectStore()(WhitelistInput);
