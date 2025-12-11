import { Modal } from '@/ui/component';
import { Button, message } from 'antd';
import { Account } from 'background/service/preference';
import QRCode from 'qrcode.react';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { ReactComponent as IconBack } from 'ui/assets/back.svg';
import { ReactComponent as RcIconCopy } from 'ui/assets/icon-copy-1-cc.svg';
import IconEyeHide from 'ui/assets/icon-eye-hide.svg';
import IconEye from 'ui/assets/icon-eye.svg';
import { ReactComponent as RcIconWarning } from 'ui/assets/icon-warning-large.svg';
import {
  KEYRING_CLASS,
  KEYRING_ICONS_WHITE,
  WALLET_BRAND_CONTENT,
} from 'consts';
import { splitNumberByStep, useWallet } from 'ui/utils';
import { query2obj } from 'ui/utils/url';
import { getKRCategoryByType } from '@/utils/transaction';
import { filterRbiSource, useRbiSource } from '@/ui/utils/ga-event';
import { findChainByEnum } from '@/utils/chain';
import { useTranslation } from 'react-i18next';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { copyAddress } from '@/ui/utils/clipboard';

const useAccount = () => {
  const wallet = useWallet();
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<string>();
  const [name, setName] = useState<string>();
  const [cacheBalance, setCacheBalance] = useState<number>();
  const [balance, setBalance] = useState<number>();

  useEffect(() => {
    wallet.syncGetCurrentAccount().then((a) => {
      setAccount(a);
      setAddress(a?.address.toLowerCase());
    });
  }, []);

  useEffect(() => {
    if (!address) return;

    wallet.getAlianName(address).then(setName);
    wallet
      .getAddressCacheBalance(address)
      .then((d) => setCacheBalance(d?.total_usd_value || 0));
    wallet
      .getInMemoryAddressBalance(address)
      .then((d) => setBalance(d.total_usd_value));

  }, [address]);

  return {
    ...account,
    address,
    name,
    balance: balance ?? cacheBalance,
  };
};

const useReceiveTitle = (search: string) => {
  const { t } = useTranslation();
  const qs = useMemo(() => query2obj(search), [search]);
  const chain = findChainByEnum(qs.chain)?.name || 'EVM chains';
  const token = qs.token || t('global.assets');

  return t('page.receive.title', { chain, token });
};

