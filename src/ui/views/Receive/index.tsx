import { Modal } from '@/ui/component';
import { Account } from 'background/service/preference';
import QRCode from 'qrcode.react';
import React, { useEffect, useState } from 'react';
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
import { getKRCategoryByType } from '@/utils/transaction';
import { filterRbiSource, useRbiSource } from '@/ui/utils/ga-event';
import { useTranslation } from 'react-i18next';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { copyAddress } from '@/ui/utils/clipboard';
import { Button } from '@repo/ui/primitives';

/* -------------------- hooks -------------------- */

const useAccount = () => {
  const wallet = useWallet();
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<string>();
  const [balance, setBalance] = useState<number>();

  useEffect(() => {
    wallet.syncGetCurrentAccount().then((a) => {
      setAccount(a);
      setAddress(a?.address?.toLowerCase());
    });
  }, []);

  useEffect(() => {
    if (!address) return;
    wallet
      .getInMemoryAddressBalance(address)
      .then((d) => setBalance(d?.total_usd_value || 0));
  }, [address]);

  return {
    ...account,
    address,
    balance,
  };
};

/* -------------------- component -------------------- */

const Receive = () => {
  const wallet = useWallet();
  const history = useHistory();
  const rbisource = useRbiSource();
  const { t } = useTranslation();

  const account = useAccount();
  const [isShowAccount, setIsShowAccount] = useState(true);

  const handleCopyAddress = () => {
    if (!account?.address) return;

    matomoRequestEvent({
      category: 'Receive',
      action: 'copyAddress',
      label: [
        'EVM',
        getKRCategoryByType(account?.type),
        account?.brandName,
        filterRbiSource('Receive', rbisource) && rbisource,
      ].join('|'),
    });

    copyAddress(account.address);
  };

  useEffect(() => {
    wallet.syncGetCurrentAccount().then((a) => {
      if (!a) history.replace('/');
    });
  }, []);

  useEffect(() => {
    if (!account?.address) return;

    matomoRequestEvent({
      category: 'Receive',
      action: 'getQRCode',
      label: [
        'EVM',
        getKRCategoryByType(account?.type),
        account?.brandName,
        filterRbiSource('Receive', rbisource) && rbisource,
      ].join('|'),
    });
  }, [account?.address]);

  useEffect(() => {
    if (account?.type !== KEYRING_CLASS.WATCH) return;

    const modal = Modal.info({
      className: 'page-receive-modal modal-support-darkmode',
      maskClosable: false,
      closable: false,
      content: (
        <div className="text-center">
          <ThemeIcon src={RcIconWarning} className="mx-auto mb-4" />
          <p className="text-[16px] mb-6">
            {t('page.receive.watchModeAlert1')}
            <br />
            {t('page.receive.watchModeAlert2')}
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                modal.destroy();
                history.goBack();
              }}
            >
              {t('global.Cancel')}
            </Button>

            <Button onClick={() => modal.destroy()}>
              {t('global.Confirm')}
            </Button>
          </div>
        </div>
      ),
    });

    return () => modal.destroy();
  }, [account?.type]);

  return (
    <div className="bg-[#F5F6FA] min-h-screen px-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between h-[56px]">
        <button onClick={() => history.goBack()}>
          <IconBack className="w-5 h-5" />
        </button>

        <div className="text-[16px] font-semibold">Receive</div>

        <button onClick={() => setIsShowAccount((v) => !v)}>
          <img
            src={isShowAccount ? IconEye : IconEyeHide}
            className="w-5 h-5"
          />
        </button>
      </div>

      {/* Account info */}
      {isShowAccount && (
        <div className="flex items-center gap-2 mb-4">
          <img
            className="w-5 h-5"
            src={
              WALLET_BRAND_CONTENT[account?.brandName ?? '']?.image ||
              KEYRING_ICONS_WHITE[account?.type ?? '']
            }
          />
          <div className="text-sm font-medium">
            {account?.alianName || 'Account'}
            <span className="text-gray-500 ml-2">
              ${splitNumberByStep((account?.balance || 0).toFixed(2))}
            </span>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-[16px] px-4 py-8">
        <h2 className="text-center text-[17px] font-medium mb-6">
          Receive EVM Address
        </h2>

        {/* QR */}
        <div className="bg-white rounded-[16px] p-4 w-[240px] mx-auto mb-6 shadow-sm">
          {account?.address && <QRCode value={account.address} size={200} />}
        </div>

        {/* Address */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
          <span>
            {account?.address?.slice(0, 6)}...
            {account?.address?.slice(-4)}
          </span>
          <button onClick={handleCopyAddress}>
            <RcIconCopy className="w-4 h-4" />
          </button>
        </div>

        {/* Copy button */}
        <Button onClick={handleCopyAddress} className="mx-auto block">
          {t('global.copyAddress')}
        </Button>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-[13px] text-gray-500">
            Only EVM compatible networks are supported
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-center opacity-50">
        <img src="/images/logo-white.svg" className="h-6" />
      </div>
    </div>
  );
};

export default Receive;
