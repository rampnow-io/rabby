/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Cex } from '@rabby-wallet/rabby-api/dist/types';

import type { Account } from '@/background/service/preference';
import { ellipsisAddress } from '@/ui/utils/address';
import { useBrandIcon } from '@/ui/hooks/useBrandIcon';

import { useThemeMode } from '@/ui/hooks/usePreference';
import { getUiType, isSameAddress, useAlias } from '@/ui/utils';
import { Tooltip } from 'antd';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';

import { ReactComponent as RcAvatarCC } from '@/ui/views/SendToken/icons/avatar-cc.svg';
import { ReactComponent as RcToSwitch } from '@/ui/views/SendToken/icons/to-address-switch.svg';
import { ReactComponent as RcWhitelistGuardBordered } from '@/ui/assets/component/whitelist-guard-bordered.svg';
import { ReactComponent as RcCheckRight } from '@/ui/assets/send-token/check-right.svg';

import { ReactComponent as RcIconAddressEntry } from '@/ui/views/SendToken/icons/address-entry.svg';
import { ReactComponent as RcIconArrowDown } from '@/ui/assets/arrow-down-cc.svg';
import { BRAND_ALIAN_TYPE_TEXT, KEYRING_CLASS } from '@/constant';
import { AddressViewer } from '@/ui/component';
import {
  ToAddressPositiveTips,
  useRecentSendToHistoryFor,
} from '@/ui/component/SendLike/hooks/useRecentSend';
import MarkedHeadTailAddress from '@/ui/component/AddressViewer/MarkedHeadTailAddress';

const isTab = getUiType().isTab;

/**
 * AddressInfoTo Component
 *
 * Displays the selected recipient address with:
 * - Avatar/icon showing the address type or CEX logo
 * - Whitelist indicator badge
 * - Address display (shortened or alias)
 * - Address verification info
 * - Click to edit functionality
 */
