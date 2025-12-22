import { query2obj } from '@/ui/utils/url';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Switch } from 'antd';
import { useRabbyDispatch, useRabbySelector, connectStore } from 'ui/store';
import AuthenticationModalPromise from 'ui/component/AuthenticationModal';
import { PageHeader } from 'ui/component';
import { isSameAddress, useAddressSource, useWallet } from 'ui/utils';
import { AddressBackup } from './AddressBackup';
import { AddressDelete } from './AddressDelete';
import { AddressInfo } from './AddressInfo';
import clsx from 'clsx';
import { usePopupContainer } from '@/ui/hooks/usePopupContainer';
import { ReactComponent as IconChevronDown } from 'ui/assets/chevron-down.svg';

const AddressDetail: React.FC<{ isInModal?: boolean }> = ({ isInModal }) => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const dispatch = useRabbyDispatch();
  const { whitelist } = useRabbySelector((s) => ({
    whitelist: s.whitelist.whitelist,
  }));
  const wallet = useWallet();
  const qs = useMemo(() => query2obj(search), [search]) as {
    address: string;
    type: string;
    brandName: string;
    byImport?: string;
  };

  const { getContainer } = usePopupContainer();

  const { address, type, brandName, byImport } = qs || {};

  const source = useAddressSource({
    type,
    brandName,
    byImport: !!byImport,
    address,
  });

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    backup: false,
    delete: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    dispatch.whitelist.getWhitelist();
  }, []);

  const handleWhitelistChange = async (checked: boolean) => {
    if (!checked) {
      await wallet.removeWhitelist(address);
      const cexId = await wallet.getCexId(address);
      if (cexId) {
        await wallet.updateCexId(address, '');
      }
      return;
    }
    AuthenticationModalPromise({
      title: t('page.addressDetail.add-to-whitelist'),
      cancelText: t('global.Cancel'),
      wallet,
      containerClassName: 'whitelist-confirm-modal',
      validationHandler: async (password) => {
        await wallet.addWhitelist(password, address);
      },
      onFinished() {
        // dispatch.whitelist.getWhitelist();
      },
      onCancel() {
        // do nothing
      },
    });
  };

  if (!address) {
    return null;
  }

  return (
    <div
      className={clsx(
        'page-address-detail overflow-auto w-full',
        isInModal ? 'min-h-0 h-[600px]' : ''
      )}
    >
      <PageHeader className="pt-[24px] mx-[20px]" canBack={!isInModal}>
        {t('page.addressDetail.address-detail')}
      </PageHeader>

      {/* Backup Section */}
      <div className="px-[20px] mt-[16px]">
        <div
          className="flex items-center justify-between cursor-pointer p-[12px] rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleSection('backup')}
        >
          <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
            {t('page.addressDetail.backup')}
          </span>
          <svg
            className={clsx(
              'w-[20px] h-[20px] text-gray-600 dark:text-gray-400 transition-transform',
              expandedSections.backup ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
        {expandedSections.backup && (
          <div className="mt-[12px] p-[16px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <AddressBackup
              address={address}
              type={type}
              brandName={brandName}
            />
          </div>
        )}
      </div>

      {/* Delete Section */}
      <div className="px-[20px] mt-[16px] mb-[20px]">
        <div
          className="flex items-center justify-between cursor-pointer p-[12px] rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleSection('delete')}
        >
          <span className="text-[14px] font-semibold text-red-500 dark:text-red-400">
            {t('page.addressDetail.delete-address')}
          </span>
          <svg
            className={clsx(
              'w-[20px] h-[20px] text-gray-600 dark:text-gray-400 transition-transform',
              expandedSections.delete ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
        {expandedSections.delete && (
          <div className="mt-[12px] p-[16px] bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
            <AddressDelete
              address={address}
              type={type}
              brandName={brandName}
              source={source}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default connectStore()(AddressDetail);
