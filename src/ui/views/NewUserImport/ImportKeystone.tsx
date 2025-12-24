import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import * as Sentry from '@sentry/browser';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { useMount, useRequest } from 'ahooks';
import qs from 'qs';

import { HARDWARE_KEYRING_TYPES, WALLET_BRAND_TYPES } from '@/constant';

import KeyStoneSVG from '@/ui/assets/walletlogo/keystone.svg';
import NgraveSVG from '@/ui/assets/walletlogo/ngrave.svg';

import PillsSwitch from '@/ui/component/PillsSwitch';
import Progress from '@/ui/component/Progress';
import QRCodeReader from 'ui/component/QRCodeReader';
import QRCodeCheckerDetail from 'ui/views/QRCodeCheckerDetail';

import { URDecoder } from '@ngraveio/bc-ur';
import { TransportWebUSB } from '@keystonehq/hw-transport-webusb';

import { useWallet } from '@/ui/utils';
import { useKeystoneUSBErrorCatcher } from '@/ui/utils/keystone';
import { LedgerHDPathType as HDPathType } from '@/ui/utils/ledger';
import { query2obj } from '@/ui/utils/url';

import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';

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
  [WALLET_BRAND_TYPES.KEYSTONE]: KeyStoneSVG,
  [WALLET_BRAND_TYPES.NGRAVEZERO]: NgraveSVG,
};

export const NewUserImportKeystone = () => {
  const { store } = useNewUserGuideStore();
  const { t } = useTranslation();
  const history = useHistory();
  const { search } = useLocation();
  const wallet = useWallet();
  const keystoneErrorCatcher = useKeystoneUSBErrorCatcher();

  const decoder = useRef(new URDecoder());
  const stashKeyringIdRef = useRef<number | null>(null);

  const { brand } = query2obj(search);
  const isKeystone = brand === WALLET_BRAND_TYPES.KEYSTONE;

  const [connectType, setConnectType] = useState<ConnectType>(
    ConnectType.QRCode
  );
  const [scan, setScan] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const showErrorChecker = useMemo(() => errorMessage !== '', [errorMessage]);

  /* ---------------- QR SCAN ---------------- */

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
    setScan(true);
    setProgress(0);
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
      search: qs.stringify({
        hd: KEYSTONE_TYPE,
        brand,
        keyringId,
      }),
    });
  };

  /* ---------------- INIT ---------------- */

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

  /* ---------------- USB ---------------- */

  const onConnectViaUSB = async () => {
    try {
      if (!store.password) {
        throw new Error('empty password');
      }

      await TransportWebUSB.requestPermission();

      await wallet.requestKeyring(KEYSTONE_TYPE, 'forgetDevice', null);

      const stashKeyringId = await wallet.initQRHardware(brand);

      await wallet.requestKeyring(
        KEYSTONE_TYPE,
        'getAddressesViaUSB',
        stashKeyringId,
        HDPathType.BIP44
      );

      await wallet.requestKeyring(
        KEYSTONE_TYPE,
        'setHDPathType',
        stashKeyringId,
        HDPathType.BIP44
      );

      await wallet.boot(store.password);
      await wallet.unlockHardwareAccount(KEYSTONE_TYPE, [0], stashKeyringId);

      history.push({
        pathname: '/new-user/success',
        search: qs.stringify({
          hd: KEYSTONE_TYPE,
          brand,
          keyringId: stashKeyringId,
        }),
      });
    } catch (e: any) {
      console.error(e);
      keystoneErrorCatcher(e);
    }
  };

  const { runAsync: runHandleConnect, loading } = useRequest(onConnectViaUSB, {
    manual: true,
  });

  /* ---------------- GUARD ---------------- */

  useMount(() => {
    if (!store.password) {
      history.replace('/new-user/guide');
    }
  });

  /* ---------------- RENDER ---------------- */

  const Logo = LOGO_MAP[brand];

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() =>
            history.length > 1
              ? history.goBack()
              : history.replace('/new-user/guide')
          }
        />

        <SectionHeader className="text-center" title={brand} />

        <Content>
          {/* Logo */}
          <img
            src={Logo}
            className="w-[52px] h-[52px] mb-[16px] mx-auto"
            alt={brand}
          />

          {/* Switch */}
          {isKeystone && (
            <div className="flex justify-center mb-[16px]">
              <PillsSwitch
                value={connectType}
                options={[
                  {
                    key: ConnectType.QRCode,
                    label: 'QR code',
                  },
                  {
                    key: ConnectType.USB,
                    label: 'USB',
                  },
                ]}
                onTabChange={setConnectType}
                className="bg-r-neutral-line p-[2px]"
                itemClassname="text-[13px] w-[100px] h-[28px]"
                itemClassnameActive="bg-r-neutral-card-1"
                itemClassnameInActive="text-r-neutral-body"
              />
            </div>
          )}

          {/* QR MODE */}
          {connectType === ConnectType.QRCode && (
            <div className="pb-[30px]">
              <p className="text-r-neutral-foot text-[14px] text-center mb-[20px]">
                {t('page.newUserImport.importKeystone.qrcode.desc', {
                  brandName: brand,
                })}
              </p>

              <div className="w-[200px] h-[200px] p-[6px] border rounded-[6px] mx-auto">
                {scan && (
                  <QRCodeReader
                    width={188}
                    height={188}
                    onSuccess={handleScanQRCodeSuccess}
                    needAccessRedirect={false}
                  />
                )}
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

          {/* USB MODE */}
          {connectType === ConnectType.USB && (
            <div>
              <p className="text-r-neutral-foot text-[14px] text-center mb-[20px]">
                {t('page.newUserImport.importKeystone.usb.desc')}
              </p>

              <ul className="list-decimal list-inside text-r-neutral-title1 text-[16px] font-medium mb-[30px] text-center">
                <li>{t('page.newUserImport.importKeystone.usb.tip1')}</li>
                <li>{t('page.newUserImport.importKeystone.usb.tip2')}</li>
                <li>{t('page.newUserImport.importKeystone.usb.tip3')}</li>
              </ul>

              <img
                src="/images/keystone-plug-1.png"
                className="w-[240px] mx-auto"
                alt="Keystone USB"
              />
            </div>
          )}
        </Content>

        {/* ACTION */}
        {connectType === ConnectType.USB && (
          <Action>
            <Button
              onClick={runHandleConnect}
              className="w-full h-[56px] text-[17px]"
            >
              {t('page.newUserImport.importKeystone.usb.connect')}
            </Button>
          </Action>
        )}
      </Container>
    </UiProvider>
  );
};
