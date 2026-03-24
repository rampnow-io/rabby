import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { GAS_ACCOUNT_INSUFFICIENT_TIP } from '../../../GasAccount/hooks/checkTxs';
import { GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import { BottomDrawer } from '@repo/ui';
import {
  Button,
  Card,
  Input,
  InputSize,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@repo/ui/primitives';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { findChain } from '@/utils/chain';

export const useShowMoreGasSelectModalVisible = createGlobalState(false);
export const useShowMoreCustomGasEditorTrigger = createGlobalState(0);

export const useGetShowMoreGasSelectVisible = () =>
  useShowMoreGasSelectModalVisible()[0];

export const useGetShowMoreCustomGasEditorTrigger = () =>
  useShowMoreCustomGasEditorTrigger()[0];

export const useEmitShowMoreCustomGasEditorTrigger = () =>
  useShowMoreCustomGasEditorTrigger()[1];

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
  const gasInfoByUIRef = React.useRef(gasInfoByUI);
  const emitShowMoreCustomEditorTrigger = useEmitShowMoreCustomGasEditorTrigger();
  const [customEditorVisible, setCustomEditorVisible] = useState(false);
  const [customGasGwei, setCustomGasGwei] = useState('');
  const [fallbackSelectedLevel, setFallbackSelectedLevel] = useState<string>(
    'custom'
  );
  const [maxPriorityFeeGwei, setMaxPriorityFeeGwei] = useState('');
  const [updatingCustomGas, setUpdatingCustomGas] = useState(false);
  const hasCustomPriorityFee = React.useRef(false);
  const [customEstimatedSeconds, setCustomEstimatedSeconds] = useState<
    number | null
  >(null);

  const { externalPanelSelection, handleClickEdit } = gasInfoByUI || {};

  useEffect(() => {
    if (!ctx) return;
    if (fallbackSelectedLevel !== 'custom') return;
    const customGasPriceGwei = Number(customGasGwei);
    if (!Number.isFinite(customGasPriceGwei) || customGasPriceGwei <= 0) return;

    const chain = findChain({ id: ctx.chainId });
    if (!wallet || !chain) return;

    const timer = window.setTimeout(async () => {
      try {
        const list = await wallet.gasMarketV2({
          chain,
          customGas: Math.round(customGasPriceGwei * 1e9),
          tx: ctx.txs?.[0],
        });
        const customGas = list.find((item) => item.level === 'custom');
        if (!customGas) return;

        if (!hasCustomPriorityFee.current) {
          setMaxPriorityFeeGwei(
            new BigNumber(customGas.priority_price ?? customGas.price)
              .div(1e9)
              .toFixed()
          );
        }
        setCustomEstimatedSeconds(customGas.estimated_seconds || 0);
      } catch (e) {
        console.error('[ShowMoreGasModal] load custom gas data failed', e);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [ctx, customGasGwei, fallbackSelectedLevel, wallet]);

  useEffect(() => {
    gasInfoByUIRef.current = gasInfoByUI;
  }, [gasInfoByUI]);

  useEffect(() => {
    if (status === 'idle' || !ctx?.txsCalc?.length) {
      useSetGasInfoByUI()(undefined);
    }
  }, [status, ctx?.txsCalc?.length]);

  if (!ctx?.txsCalc?.length) return null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const openLocalCustomEditor = useCallback(
    (forceCustom = false) => {
      const customGas = ctx.gasList?.find((item) => item.level === 'custom');
      const selectedLevel = forceCustom
        ? 'custom'
        : ctx.selectedGas?.level || 'custom';
      const selectedGas = ctx.gasList?.find(
        (item) => item.level === selectedLevel
      );

      const defaultGwei = customGas
        ? new BigNumber(customGas.price).div(1e9).toFixed()
        : '';

      const defaultPriority = selectedGas
        ? new BigNumber(selectedGas.priority_price ?? selectedGas.price)
            .div(1e9)
            .toFixed()
        : '';

      setFallbackSelectedLevel(selectedLevel);
      setCustomGasGwei(defaultGwei);
      setMaxPriorityFeeGwei(defaultPriority);
      setCustomEstimatedSeconds(customGas?.estimated_seconds || null);
      hasCustomPriorityFee.current = false;
      setCustomEditorVisible(true);
    },
    [ctx.gasList, ctx.selectedGas?.level]
  );

  const handleConfirmLocalCustomGas = useCallback(async () => {
    let pickedGas =
      ctx.gasList?.find((item) => item.level === fallbackSelectedLevel) ||
      ctx.gasList?.find((item) => item.level === 'custom');

    if (!pickedGas) {
      return;
    }

    let nextPrice = pickedGas.price;

    if (pickedGas.level === 'custom') {
      const customGasPriceGwei = Number(customGasGwei);
      if (!Number.isFinite(customGasPriceGwei) || customGasPriceGwei <= 0) {
        console.log('[ShowMoreGasModal] invalid custom gas input', {
          customGasGwei,
        });
        return;
      }
      nextPrice = Math.round(customGasPriceGwei * 1e9);

      const chain = findChain({ id: ctx.chainId });
      if (wallet && chain) {
        const list = await wallet.gasMarketV2({
          chain,
          customGas: nextPrice,
          tx: ctx.txs?.[0],
        });
        pickedGas = list.find((item) => item.level === 'custom') || pickedGas;
      }
    }

    const nextGas: GasLevel = {
      ...pickedGas,
      price: nextPrice,
      priority_price:
        maxPriorityFeeGwei !== ''
          ? Math.round(Number(maxPriorityFeeGwei) * 1e9)
          : pickedGas.priority_price,
    };

    try {
      setUpdatingCustomGas(true);
      if (wallet) {
        await signatureStore.updateGasLevel(nextGas, wallet as any);
      } else if (externalPanelSelection) {
        externalPanelSelection(nextGas);
      }
      setCustomEditorVisible(false);
    } catch (err) {
      console.error('[ShowMoreGasModal] confirm local custom gas failed', err);
    } finally {
      setUpdatingCustomGas(false);
    }
  }, [
    ctx.chainId,
    ctx.gasList,
    ctx.txs,
    customGasGwei,
    externalPanelSelection,
    fallbackSelectedLevel,
    maxPriorityFeeGwei,
    wallet,
  ]);

  const handleSelectGas = useCallback(
    async (gasLevel: string) => {
      console.log('[ShowMoreGasModal] handleSelectGas', {
        gasLevel,
        hasGasInfoByUI: !!gasInfoByUIRef.current,
        hasExternalPanelSelection: !!externalPanelSelection,
        hasHandleClickEdit: !!gasInfoByUIRef.current?.handleClickEdit,
      });

      const gas = ctx.gasList?.find((item) => item.level === gasLevel);
      if (!gas) return;

      if (gas.level === 'custom') {
        console.log('[ShowMoreGasModal] custom gas selected: start flow');

        // Close drawer first, then open editor to avoid overlay lifecycle races.
        handleOpenChange(false);

        // Keep the selected level in sync before opening editor when callback exists.
        if (externalPanelSelection) {
          console.log(
            '[ShowMoreGasModal] selecting custom via externalPanelSelection'
          );
          externalPanelSelection(gas);
        } else if (wallet) {
          console.log(
            '[ShowMoreGasModal] selecting custom via signatureStore.updateGasLevel'
          );
          await signatureStore.updateGasLevel(gas, wallet as any);
        }

        const triggerCustomEditor = (retry = 0) => {
          const callback = gasInfoByUIRef.current?.handleClickEdit;
          if (callback) {
            console.log('[ShowMoreGasModal] triggerCustomEditor success', {
              retry,
            });
            callback();
            return;
          }

          console.log(
            '[ShowMoreGasModal] triggerCustomEditor missing callback',
            {
              retry,
            }
          );
          if (retry < 4) {
            setTimeout(() => triggerCustomEditor(retry + 1), 120);
          } else {
            console.log(
              '[ShowMoreGasModal] triggerCustomEditor giving up after retries'
            );
          }
        };

        setTimeout(() => {
          triggerCustomEditor();
          if (!gasInfoByUIRef.current?.handleClickEdit) {
            const signal = Date.now();
            console.log('[ShowMoreGasModal] emit custom editor trigger', {
              signal,
            });
            emitShowMoreCustomEditorTrigger(signal);
            openLocalCustomEditor(true);
          }
        }, 280);
        return;
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

      setTimeout(() => handleOpenChange(false), 0);
    },
    [
      ctx.gasList,
      emitShowMoreCustomEditorTrigger,
      externalPanelSelection,
      handleClickEdit,
      openLocalCustomEditor,
      wallet,
    ]
  );

  const chain = ctx.chainId ? findChain({ id: ctx.chainId }) : undefined;
  const selectedLevelGas = ctx.gasList?.find(
    (item) => item.level === fallbackSelectedLevel
  );
  const maxPriorityFeeLimit =
    fallbackSelectedLevel === 'custom' && Number(customGasGwei) > 0
      ? Number(customGasGwei)
      : selectedLevelGas
      ? new BigNumber(selectedLevelGas.price).div(1e9).toNumber()
      : Number.MAX_SAFE_INTEGER;
  const gasCostUsd = ctx.selectedGasCost?.gasCostUsd
    ? formatGasHeaderUsdValue(ctx.selectedGasCost.gasCostUsd.toString())
    : '--';
  const gasCostAmount = ctx.selectedGasCost?.gasCostAmount
    ? new BigNumber(ctx.selectedGasCost.gasCostAmount.toString()).toFixed(4)
    : '--';
  const medianGwei = ctx.gasPriceMedian
    ? new BigNumber(ctx.gasPriceMedian).div(1e9).toFixed(5)
    : '--';
  const gasBalanceText = chain?.nativeTokenSymbol
    ? `${new BigNumber(ctx.nativeTokenBalance || '0').div(1e18).toFixed(4)} ${
        chain.nativeTokenSymbol
      }`
    : '--';

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChange(true);
        }}
      >
        {children}
      </div>

      {open && (
        <BottomDrawer
          variant="semi"
          rootSelector="body"
          close={() => handleOpenChange(false)}
        >
          <div className="custom-popup is-support-darkmode is-new p-4 min-h-[320px]">
            <div className="text-lg font-medium mb-3 px-1">Select Gas</div>
            <RadioGroup
              value={ctx.selectedGas?.level}
              className="flex flex-col gap-y-3 max-h-[420px] overflow-y-auto"
            >
              {ctx.gasList?.map((gas) => {
                const gwei = new BigNumber(gas.price / 1e9)
                  .toFixed()
                  .slice(0, 8);

                const isActive = ctx.selectedGas?.level === gas.level;
                const isCustom = gas.level === 'custom';

                return (
                  <div key={gas.level}>
                    <RadioGroupItem
                      className="hidden"
                      value={gas.level}
                      id={`gas-${gas.level}`}
                    />
                    <Label
                      htmlFor={`gas-${gas.level}`}
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectGas(gas.level);
                      }}
                    >
                      <Card
                        className={clsx(
                          'flex min-h-[72px] cursor-pointer items-center justify-between rounded-[16px] px-4 py-4 border shadow-none transition-all',
                          'bg-card-border border-transparent hover:border-card-hover',
                          isActive && 'border border-card-selected'
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-r-neutral-title-1">
                            {t(getGasLevelI18nKey(gas.level))}
                          </p>
                          {!isCustom && (
                            <p className="text-sm text-r-neutral-foot">
                              {gwei} Gwei
                            </p>
                          )}
                        </div>
                      </Card>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </BottomDrawer>
      )}

      <BottomFloatingSheet
        open={customEditorVisible}
        onClose={() => setCustomEditorVisible(false)}
        header={
          <div className="text-[20px] font-medium text-r-neutral-title1">
            Custom Gas
          </div>
        }
        contentClassName="px-4 py-4"
      >
        <div className="flex flex-col gap-4">
          <div className="text-[16px] text-r-neutral-body">
            My Gas balance:
            <span className="font-medium text-r-neutral-title1">
              {' '}
              {gasBalanceText}
            </span>
          </div>

          {fallbackSelectedLevel === 'custom' ? (
            <div className="w-full flex items-center justify-between">
              {' '}
              <div className="text-base font-medium text-primary-foreground">
                Priority Fee (Gwei)
              </div>
              <Input
                className="!w-[96px]"
                value={customGasGwei}
                sizeVariant={InputSize.SM}
                onChange={(e) => setCustomGasGwei(e.target.value)}
              />
            </div>
          ) : null}

          <Button
            disabled={
              updatingCustomGas ||
              (fallbackSelectedLevel === 'custom' && Number(customGasGwei) <= 0)
            }
            onClick={handleConfirmLocalCustomGas}
          >
            {updatingCustomGas ? 'Applying...' : 'Set'}
          </Button>
        </div>
      </BottomFloatingSheet>
    </>
  );
}