export function AddressInfoTo({
  toAccount,
  titleText,
  loadingToAddressDesc,
  toAddressPositiveTips,
  // isMyImported,
  cexInfo,
  className,
  onOpenSelectAddress,
  onCloseSelectAddress,
}: {
  className?: string;
  toAccount?: Account;
  titleText?: string;
  loadingToAddressDesc?: boolean;
  toAddressPositiveTips?: ToAddressPositiveTips;
  // isMyImported: boolean | undefined;
  cexInfo?: Cex;
  onOpenSelectAddress?: () => void;
  onCloseSelectAddress?: () => void;
}) {
  const { t } = useTranslation();

  const { isDarkTheme } = useThemeMode();

  const addressTypeIcon = useBrandIcon({
    address: toAccount?.address || '',
    brandName: toAccount?.brandName || '',
    type: toAccount?.type || '',
    forceLight: false,
  });

  const [aliasName] = useAlias(toAccount?.address || '');

  const rDispatch = useRabbyDispatch();

  const { showBorderdDesc, cexInfoText } = useMemo(() => {
    const ret = {
      showCexInfo: false,
      cexInfoText: '',
      showBorderdDesc: false,
    };
    ret.showCexInfo =
      !!cexInfo?.id &&
      !!cexInfo?.is_deposit &&
      toAccount?.type === KEYRING_CLASS.WATCH;

    ret.cexInfoText = ret.showCexInfo
      ? t('page.selectToAddress.riskAlert.cexDepositAddress', {
          cexName: cexInfo?.name,
        })
      : toAccount?.type === KEYRING_CLASS.GNOSIS
      ? t('page.selectToAddress.riskAlert.cexAddress', {
          cexName: BRAND_ALIAN_TYPE_TEXT[toAccount?.type],
        })
      : toAccount?.type
      ? BRAND_ALIAN_TYPE_TEXT[toAccount?.type]
      : '';

    // ret.showBorderdDesc = ret.showCexInfo || toAccount?.type === KEYRING_CLASS.GNOSIS;
    ret.showBorderdDesc = false;

    return ret;
  }, [cexInfo, toAccount?.type, t]);

  /**
   * Initialize account display data on mount
   */
  useEffect(() => {
    rDispatch.accountToDisplay.getAllAccountsToDisplay();
  }, [rDispatch.accountToDisplay]);

  /**
   * Close selection modal when address is confirmed
   */
  useEffect(() => {
    if (toAccount?.address) {
      onCloseSelectAddress?.();
    }
  }, [toAccount?.address, onCloseSelectAddress]);

  /**
   * Handle address modification
   */
  const handleChangeAddress = useCallback(() => {
    onOpenSelectAddress?.();
  }, [onOpenSelectAddress]);

  /**
   * Render empty state or address details
   */
  const renderAddressDisplay = useMemo(() => {
    if (!toAccount?.address) {
      return (
        <span className="text-[16px] font-medium leading-[20px] text-r-neutral-foot">
          {t('page.sendToken.sectionTo.placeholder')}
        </span>
      );
    }

    return (
      <Tooltip
        overlayClassName="address-tooltip address-tooltip-transparent rounded-tooltip"
        title={
          <div className="flex flex-col justify-center">
            {showBorderdDesc && (
              <div
                className={clsx(
                  'flex items-center justify-center',
                  'rounded-[8px] bg-r-blue-light1',
                  'px-[12px] h-[32px]',
                  'text-[13px] font-medium text-r-blue-default whitespace-nowrap overflow-hidden text-ellipsis'
                )}
              >
                {cexInfoText}
              </div>
            )}
          </div>
        }
        {...(!showBorderdDesc && {
          visible: false,
        })}
      >
        <div className="flex flex-col justify-center items-start">
          {aliasName ? (
            <span className="text-[14px] mb-[4px] font-medium leading-[20px] text-r-neutral-title-1">
              {aliasName}
            </span>
          ) : (
            <MarkedHeadTailAddress
              headCount={8}
              tailCount={4}
              address={toAccount?.address || ''}
              className="text-[14px] mb-[4px]"
            />
          )}
          <AddressViewer
            address={toAccount?.address?.toLowerCase()}
            showArrow={false}
            longEllipsis
            className={clsx('text-[13px] text-r-neutral-body leading-[16px]')}
          />
        </div>
      </Tooltip>
    );
  }, [toAccount?.address, aliasName, showBorderdDesc, cexInfoText, t]);

  /**
   * Render address icon or avatar
   */
  const renderAddressIcon = useMemo(() => {
    if (!toAccount?.address) {
      return (
        <div className="w-[24px] h-[24px] flex justify-center items-center">
          <div className="w-[24px] h-[24px] rounded-[6px] flex justify-center items-center bg-r-neutral-line">
            <RcAvatarCC
              width={13}
              height={15}
              className="text-r-neutral-foot"
            />
          </div>
        </div>
      );
    }

    return (
      <ThemeIcon
        src={cexInfo?.logo_url || addressTypeIcon}
        className={'w-[24px] h-[24px] rounded-full'}
        style={{ padding: 0 }}
      />
    );
  }, [toAccount?.address, cexInfo?.logo_url, addressTypeIcon]);

  return (
    <div className={clsx(className, 'overflow-auto')}>
      <div className="section relative">
        <div className="mt-[12px]">
          {/* Address Selection Container */}
          <div
            className={clsx(
              'h-[58px] w-[100%] flex items-center justify-between p-[16px]',
              isDarkTheme ? 'bg-r-neutral-card1' : 'bg-r-neutral-bg1',
              'cursor-pointer border-[1px] border-transparent hover:border-rabby-blue-default hover:bg-r-blue-light1 rounded-[8px]',
              'transition-colors duration-200'
            )}
            onClick={handleChangeAddress}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleChangeAddress();
              }
            }}
            aria-label={
              toAccount?.address
                ? `Selected address: ${toAccount.address}`
                : 'Select a recipient address'
            }
          >
            {/* Left Section: Icon & Address Info */}
            <div className="relative flex items-center justify-start">
              {/* Address Icon */}
              <div className="relative">
                {renderAddressIcon}

                {/* Whitelist Indicator Badge */}
                {toAddressPositiveTips?.inWhitelist && (
                  <div className="absolute w-[18px] h-[18px] whitelist-guard-bordered-view text-r-blue-default">
                    <RcWhitelistGuardBordered
                      width={18}
                      height={18}
                      viewBox="0 0 18 18"
                    />
                  </div>
                )}
              </div>

              {/* Address Details */}
              <div className={clsx('flex flex-col items-center', 'ml-[8px]')}>
                {renderAddressDisplay}
              </div>
            </div>

            {/* Right Section: Dropdown Arrow */}
            <div className="flex items-center justify-end flex-shrink-0">
              <RcIconArrowDown className="w-[20px] h-[20px] text-r-neutral-body" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
