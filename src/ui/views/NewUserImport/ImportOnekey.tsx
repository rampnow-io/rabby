import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import * as Sentry from '@sentry/browser';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAsyncFn } from 'react-use';
import { useMount } from 'ahooks';

import { HARDWARE_KEYRING_TYPES, WALLET_BRAND_TYPES } from '@/constant';

import OneKeySVG from '@/ui/assets/walletlogo/onekey.svg';
import PillsSwitch from '@/ui/component/PillsSwitch';
import Progress from '@/ui/component/Progress';
import QRCodeReader from 'ui/component/QRCodeReader';
import QRCodeCheckerDetail from 'ui/views/QRCodeCheckerDetail';

import { URDecoder } from '@ngraveio/bc-ur';
import { LedgerHDPathType as HDPathType } from '@/ui/utils/ledger';
import { useWallet } from '@/ui/utils';
import { getOneKeyFirstOneKeyDevice } from '@/ui/utils/onekey';

import { findEthAccountByMultiAccounts } from '../ImportHardware/OneKeyConnect/utils';
import { ImageCarousel } from '../ImportHardware/OneKeyConnect/ImageCarousel';

import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { useHDWalletUnlockAndRedirect } from './hooks/useHardWareUnlockAddress';

import { UiProvider } from '@/ui/component/NewUserImport';
import { Container, Content, Action } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';
import { Button } from '@repo/ui/primitives';

const KEYSTONE_TYPE = HARDWARE_KEYRING_TYPES.Keystone.type;

enum ConnectType {
  QRCode = 'qrcode',
  USB = 'usb',
}

const LOGO_MAP = {
  [WALLET_BRAND_TYPES.ONEKEY]: OneKeySVG,
};

