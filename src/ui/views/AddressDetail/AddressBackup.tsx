import React, { useCallback, useRef } from 'react';
import AuthenticationModalPromise from 'ui/component/AuthenticationModal';
import { useWallet } from 'ui/utils';
import { ReactComponent as IconArrowRight } from 'ui/assets/arrow-right-gray.svg';
import { useForm } from 'antd/lib/form/Form';
import { useHistory } from 'react-router-dom';
import { KEYRING_TYPE } from '@/constant';
import { useTranslation } from 'react-i18next';
import { useEnterPassphraseModal } from '@/ui/hooks/useEnterPassphraseModal';
import { usePopupContainer } from '@/ui/hooks/usePopupContainer';
import { UI_TYPE } from '@/constant/ui';
import { obj2query } from '@/ui/utils/url';
import clsx from 'clsx';

type Props = {
  address: string;
  type: string;
  brandName?: string;
};
export const AddressBackup = ({ address, type }: Props) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const history = useHistory();
  const { getContainer } = usePopupContainer();

  const [form] = useForm();
  const authLockRef = useRef(false);

  if (
    ![KEYRING_TYPE.HdKeyring, KEYRING_TYPE.SimpleKeyring].includes(type as any)
  ) {
    return null;
  }
  const invokeEnterPassphrase = useEnterPassphraseModal('address');

  const handleBackup = useCallback(
    async (backupType: 'mneonics' | 'private-key') => {
      console.log('🔐 Backup clicked:', backupType);
      if (authLockRef.current) {
        console.log('🔐 Authentication already in progress, ignoring click');
        return;
      }
      authLockRef.current = true;
      form.resetFields();
      let data = '';

      try {
        console.log('🔐 Opening authentication modal...');
        await AuthenticationModalPromise({
          confirmText: t('global.confirm'),
          cancelText: t('global.Cancel'),
          title:
            backupType === 'private-key'
              ? t('page.addressDetail.backup-private-key')
              : t('page.addressDetail.backup-seed-phrase'),
          validationHandler: async (password: string) => {
            console.log('🔐 Validation handler triggered');
            if (type === KEYRING_TYPE.HdKeyring) {
              await invokeEnterPassphrase(address);
            }

            if (backupType === 'private-key') {
              data = await wallet.getPrivateKey(password, {
                address,
                type,
              });
            } else {
              data = await wallet.getMnemonics(password, address);
            }
            console.log('🔐 Data retrieved:', data ? 'Success' : 'Failed');
          },
          wallet,
        });
        console.log('🔐 Authentication finished, navigating...');
        const backupPath = backupType;
        if (UI_TYPE.isDesktop) {
          history.push({
            pathname: `${history.location.pathname}`,
            search: `?${obj2query({
              action: 'address-backup',
              backupType: backupPath,
            })}`,
            state: {
              data: data,
            },
          });
        } else {
          history.push({
            pathname: `/settings/address-backup/${backupPath}`,
            state: {
              data: data,
            },
          });
        }
      } catch (error) {
        console.log('🔐 Authentication cancelled or failed');
      } finally {
        authLockRef.current = false;
      }
    },
    [
      address,
      type,
      wallet,
      history,
      form,
      t,
      invokeEnterPassphrase,
      getContainer,
    ]
  );

  return (
    <div className="w-full space-y-[12px]">
      {type === KEYRING_TYPE.HdKeyring ? (
        <button
          type="button"
          className={clsx(
            'w-full p-[12px] rounded-lg cursor-pointer transition-all duration-200',
            'bg-blue-50 dark:bg-blue-900/20',
            'border border-blue-200 dark:border-blue-800',
            'hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700',
            'active:bg-blue-200 dark:active:bg-blue-900/40',
            'text-left'
          )}
          onClick={() => {
            console.log('Seed Phrase button clicked');
            handleBackup('mneonics');
          }}
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-blue-900 dark:text-blue-100">
                {t('page.addressDetail.backup-seed-phrase')}
              </span>
              <span className="text-[12px] text-blue-700 dark:text-blue-200 mt-[4px]">
                {t('page.addressDetail.backup-seed-phrase-desc') ||
                  'Securely backup your seed phrase'}
              </span>
            </div>
            <div className="rabby-list-item-arrow ml-[12px]">
              <IconArrowRight
                width={16}
                height={16}
                viewBox="0 0 12 12"
                className="text-blue-600 dark:text-blue-300"
              ></IconArrowRight>
            </div>
          </div>
        </button>
      ) : null}
      <button
        type="button"
        className={clsx(
          'w-full p-[12px] rounded-lg cursor-pointer transition-all duration-200',
          'bg-purple-50 dark:bg-purple-900/20',
          'border border-purple-200 dark:border-purple-800',
          'hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700',
          'active:bg-purple-200 dark:active:bg-purple-900/40',
          'text-left'
        )}
        onClick={() => {
          console.log('Private Key button clicked');
          handleBackup('private-key');
        }}
      >
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-purple-900 dark:text-purple-100">
              {t('page.addressDetail.backup-private-key')}
            </span>
            <span className="text-[12px] text-purple-700 dark:text-purple-200 mt-[4px]">
              {t('page.addressDetail.backup-private-key-desc') ||
                'Securely backup your private key'}
            </span>
          </div>
          <div className="rabby-list-item-arrow ml-[12px]">
            <IconArrowRight
              width={16}
              height={16}
              viewBox="0 0 12 12"
              className="text-purple-600 dark:text-purple-300"
            ></IconArrowRight>
          </div>
        </div>
      </button>
    </div>
  );
};
