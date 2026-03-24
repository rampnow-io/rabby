import { HeaderNavPage, Modal } from '@/ui/component';
import { Account } from 'background/service/preference';
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
import { Button, Copy } from '@repo/ui/primitives';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Container, Content, CopyField, QrCode } from '@repo/ui';
import { ReactComponent as RcChainGroup } from 'ui/assets/receive/chain-group.svg';

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
    <UiProvider>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            if (history.length) {
              history.goBack();
            }
          }}
        >
          <div className="text-primary-foreground text-xl font-medium">
            Receive
          </div>
        </HeaderNavPage>
        <Content>
          <div className="mt-14">
            {account?.address && (
              <div className="flex flex-col items-center gap-8">
                <CopyField
                  value={account?.address}
                  group={[4, 4]}
                  className="text-[16px] text-primary-foreground font-medium"
                />
                <div className="mx-auto mb-4 ">
                  {account?.address && (
                    <QrCode
                      data={account.address}
                      size={200}
                      icon="https://cdn.rampnow.io/image/logo/qr.svg"
                    />
                  )}
                </div>{' '}
              </div>
            )}
            <div className="flex justify-center py-3">
              <RcChainGroup className="w-[140px]" />
            </div>
            <p className="text-base text-center font-medium text-[#454745] tracking-[-0.25px]">
              You can send and receive tokens on all <br />
              supported ERC 20 networks
            </p>
          </div>
        </Content>
      </Container>
    </UiProvider>
  );
};

export default Receive;
