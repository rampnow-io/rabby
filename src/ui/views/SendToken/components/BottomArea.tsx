import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { getUiType } from 'ui/utils';
import { DirectSignToConfirmBtn } from '@/ui/component/ToConfirmButton';
import type { Account } from '@/background/service/preference';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';

import { ReactComponent as RcIconRiskAlert } from '@/ui/assets/send-token/risk-alert.svg';
import { ReactComponent as RcIconCheckboxChecked } from '@/ui/assets/send-token/icon-checkbox-checked.svg';
import { ReactComponent as RcIconCheckboxUncheck } from '@/ui/assets/send-token/icon-checkbox-uncheck.svg';
import { Button } from '@repo/ui/primitives';

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
}) {
  const { t } = useTranslation();
  const [showSheet, setShowSheet] = useState(false);

  const canSubmit =
    _canSubmit && (!mostImportantRisks.length || agreeRequiredChecked);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <button
          onClick={() => {
            if (canSubmit) {
              setShowSheet(true);
            }
          }}
          disabled={!canSubmit}
          className={clsx(
            'w-full h-[48px] rounded-[12px] font-semibold text-[16px] transition-all',
            canSubmit
              ? 'bg-r-green-default text-white hover:opacity-90 active:scale-95'
              : 'bg-r-neutral-card-2 text-r-neutral-foot cursor-not-allowed'
          )}
        >
          {t('page.sendToken.sendButton')}
        </button>
      </div>

      {/* Bottom Sheet */}
      <BottomFloatingSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="space-y-4">
          {!!mostImportantRisks.length && (
            <div className="risks-wrapper">
              <div className="risks-alert bg-r-red-light p-[12px] rounded-[8px]">
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
              </div>
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

          {/* Submit Button in Sheet */}
          <div className="btn-wrapper w-full">
            {canUseDirectSubmitTx && currentAccount?.type ? (
              <DirectSignToConfirmBtn
                buttonClassName="text-[16px]"
                title={t('page.sendToken.sendButton')}
                onConfirm={() => {
                  onConfirm?.();
                  setShowSheet(false);
                }}
                disabled={!canSubmit}
                accountType={currentAccount?.type}
                loading={miniSignLoading}
              />
            ) : (
              <Button
                disabled={!canSubmit}
                type="submit"
                className={clsx('w-full h-[48px] text-[16px]')}
                onClick={() => {
                  onConfirm?.();
                  setShowSheet(false);
                }}
              >
                {t('page.sendToken.sendButton')}
              </Button>
            )}
          </div>
        </div>
      </BottomFloatingSheet>
    </>
  );
}
