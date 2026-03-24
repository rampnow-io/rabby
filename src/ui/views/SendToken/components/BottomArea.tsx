import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { getUiType } from 'ui/utils';
import { DirectSignToConfirmBtn } from '@/ui/component/ToConfirmButton';
import type { Account } from '@/background/service/preference';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import type { TokenItem } from '@/background/service/openapi';
import type { Chain } from '@debank/common';
import { ChevronDown } from 'lucide-react';

import { ReactComponent as RcIconRiskAlert } from '@/ui/assets/send-token/risk-alert.svg';
import { ReactComponent as RcIconCheckboxChecked } from '@/ui/assets/send-token/icon-checkbox-checked.svg';
import { ReactComponent as RcIconCheckboxUncheck } from '@/ui/assets/send-token/icon-checkbox-uncheck.svg';
import { Button, TooltipView } from '@repo/ui/primitives';

const isTab = getUiType().isTab;

export default function BottomArea({
  mostImportantRisks,
  agreeRequiredChecked,
  onCheck,
  currentAccount,
  isSubmitLoading = false,
  canSubmit: _canSubmit = false,
  miniSignLoading = false,
  canUseDirectSubmitTx,
  onConfirm,
  currentToken,
  chainItem,
  amount,
  toAddress,
  estimatedFee,
  estimatedTime,
}: {
  mostImportantRisks: { value: string }[];
  agreeRequiredChecked: boolean;
  onCheck: (nextVal: boolean) => void;
  currentAccount: Account | null;
  isSubmitLoading: boolean;
  canSubmit: boolean;
  miniSignLoading: boolean;
  canUseDirectSubmitTx: boolean;
  onConfirm?: () => void;
  currentToken?: TokenItem | null;
  chainItem?: Chain | null;
  amount?: string;
  toAddress?: string;
  estimatedFee?: string | number;
  estimatedTime?: string;
}) {
  const { t } = useTranslation();
  const [showSheet, setShowSheet] = useState(false);

  const canSubmit =
    _canSubmit && (!mostImportantRisks.length || agreeRequiredChecked);

  console.log('[BottomArea] canSubmit check:', {
    _canSubmit,
    mostImportantRisksLength: mostImportantRisks.length,
    agreeRequiredChecked,
    canSubmit,
  });

  return (
    <>
      <Button
        onClick={() => {
          if (canSubmit) {
            setShowSheet(true);
          }
        }}
        className="w-full"
        disabled={!canSubmit}
      >
        {t('page.sendToken.sendButton')}
      </Button>

      {/* Bottom Sheet */}
      <BottomFloatingSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="space-y-5">
          {/* Header - You're sending */}
          <div>
            <h2 className="text-[14px] font-normal text-secondary-foreground">
              {"You're sending"}
            </h2>
          </div>

          {/* Amount and Token Display */}
          {currentToken && amount && (
            <div className="flex items-start justify-between">
              <div>
                {/* Large Amount */}
                <p className="text-base font-medium text-primary-foreground leading-tight">
                  {amount} {currentToken.symbol}
                </p>
                {/* USD Value */}
                {currentToken.price && (
                  <p className="text-[12px] font-normal text-secondary-foreground mt-1">
                    ${(parseFloat(amount) * currentToken.price).toFixed(2)}
                  </p>
                )}
              </div>
              {/* Avatar/Icon placeholder */}
              <TooltipView content={toAddress || ''} side="top" variant="dark">
                <div className="w-12 h-12 rounded-full bg-r-neutral-line flex items-center justify-center">
                  <span className="text-[20px]">🐷</span>
                </div>
              </TooltipView>
            </div>
          )}
          <div className="">
            {/* Network Section */}
            {chainItem && (
              <div className=" pt-4">
                <div className="flex items-center justify-between p-3 bg-r-neutral-bg1 rounded-lg cursor-pointer hover:bg-r-neutral-bg2">
                  <div className="flex items-center gap-3">
                    <span className="text-primary-foreground font-medium">
                      Network
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {chainItem.logo && (
                      <img
                        src={chainItem.logo}
                        alt={chainItem.name}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-primary-foreground font-medium">
                      {chainItem.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-r-neutral-bg1 rounded-lg cursor-pointer hover:bg-r-neutral-bg2">
                  <div className="flex items-center gap-3">
                    <span className="text-primary-foreground font-medium">
                      Token
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentToken?.logo_url && (
                      <img
                        src={currentToken.logo_url}
                        alt={currentToken.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-primary-foreground font-medium">
                      {currentToken?.symbol}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Fee Section */}
            {estimatedFee && (
              <div className="flex items-center justify-between p-3 bg-r-neutral-bg1 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-primary-foreground font-medium">
                    Estimated fee
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {chainItem && (
                    <img
                      src={chainItem.logo}
                      alt={chainItem.name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-primary-foreground font-semibold">
                    ${estimatedFee}
                  </span>
                  {estimatedTime && (
                    <span className="text-secondary-foreground text-sm">
                      ~ {estimatedTime}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Risks Section */}
          {!!mostImportantRisks.length && (
            <div className="risks-wrapper">
              {/* <div className="risks-alert bg-r-red-light p-[12px] rounded-[8px]">
                {mostImportantRisks.map((risk) => (
                  <div
                    key={risk.value}
                    className="flex items-center justify-center"
                  >
                    <RcIconRiskAlert width={20} height={20} />
                    <span className={'risks-text ml-[8px] text-r-red-default'}>
                      {risk.value}
                    </span>
                  </div>
                ))}
              </div> */}
              <div
                className={clsx(
                  'risks-checkbox-line flex items-center justify-center mt-[9px]',
                  !isSubmitLoading ? 'cursor-pointer' : 'cursor-disallow'
                )}
                onClick={() => {
                  if (isSubmitLoading) return;
                  onCheck(!agreeRequiredChecked);
                }}
              >
                {agreeRequiredChecked ? (
                  <RcIconCheckboxChecked width={24} height={24} />
                ) : (
                  <RcIconCheckboxUncheck width={24} height={24} />
                )}
                <span className="ml-[8px] text-r-neutral-foot">
                  {t('page.sendToken.riskAlert.checkboxText')}
                </span>
              </div>
            </div>
          )}

          <div>
            <DirectSignToConfirmBtn
              buttonClassName="text-[16px]"
              title="Authorize"
              onConfirm={() => {
                onConfirm?.();
                setShowSheet(false);
              }}
              disabled={!canSubmit}
              accountType={currentAccount?.type}
              loading={miniSignLoading}
            />
          </div>
        </div>
      </BottomFloatingSheet>
    </>
  );
}
