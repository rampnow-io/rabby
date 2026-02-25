import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BigNumber from 'bignumber.js';
import { ReactComponent as IconGasCustomRightArrowCC } from 'ui/assets/approval/edit-arrow-right.svg';
import { ReactComponent as IconGasLevelChecked } from '@/ui/assets/sign/check.svg';
import { formatGasHeaderUsdValue, getUiType, useWallet } from '@/ui/utils';
import { getGasLevelI18nKey } from '@/ui/utils/trans';
import { Dropdown, Modal, Tooltip } from 'antd';
import { GasLevelIcon } from '../../../Approval/components/TxComponents/GasMenuButton';

import { ReactComponent as RcIconGasActive } from 'ui/assets/sign/tx/gas-active.svg';
import { ReactComponent as RcIconGasBlurCC } from 'ui/assets/sign/tx/gas-blur-cc.svg';

import { ReactComponent as RcIconGasAccountBlurCC } from 'ui/assets/sign/tx/gas-account-blur-cc.svg';
import { ReactComponent as RcIconGasAccountActive } from 'ui/assets/sign/tx/gas-account-active.svg';
import { GasMethod } from '../../../Approval/components/TxComponents/GasSelectorHeader';
import clsx from 'clsx';
import { createGlobalState } from 'react-use';
import { ReactComponent as RcIconLoading } from 'ui/component/ChainSelector/icons/loading-cc.svg';
import {
  useSignatureStore,
  signatureStore,
} from '@/ui/component/MiniSignV2/state';
import { Popup } from '@/ui/component';
import styled, { css } from 'styled-components';
import { GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/primitives';

export const useShowMoreGasSelectModalVisible = createGlobalState(false);

export const useGetShowMoreGasSelectVisible = () =>
  useShowMoreGasSelectModalVisible()[0];

const useGasInfoByUI = createGlobalState<
  | {
      externalPanelSelection: (gas: GasLevel) => void;
      handleClickEdit: () => void;
      gasCostUsdStr: string;
      gasUsdList: {
        slow: string;
        normal: string;
        fast: string;
      };
      gasIsNotEnough: {
        slow: boolean;
        normal: boolean;
        fast: boolean;
      };
      gasAccountIsNotEnough: {
        slow: [boolean, string];
        normal: [boolean, string];
        fast: [boolean, string];
      };
      gasAccountCost?: {
        total_cost: number;
        tx_cost: number;
        gas_cost: number;
        estimate_tx_cost: number;
      };
    }
  | undefined
>(undefined);

export const [useGetGasInfoByUI, useSetGasInfoByUI] = [
  () => useGasInfoByUI()[0],
  () => useGasInfoByUI()[1],
];

export default function ShowMoreGasSelectModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const state = useSignatureStore();
  const { ctx, status } = state;
  const wallet = useWallet();

  const gasInfoByUI = useGetGasInfoByUI();
  const [open, setOpen] = useShowMoreGasSelectModalVisible();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const {
    externalPanelSelection,
    handleClickEdit,
    gasCostUsdStr,
    gasUsdList,
    gasAccountIsNotEnough,
    gasAccountCost,
  } = gasInfoByUI || {};

  useEffect(() => {
    if (['idle', 'prefetching'].includes(status) || !ctx?.txsCalc?.length) {
      useSetGasInfoByUI()(undefined);
    }
  }, [status, ctx?.txsCalc?.length]);

  const hasCustomRpc = !ctx?.noCustomRPC;

  const calcGasAccountUsd = useCallback((n: number) => {
    if (Number(n) < 0.0001) return `$${n}`;
    return formatGasHeaderUsdValue(n || '0');
  }, []);

  if (!ctx?.txsCalc?.length) return null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setInternalOpen(nextOpen);
  };

  // Sync external state changes
  React.useEffect(() => {
    if (open !== internalOpen) {
      setInternalOpen(open);
    }
  }, [open]);

  return (
    <Popover open={open || internalOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-[256px] rounded-[8px] border border-rabby-neutral-line bg-r-neutral-bg1 shadow-lg p-0 z-50"
        onInteractOutside={(e) => {
          e.preventDefault();
          handleOpenChange(false);
        }}
      >
        {/* GAS METHOD */}
        <div className="flex items-center p-2 m-2 rounded-md border border-rabby-neutral-line">
          <GasMethod
            active={ctx?.gasMethod === 'native'}
            onChange={() => signatureStore.setGasMethod('native')}
            ActiveComponent={RcIconGasActive}
            BlurComponent={RcIconGasBlurCC}
            title={t('page.gasAccount.gasToken')}
          />

          <div
            className={clsx(hasCustomRpc && 'cursor-not-allowed opacity-50')}
          >
            <GasMethod
              active={ctx?.gasMethod === 'gasAccount'}
              onChange={() => {
                if (hasCustomRpc) return;
                signatureStore.setGasMethod('gasAccount');
              }}
              ActiveComponent={RcIconGasAccountActive}
              BlurComponent={RcIconGasAccountBlurCC}
              title={t('page.gasAccount.title')}
            />
          </div>
        </div>

        {/* GAS LIST */}
        <div className="space-y-2 px-4 pb-2">
          {ctx.gasList?.map((gas) => {
            const gwei = new BigNumber(gas.price / 1e9).toFixed().slice(0, 8);

            const isActive = ctx.selectedGas?.level === gas.level;
            const isCustom = gas.level === 'custom';

            let costUsd =
              ctx.gasMethod === 'native'
                ? gasUsdList?.[gas.level]
                : gasAccountIsNotEnough?.[gas.level]?.[1];

            if (isActive) {
              costUsd =
                ctx.gasMethod === 'gasAccount'
                  ? calcGasAccountUsd(
                      (gasAccountCost?.estimate_tx_cost || 0) +
                        (gasAccountCost?.gas_cost || 0)
                    )
                  : gasCostUsdStr;
            }

            return (
              <div
                key={gas.level}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    if (externalPanelSelection) {
                      externalPanelSelection(gas);
                    } else if (wallet) {
                      await signatureStore.updateGasLevel(gas, wallet as any);
                    }
                  } catch (err) {
                    console.error('Failed to select gas level', err);
                  }
                  if (isCustom) handleClickEdit?.();
                  setTimeout(() => handleOpenChange(false), 0);
                }}
                className={clsx(
                  'flex items-center justify-between h-[48px] px-2 rounded-md cursor-pointer',
                  'hover:bg-r-blue-light-1',
                  isActive && 'bg-r-blue-light-1'
                )}
                style={{
                  pointerEvents: 'auto',
                  userSelect: 'none',
                  touchAction: 'manipulation',
                }}
              >
                <div className="flex items-center gap-2">
                  <GasLevelIcon level={gas.level} isActive={false} />
                  <span className="text-sm font-medium">
                    {t(getGasLevelI18nKey(gas.level))}
                  </span>
                  {!isCustom && (
                    <span className="text-xs text-r-neutral-foot">
                      {gwei} Gwei
                    </span>
                  )}
                  {isActive && !isCustom && (
                    <IconGasLevelChecked className="text-r-blue-default" />
                  )}
                </div>

                {isCustom ? (
                  <IconGasCustomRightArrowCC />
                ) : (
                  <span className="text-sm font-medium">{costUsd}</span>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
