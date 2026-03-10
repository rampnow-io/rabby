import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BigNumber from 'bignumber.js';
import { ReactComponent as IconGasCustomRightArrowCC } from 'ui/assets/approval/edit-arrow-right.svg';
import { ReactComponent as IconGasLevelChecked } from '@/ui/assets/sign/check.svg';
import { formatGasHeaderUsdValue, getUiType, useWallet } from '@/ui/utils';
import { getGasLevelI18nKey } from '@/ui/utils/trans';
import { Dropdown, Modal, Tooltip } from 'antd';
import { GasLevelIcon } from '../../Approval/components/TxComponents/GasMenuButton';

import { ReactComponent as RcIconGasActive } from 'ui/assets/sign/tx/gas-active.svg';
import { ReactComponent as RcIconGasBlurCC } from 'ui/assets/sign/tx/gas-blur-cc.svg';

import { ReactComponent as RcIconGasAccountBlurCC } from 'ui/assets/sign/tx/gas-account-blur-cc.svg';
import { ReactComponent as RcIconGasAccountActive } from 'ui/assets/sign/tx/gas-account-active.svg';
import { GasMethod } from '../../Approval/components/TxComponents/GasSelectorHeader';
import clsx from 'clsx';
import { createGlobalState } from 'react-use';
import { ReactComponent as RcIconLoading } from 'ui/component/ChainSelector/icons/loading-cc.svg';
import {
  useSignatureStore,
  signatureStore,
} from '@/ui/component/MiniSignV2/state';
import { Popup } from '@/ui/component';
import styled, { css } from 'styled-components';
import { GAS_ACCOUNT_INSUFFICIENT_TIP } from '../../GasAccount/hooks/checkTxs';
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

  const { externalPanelSelection, handleClickEdit } = gasInfoByUI || {};

  useEffect(() => {
    if (['idle', 'prefetching'].includes(status) || !ctx?.txsCalc?.length) {
      useSetGasInfoByUI()(undefined);
    }
  }, [status, ctx?.txsCalc?.length]);

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
        className="!mr-1 max-w-[300px] !p-2 rounded-[32px] border border-[#CACACD] bg-[rgba(250,250,250,0.75)] shadow-[0_23px_14px_4px_rgba(24,24,27,0.03)] backdrop-blur-[12px]"
        onInteractOutside={(e) => {
          e.preventDefault();
          handleOpenChange(false);
        }}
      >
        <div>
          <div className="space-y-2">
            {ctx.gasList?.map((gas) => {
              const gwei = new BigNumber(gas.price / 1e9).toFixed().slice(0, 8);

              const isActive = ctx.selectedGas?.level === gas.level;
              const isCustom = gas.level === 'custom';

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

                    if (ctx?.gasMethod !== 'native') {
                      signatureStore.setGasMethod('native');
                    }

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
                    'flex items-center justify-between min-h-[66px] px-[22px] py-[12px] rounded-[999px] cursor-pointer',
                    'bg-white ',
                    isActive && 'ring-1 ring-primary'
                  )}
                  style={{
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[15px] leading-none font-medium text-r-neutral-title-1">
                      {t(getGasLevelI18nKey(gas.level))}
                    </span>
                    {!isCustom && (
                      <span className="text-[13px] leading-none text-r-neutral-foot">
                        {gwei} Gwei
                      </span>
                    )}
                  </div>

                  {isCustom ? <div className="w-16" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
