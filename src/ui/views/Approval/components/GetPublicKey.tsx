import { message, Tooltip } from 'antd';
import clsx from 'clsx';
import { KEYRING_TYPE } from 'consts';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import IconInfo from 'ui/assets/infoicon.svg';
import { FallbackSiteLogo } from 'ui/component';
import { useApproval, useWallet } from 'ui/utils';
import AccountCard from './AccountCard';
import { Account } from '@/background/service/preference';
import { Button } from '@repo/ui/primitives';

interface ConnectProps {
  params: {
    session: {
      icon: string;
      origin: string;
      name: string;
    };
  };
  account: Account;
}

const GetEncryptionPublicKey = ({ params, account }: ConnectProps) => {
  const { t } = useTranslation();
  const [canProcess, setCanProcess] = useState(true);
  const { icon, origin } = params.session;

  const wallet = useWallet();
  const [, resolveApproval, rejectApproval] = useApproval();
  const handleCancel = useCallback(() => {
    rejectApproval('User rejected the request.');
  }, [rejectApproval]);

  const handleAllow = async () => {
    try {
      const data = await wallet.getEncryptionPublicKey({
        type: account!.type,
        address: account!.address,
      });
      resolveApproval({
        data,
      });
    } catch (e) {
      message.error(e.message);
    }
  };

  const init = async () => {
    setCanProcess(
      !!account &&
        [KEYRING_TYPE.HdKeyring, KEYRING_TYPE.SimpleKeyring].includes(
          account.type as any
        )
    );
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="p-[20px]">
      <AccountCard account={account}></AccountCard>
      <div className="mt-[20px]">
        <div className="flex flex-col items-center mb-[20px]">
          <FallbackSiteLogo
            className="w-[44px] h-[44px] rounded-full mb-[12px]"
            url={icon}
            origin={origin}
            width="44px"
          />
          <div className="text-[16px] text-r-neutral-title1 font-medium">
            {origin}
          </div>
        </div>
        <div className="text-[14px] text-r-neutral-body leading-[20px]">
          This website would like your public encryption key. By consenting,
          this site will be able to compose encrypted messages to you.
        </div>
      </div>
      <footer className="footer p-[20px]">
        <div className="action-buttons flex justify-between mt-4">
          <Button className="w-[172px]" onClick={handleCancel}>
            {t('Cancel')}
          </Button>
          {canProcess ? (
            <Button className="w-[172px]" onClick={() => handleAllow()}>
              {t('Provide')}
            </Button>
          ) : (
            <Tooltip
              overlayClassName={clsx('rectangle watcSign__tooltip')}
              title={
                'Only addresses with private keys stored in rabby can perform this type of signing.'
              }
              placement="topRight"
            >
              <Button
                className="w-[172px]"
                onClick={() => handleAllow()}
                disabled
              >
                <img
                  src={IconInfo}
                  className={clsx('absolute right-[40px] top-[14px]')}
                />{' '}
                {t('Provide')}
              </Button>
            </Tooltip>
          )}
        </div>
      </footer>
    </div>
  );
};

export default GetEncryptionPublicKey;