export const NewUserImportOneKey = () => {
  const { store } = useNewUserGuideStore();
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();

  const decoder = useRef(new URDecoder());
  const stashKeyringIdRef = useRef<number | null>(null);

  const brand = WALLET_BRAND_TYPES.ONEKEY;

  const [connectType, setConnectType] = useState<ConnectType>(ConnectType.USB);
  const [scan, setScan] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const showErrorChecker = useMemo(() => errorMessage !== '', [errorMessage]);

  /* ---------------- QR CODE HANDLING ---------------- */

  const handleScanQRCodeSuccess = async (data: string) => {
    try {
      decoder.current.receivePart(data);
      setProgress(Math.floor(decoder.current.estimatedPercentComplete() * 100));

      if (!decoder.current.isComplete()) return;

      const result = decoder.current.resultUR();

      if (result.type === 'crypto-hdkey') {
        stashKeyringIdRef.current = await wallet.submitQRHardwareCryptoHDKey(
          result.cbor.toString('hex'),
          stashKeyringIdRef.current
        );
      } else if (result.type === 'crypto-account') {
        stashKeyringIdRef.current = await wallet.submitQRHardwareCryptoAccount(
          result.cbor.toString('hex'),
          stashKeyringIdRef.current
        );
      } else if (result.type === 'crypto-multi-accounts') {
        const ethAccount = findEthAccountByMultiAccounts(result);
        if (!ethAccount) {
          setErrorMessage(
            t(
              'Not found the account in the QR code. Please scan the sync QR code of the hardware wallet.'
            )
          );
          return;
        }

        stashKeyringIdRef.current = await wallet.submitQRHardwareCryptoHDKey(
          ethAccount.cbor.toString('hex'),
          stashKeyringIdRef.current
        );
      } else {
        throw new Error('Invalid QR type');
      }

      goToSelectAddress(stashKeyringIdRef.current);
    } catch (e: any) {
      Sentry.captureException(e);
      setScan(false);
      setErrorMessage(
        t(
          'Invalid QR code. Please scan the sync QR code of the hardware wallet.'
        )
      );
    }
  };

  const handleScanAgain = () => {
    setErrorMessage('');
    setProgress(0);
    setScan(true);
    decoder.current = new URDecoder();
  };

  /* ---------------- NAVIGATION ---------------- */

  const goToSelectAddress = async (keyringId?: number | null) => {
    if (!keyringId) return;

    await wallet.requestKeyring(
      KEYSTONE_TYPE,
      'setHDPathType',
      keyringId,
      HDPathType.BIP44
    );

    await wallet.boot(store.password);
    await wallet.unlockHardwareAccount(KEYSTONE_TYPE, [0], keyringId);

    history.push({
      pathname: '/new-user/success',
      search: `?hd=${KEYSTONE_TYPE}&brand=${brand}&keyringId=${keyringId}`,
    });
  };

  /* ---------------- INIT EFFECTS ---------------- */

  useEffect(() => {
    wallet.initQRHardware(brand).then((stashKeyringId) => {
      stashKeyringIdRef.current = stashKeyringId;
      wallet
        .requestKeyring(KEYSTONE_TYPE, 'isReady', stashKeyringId)
        .then((ready) => {
          if (ready) {
            goToSelectAddress(stashKeyringId);
          }
          setScan(true);
        });
    });

    return () => {
      wallet.clearPageStateCache();
    };
  }, []);

  useEffect(() => {
    wallet.requestKeyring(
      HARDWARE_KEYRING_TYPES.Onekey.type,
      'searchDevices',
      null
    );
  }, []);

  useMount(() => {
    if (!store.password) {
      history.replace('/new-user/guide');
    }
  });

  /* ---------------- USB CONNECT ---------------- */

  const unlockAndRedirect = useHDWalletUnlockAndRedirect(
    HARDWARE_KEYRING_TYPES.Onekey.type
  );

  const onConnectViaUSB = async () => {
    if (!store.password) return;

    await getOneKeyFirstOneKeyDevice();
    await wallet.authorizeOneKeyHIDPermission();
    await unlockAndRedirect();
  };

  const [{ loading }, runHandleConnect] = useAsyncFn(onConnectViaUSB, []);

  /* ---------------- RENDER ---------------- */

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() =>
            history.length > 1 ? history.goBack() : history.replace('/')
          }
        />

        <SectionHeader className="text-center" title="OneKey" />

        <Content>
          <img
            src={LOGO_MAP[brand]}
            alt="OneKey"
            className="w-[52px] h-[52px] mx-auto mb-[16px]"
          />

          <div className="flex justify-center mb-[16px]">
            <PillsSwitch
              value={connectType}
              onTabChange={setConnectType}
              options={[
                { key: ConnectType.USB, label: 'USB' },
                { key: ConnectType.QRCode, label: 'QR Code' },
              ]}
              className="bg-r-neutral-line p-[2px]"
              itemClassname="text-[13px] w-[100px] h-[28px]"
              itemClassnameActive="bg-r-neutral-card-1"
              itemClassnameInActive="text-r-neutral-body"
            />
          </div>

          {connectType === ConnectType.USB && (
            <div className="text-center">
              <ul className="text-r-neutral-title1 text-[16px] font-medium mb-[24px] list-inside">
                <li>{t('page.newUserImport.importOneKey.tip1')}</li>
                <li>{t('page.newUserImport.importOneKey.tip2')}</li>
                <li>{t('page.newUserImport.importOneKey.tip3')}</li>
              </ul>

              <img
                src="/images/onekey-usb-connect.png"
                className="w-[200px] mx-auto"
              />
            </div>
          )}

          {connectType === ConnectType.QRCode && (
            <div>
              <div className="flex justify-center relative">
                <div className="w-[200px] h-[200px] border rounded-[6px] p-[6px]">
                  {scan && (
                    <QRCodeReader
                      width={188}
                      height={188}
                      onSuccess={handleScanQRCodeSuccess}
                      needAccessRedirect={false}
                    />
                  )}
                </div>
                <ImageCarousel />
              </div>

              {progress > 0 && (
                <div className="w-[130px] mx-auto mt-[24px]">
                  <Progress percent={progress} />
                </div>
              )}

              {showErrorChecker && (
                <QRCodeCheckerDetail
                  visible
                  data={errorMessage}
                  onCancel={handleScanAgain}
                  onOk={handleScanAgain}
                  okText={t('global.tryAgain')}
                  cancelText={t('global.Cancel')}
                />
              )}
            </div>
          )}
        </Content>

        {connectType === ConnectType.USB && (
          <Action>
            <Button
              className="w-full h-[56px] text-[17px]"
              onClick={runHandleConnect}
            >
              {t('page.newUserImport.importOneKey.connect')}
            </Button>
          </Action>
        )}
      </Container>
    </UiProvider>
  );
};
