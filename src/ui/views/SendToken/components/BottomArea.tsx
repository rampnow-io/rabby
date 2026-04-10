import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { formatTokenAmount } from 'ui/utils';
import { DirectSignToConfirmBtn } from '@/ui/component/ToConfirmButton';
import type { Account } from '@/background/service/preference';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import type { TokenItem } from '@/background/service/openapi';
import type { Chain } from '@debank/common';

import { ReactComponent as RcIconCheckboxChecked } from '@/ui/assets/send-token/icon-checkbox-checked.svg';
import { ReactComponent as RcIconCheckboxUncheck } from '@/ui/assets/send-token/icon-checkbox-uncheck.svg';
import { Badge, Button, TooltipView } from '@repo/ui/primitives';
import { useSignatureStore } from '@/ui/component/MiniSignV2/state';
import { calcGasEstimated } from '@/utils/time';
import { truncate } from '@repo/utils';

const formatSmallValue = (
  value: number | string | undefined | null,
  options?: {
    minDisplay?: number;
    decimals?: number;
    prefix?: string;
  }
) => {
  const { minDisplay = 0.000001, decimals = 6, prefix = '' } = options || {};

  if (value === null || value === undefined) {
    return { formatted: null, isSmall: false, original: '' };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return { formatted: null, isSmall: false, original: '' };
  if (num === 0)
    return { formatted: `${prefix}0`, isSmall: false, original: '' };

  const isSmall = num > 0 && num < minDisplay;

  return {
    formatted: isSmall
      ? `<${prefix}${minDisplay}`
      : `${prefix}${num.toFixed(decimals)}`,
    isSmall,
    original: num.toString(),
  };
};

const RANDOM_EMOJIS = [
  '🐵',
  '🐺',
  '🦊',
  '🐈',
  '🦁',
  '🐐',
  '🐪',
  '🦣',
  '🦏',
  '🐭',
  '🦉',
  '🦅',
  '🦋',
  '🐋',
  '🐬',
  '🐟',
  '🐠',
  '🐡',
  '🦈',
  '🐉',
  '🐲',
  '🦩',
  '🐓',
  '🦇',
];

const RANDOM_BG_COLORS = [
  'bg-red-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-pink-100',
  'bg-indigo-100',
  'bg-cyan-100',
  'bg-orange-100',
  'bg-teal-100',
];

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
  const { ctx } = useSignatureStore();

  const randomEmoji = useMemo(
    () => RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)],
    []
  );
  const randomBgColor = useMemo(
    () => RANDOM_BG_COLORS[Math.floor(Math.random() * RANDOM_BG_COLORS.length)],
    []
  );

  const canSubmit =
    _canSubmit && (!mostImportantRisks.length || agreeRequiredChecked);

  // may be we can use in future when we want to show estimated fee in more places
  // const gasTokenAmountDisplay = ctx?.selectedGasCost?.gasCostAmount
  //   ? formatTokenAmount(ctx.selectedGasCost.gasCostAmount.toString(), 8, true)
  //   : estimatedFee
  //   ? formatTokenAmount(estimatedFee?.toString() || '0', 8, true)
  //   : '0';

  const gasFeeUSD = useMemo(() => {
    if (!currentToken?.price) return null;
    const gasFeeAmount = ctx?.selectedGasCost?.gasCostAmount
      ? parseFloat(ctx.selectedGasCost.gasCostAmount.toString())
      : parseFloat(estimatedFee?.toString() || '0');

    return gasFeeAmount * currentToken.price;
  }, [ctx?.selectedGasCost?.gasCostAmount, estimatedFee, currentToken?.price]);

  const displayEstimatedTime = ctx?.selectedGas?.estimated_seconds
    ? calcGasEstimated(ctx.selectedGas.estimated_seconds)
    : estimatedTime;

  const formattedAmount = useMemo(() => {
    return formatSmallValue(amount, {
      minDisplay: 0.000001,
      decimals: 4,
    });
  }, [amount]);

  const formattedGasUSD = useMemo(() => {
    return formatSmallValue(gasFeeUSD, {
      minDisplay: 0.01,
      decimals: 2,
      prefix: '$',
    });
  }, [gasFeeUSD]);

  return (
    <>
      <Button
        onClick={() => canSubmit && setShowSheet(true)}
        className="w-full"
        disabled={!canSubmit}
      >
        {t('page.sendToken.sendButton')}
      </Button>

      <BottomFloatingSheet
        hideCloseButton
        open={showSheet}
        onClose={() => setShowSheet(false)}
      >
        <div className="space-y-5">
          <h2 className="text-[14px] text-secondary-foreground">
            {"You're sending"}
          </h2>

          {currentToken && amount && (
            <div className="flex justify-between">
              <div className="pt-4">
                {formattedAmount.isSmall ? (
                  <TooltipView
                    content={`${parseFloat(formattedAmount.original)} ${
                      currentToken.symbol
                    }`}
                  >
                    <p className="text-base font-medium text-primary-foreground leading-tight cursor-help border-b border-dashed">
                      {formattedAmount.formatted} {currentToken.symbol}
                    </p>
                  </TooltipView>
                ) : (
                  <p className="text-base font-medium text-primary-foreground leading-tight">
                    {formattedAmount.formatted} {currentToken.symbol}
                  </p>
                )}

                {currentToken.price &&
                  (() => {
                    const usdValue = parseFloat(amount) * currentToken.price;

                    const formatted = formatSmallValue(usdValue, {
                      minDisplay: 0.01,
                      decimals: 2,
                      prefix: '$',
                    });

                    return (
                      <p className="text-[12px] text-secondary-foreground mt-1">
                        {formatted.isSmall ? (
                          <TooltipView variant="dark" content={`$${usdValue}`}>
                            <span className="cursor">
                              {formatted.formatted}
                            </span>
                          </TooltipView>
                        ) : (
                          formatted.formatted
                        )}
                      </p>
                    );
                  })()}
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="relative">
                  <Badge className="bg-black hover:bg-black hover:text-white text-white rounded-full px-3 py-1">
                    {truncate(toAddress, [7, 6])}
                  </Badge>

                  <div className="absolute -bottom-1.5 right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black" />
                </div>

                <div
                  className={`w-12 h-12 rounded-full ${randomBgColor} flex items-center justify-center cursor-pointer`}
                >
                  <span className="text-base font-medium">{randomEmoji}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 p-3 bg-[#FAFAFA] rounded-[16px]">
            {chainItem && (
              <div className="flex justify-between  rounded-lg">
                <span>Network</span>
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
            )}
            <div className="flex justify-between rounded-lg">
              <span>Token</span>
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

            {(estimatedFee || ctx?.selectedGasCost?.gasCostAmount) && (
              <div className="flex justify-between  rounded-lg">
                <span>Network fee</span>

                <div className="flex items-end gap-1">
                  {formattedGasUSD && (
                    <p className="text-[12px] text-secondary-foreground">
                      {formattedGasUSD.isSmall ? (
                        <TooltipView variant="dark" content={`$${gasFeeUSD}`}>
                          <span className="cursor">
                            {formattedGasUSD.formatted}
                          </span>
                        </TooltipView>
                      ) : (
                        formattedGasUSD.formatted
                      )}
                    </p>
                  )}

                  {displayEstimatedTime && (
                    <span className="text-sm text-secondary-foreground">
                      {displayEstimatedTime}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          {!!mostImportantRisks.length && (
            <div
              className="flex items-center justify-center cursor-pointer"
              onClick={() => !isSubmitLoading && onCheck(!agreeRequiredChecked)}
            >
              {agreeRequiredChecked ? (
                <RcIconCheckboxChecked />
              ) : (
                <RcIconCheckboxUncheck />
              )}
              <span className="ml-2">
                {t('page.sendToken.riskAlert.checkboxText')}
              </span>
            </div>
          )}

          <DirectSignToConfirmBtn
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
      </BottomFloatingSheet>
    </>
  );
}