const Receive = () => {
  const wallet = useWallet();
  const history = useHistory();
  const rbisource = useRbiSource();
  const { t } = useTranslation();
  
  const account = useAccount();
  const [isShowAccount, setIsShowAccount] = useState(true);

  const title = useReceiveTitle(history.location.search);

  const qs = useMemo(() => query2obj(history.location.search), [
    history.location.search,
  ]);
  const chain = findChainByEnum(qs.chain)?.name ?? 'Ethereum';

  const handleCopyAddress = () => {
    matomoRequestEvent({
      category: 'Receive',
      action: 'copyAddress',
      label: [
        chain,
        getKRCategoryByType(account?.type),
        account?.brandName,
        filterRbiSource('Receive', rbisource) && rbisource,
      ].join('|'),
    });

    copyAddress(account?.address!);
  };

  useEffect(() => {
    const init = async () => {
      const account = await wallet.syncGetCurrentAccount();
      if (!account) {
        history.replace('/');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!account?.address) return;

    matomoRequestEvent({
      category: 'Receive',
      action: 'getQRCode',
      label: [
        chain,
        getKRCategoryByType(account?.type),
        account?.brandName,
        filterRbiSource('Receive', rbisource) && rbisource,
      ].join('|'),
    });
  }, [account?.address]);

  useEffect(() => {
    if (account?.type !== KEYRING_CLASS.WATCH) return;

    const modal = Modal.info({
      maskClosable: false,
      closable: false,
      className: 'page-receive-modal modal-support-darkmode',
      content: (
        <div>
          <ThemeIcon className="icon" src={RcIconWarning} />
          <div className="content text-center font-medium text-[17px] leading-[24px] text-r-neutral-title-1 mb-[52px]">
            {t('page.receive.watchModeAlert1')}
            <br />
            {t('page.receive.watchModeAlert2')}
          </div>

          <div className="footer flex gap-[12px]">
            <Button
              type="primary"
              block
              onClick={() => {
                modal.destroy();
                history.goBack();
              }}
            >
              {t('global.Cancel')}
            </Button>

            <Button
              type="primary"
              className="rabby-btn-ghost"
              ghost
              block
              onClick={() => modal.destroy()}
            >
              {t('global.Confirm')}
            </Button>
          </div>
        </div>
      ),
    });

    return () => modal.destroy();
  }, [account?.type]);


  return (
    <div className="px-[20px] bg-r-blue-default dark:bg-r-blue-disable h-full relative">
      <div className="flex justify-between pt-[26px] pb-[12px] min-h-[90px] items-start gap-[8px]">
        <div
          className="pt-[6px] w-[24px] shrink-0 cursor-pointer"
          onClick={() => history.goBack()}
        >
          <IconBack className="icon-back" />
        </div>
        {isShowAccount && (
          <div className="bg-[rgba(255,255,255,0.12)] backdrop-blur-[40px] rounded-[6px] px-[12px] py-[8px] overflow-hidden">
            <div className="flex gap-[8px]">
              <img
                className="w-[20px] h-[20px] opacity-60"
                src={
                  WALLET_BRAND_CONTENT[account?.brandName ?? '']?.image ||
                  KEYRING_ICONS_WHITE[account?.type ?? '']
                }
              />

              <div className="overflow-hidden">

                <div className="flex items-center gap-[6px]">
                  <div
                    className="font-medium text-[15px] leading-[20px] text-white truncate"
                    title={account?.name}
                  >
                    {account?.name}
                  </div>

                  <div
                    className="text-[13px] leading-[15px] text-white/60 truncate text-center"
                    title={splitNumberByStep((account?.balance || 0).toFixed(2))}
                  >
                    ${splitNumberByStep((account?.balance || 0).toFixed(2))}
                  </div>
                </div>

                {account?.type === KEYRING_CLASS.WATCH && (
                  <div className="text-[12px] leading-[14px] text-white/60 mt-[2px]">
                    {t('global.watchModeAddress')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div
          className="pt-[6px] w-[24px] shrink-0 cursor-pointer text-right"
          onClick={() => setIsShowAccount(v => !v)}
        >
          {isShowAccount ? (
            <img src={IconEye} className="inline-block" />
          ) : (
            <img src={IconEyeHide} className="inline-block" />
          )}
        </div>
      </div>

      <div className="bg-r-neutral-bg-1 shadow-[0px_12px_60px_rgba(54,69,157,0.2)] rounded-[8px] px-[4px] pt-[40px] pb-[24px]">
        
        <div className="font-medium text-[17px] leading-[20px] text-center text-r-neutral-title-1 mb-[36px]">
          {title}
        </div>

        <div className="p-[12px] border border-r-neutral-line rounded-[10px] w-[200px] bg-white mx-auto mb-[32px]">
          {account?.address && <QRCode value={account.address} size={175} />}
        </div>

        <div className="text-[14px] leading-[16px] text-center text-r-neutral-title-1 mb-[16px]">
          {account?.address}
        </div>

        <button
          type="button"
          onClick={handleCopyAddress}
          className="
            bg-r-neutral-card-2 rounded-[4px] h-[40px] px-[28px] py-[12px]
            flex items-center justify-center mx-auto 
            text-[13px] leading-[15px] font-normal text-r-neutral-title-1
            active:bg-[rgba(var(--r-neutral-card-2-rbg),0.7)]
          "
        >
          <ThemeIcon
            src={RcIconCopy}
            className="mr-[6px] text-r-neutral-title-1"
          />
          {t('global.copyAddress')}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 pb-[32px]">
        <img
          src="/images/logo-white.svg"
          className="h-[28px] opacity-50 mx-auto"
          alt=""
        />
      </div>
    </div>
  );
};

export default Receive;
