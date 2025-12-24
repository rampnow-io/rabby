import React from 'react';
import clsx from 'clsx';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useMemoizedFn, useMount, useRequest } from 'ahooks';
import { message } from 'antd';

import { HARDWARE_KEYRING_TYPES, NEXT_KEYRING_ICONS } from '@/constant';

import { useWallet } from '@/ui/utils';
import { isLedgerLockError, LedgerHDPathType } from '@/ui/utils/ledger';

import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';

import { UiProvider } from '@/ui/component/NewUserImport';
import { Container, Content, Action } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import SectionHeader from '@/ui/component/section-header/section-header';
import { Button } from '@repo/ui/primitives';

const RcLogo = NEXT_KEYRING_ICONS[HARDWARE_KEYRING_TYPES.Ledger.type].rcLight;

export const NewUserImportLedger = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const { store } = useNewUserGuideStore();

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = useMemoizedFn(async () => {
    try {
      if (!store.password) {
        throw new Error('empty password');
      }

      const parent = window.opener;

      // check HID
      const transport = await TransportWebHID.create();
      await transport.close();

      await wallet.authorizeLedgerHIDPermission();

      if (parent) {
        window.postMessage({ success: true }, '*');
        return;
      }

      const keyringId = await wallet.connectHardware({
        type: HARDWARE_KEYRING_TYPES.Ledger.type,
        isWebHID: true,
        needUnlock: true,
      });

      await wallet.requestKeyring(
        HARDWARE_KEYRING_TYPES.Ledger.type,
        'setHDPathType',
        keyringId,
        LedgerHDPathType.LedgerLive
      );

      await wallet.boot(store.password);
      await wallet.unlockHardwareAccount(
        HARDWARE_KEYRING_TYPES.Ledger.type,
        [0],
        keyringId
      );

      history.push({
        pathname: '/new-user/success',
        search: `?hd=${HARDWARE_KEYRING_TYPES.Ledger.type}&keyringId=${keyringId}`,
      });
    } catch (e: any) {
      console.error(e);

      if (window.opener) {
        window.postMessage({ success: false }, '*');
      }

      if (isLedgerLockError(e?.message)) {
        message.error({
          content: t('page.newAddress.hd.tooltip.disconnected'),
          key: 'ledger-error',
        });
      } else {
        message.error(e?.message || 'Ledger error');
      }
    }
  });

  const { runAsync: runHandleSubmit, loading } = useRequest(handleSubmit, {
    manual: true,
  });

  /* ---------------- GUARD ---------------- */

  useMount(() => {
    if (!store.password) {
      history.replace('/new-user/guide');
    }
  });

  /* ---------------- RENDER ---------------- */

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            history.length > 1
              ? history.goBack()
              : history.replace('/new-user/guide');
          }}
        />

        <SectionHeader
          className="text-center"
          title={t('page.newUserImport.importLedger.title')}
        />

        <Content>
          {/* Logo */}
          <RcLogo
            className="w-[52px] h-[52px] mb-[16px] block mx-auto"
            viewBox="0 0 28 28"
          />

          {/* Tips */}
          <ul
            className={clsx(
              'list-decimal list-inside mx-auto',
              'text-r-neutral-title1 text-[16px] font-medium leading-[140%]',
              'max-w-[260px] mb-[36px]'
            )}
          >
            <li>{t('page.newUserImport.importLedger.tip1')}</li>
            <li>{t('page.newUserImport.importLedger.tip2')}</li>
            <li>{t('page.newUserImport.importLedger.tip3')}</li>
          </ul>

          {/* Image */}
          <img
            src="/images/ledger-plug-1.png"
            className="w-[240px] mx-auto"
            alt="Ledger connect"
          />
        </Content>

        <Action>
          <Button
            onClick={runHandleSubmit}
            className="w-full h-[56px] text-[17px] font-medium"
          >
            {t('page.newUserImport.importLedger.connect')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
