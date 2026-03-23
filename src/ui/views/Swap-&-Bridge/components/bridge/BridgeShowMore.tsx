import { TokenWithChain } from '@/ui/component';
import { getTokenSymbol } from '@/ui/utils/token';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { Switch, Tooltip } from 'antd';
import clsx from 'clsx';
import { Info } from 'lucide-react';
import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ReactComponent as IconArrowDownCC } from 'ui/assets/bridge/tiny-down-arrow-cc.svg';
import { ReactComponent as RcIconInfo } from 'ui/assets/info-cc.svg';
import { BridgeSlippage } from './BridgeSlippage';

import imgBestQuoteSharpBg from '@/ui/assets/swap/best-quote-sharp-bg.svg';
import styled from 'styled-components';
import { findChainByServerID } from '@/utils/chain';
import BigNumber from 'bignumber.js';
import { CHAINS_ENUM } from '@debank/common';
import {
  formatAmount,
  formatGasHeaderUsdValue,
  formatTokenAmount,
  formatUsdValue,
} from '@/ui/utils';
import { calcGasEstimated } from '@/utils/time';
import ShowMoreGasSelectModal, {
  useGetGasInfoByUI,
  useShowMoreGasSelectModalVisible,
} from './ShowMoreGasModal';
import { getGasLevelI18nKey } from '@/ui/utils/trans';
import { ReactComponent as IconInfoSVG } from 'ui/assets/info-cc.svg';
import { noop } from 'lodash';
import {
  useSignatureStore,
  signatureStore,
} from '@/ui/component/MiniSignV2/state';
import {
  GasAccountTips,
  GasLessActivityToSign,
  GasLessNotEnough,
} from '../../../Approval/components/FooterBar/GasLessComponents';
import { useGasAccountSign } from '../../../GasAccount/hooks';
import { useMemoizedFn } from 'ahooks';
import { Button, Skeleton, TooltipView } from '@repo/ui/primitives';
import { tokenPriceImpact } from '../../hooks';

const PreferMEVGuardSwitch = styled(Switch)`
  min-width: 20px;
  height: 12px;

  &.ant-switch-checked {
    background-color: var(--r-blue-default, #7084ff);
    .ant-switch-handle {
      left: calc(100% - 10px - 1px);
      top: 1px;
    }
  }
  .ant-switch-handle {
    height: 10px;
    width: 10px;
    top: 1px;
    left: 1px;
  }
`;

export const BridgeShowMore = ({
  openQuotesList,
  sourceName,
  sourceLogo,
  duration,
  slippage,
  displaySlippage,
  onSlippageChange,
  fromToken,
  toToken,
  amount,
  toAmount,
  quoteLoading,
  slippageError,
  autoSlippage,
  isCustomSlippage,
  setAutoSlippage,
  setIsCustomSlippage,
  open,
  setOpen,
  type,
  isWrapToken,
  isBestQuote,
  showMEVGuardedSwitch,
  originPreferMEVGuarded,
  switchPreferMEV,
  recommendValue,
  openFeePopup,
  supportDirectSign = false,
  autoSuggestSlippage,
  onOpenInfo,
  showHeader = true,
  selectedQuote,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  openQuotesList: () => void;
  sourceName: string;
  sourceLogo: string;
  duration?: number;
  slippage: string;
  displaySlippage: string;
  onSlippageChange: (n: string) => void;
  showLoss?: boolean;
  fromToken?: TokenItem;
  toToken?: TokenItem;
  amount?: string | number;
  toAmount?: string | number;
  quoteLoading?: boolean;
  slippageError?: boolean;
  autoSlippage: boolean;
  isCustomSlippage: boolean;
  setAutoSlippage: (boolean: boolean) => void;
  setIsCustomSlippage: (boolean: boolean) => void;
  type: 'swap' | 'bridge';
  /**
   * for swap props
   */
  isWrapToken?: boolean;
  isBestQuote: boolean;
  showMEVGuardedSwitch?: boolean;
  originPreferMEVGuarded?: boolean;
  switchPreferMEV?: (b: boolean) => void;
  recommendValue?: number;
  openFeePopup: () => void;
  autoSuggestSlippage?: string;
  supportDirectSign?: boolean;
  onOpenInfo?: () => void;
  showHeader?: boolean;
  selectedQuote?: any;
}) => {
  const { t } = useTranslation();
  const sourceAlwaysShow = type === 'bridge';

  const RABBY_FEE = '0.25%';

  const data = useMemo(() => {
    if (quoteLoading || (!sourceLogo && !sourceName)) {
      return {
        showLoss: false,
        diff: '',
        fromUsd: '',
        toUsd: '',
        lossUsd: '',
      };
    }
    return tokenPriceImpact(fromToken, toToken, amount, toAmount);
  }, [
    fromToken,
    toToken,
    amount,
    toAmount,
    quoteLoading,
    sourceLogo,
    sourceName,
  ]);

  const bestQuoteStyle = useMemo(() => {
    if (isBestQuote) {
      return {
        backgroundImage: `url(${imgBestQuoteSharpBg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '38px',
      };
    }
    return undefined;
  }, [isBestQuote]);

  const showSlippageError = slippageError;

  const estimatedFeeDisplay = useMemo(() => {
    if (!selectedQuote?.gas_fee) {
      return '-';
    }

    const gasFeeAmount = selectedQuote.gas_fee.amount;
    const gasFeeSymbol = selectedQuote.gas_fee.symbol;

    if (gasFeeAmount && gasFeeSymbol) {
      return `${gasFeeAmount} ${gasFeeSymbol}`;
    }

    if (selectedQuote?.gas_fee?.usd_value) {
      return formatUsdValue(selectedQuote.gas_fee.usd_value);
    }

    return '-';
  }, [selectedQuote]);

  const showMinDuration = useMemo(() => {
    return Math.max(Math.round((duration || 0) / 60), 1);
  }, [duration]);

  const durationColor = useMemo(() => {
    if (showMinDuration > 10) {
      return 'text-r-red-default';
    }

    if (showMinDuration > 3) {
      return 'text-r-orange-default';
    }
    return 'text-r-blue-default';
  }, [showMinDuration]);

  const exchangeRateDisplay = useMemo(() => {
    if (!fromToken || !toToken || !amount || !toAmount || quoteLoading) {
      return { fromLabel: '-', toDisplay: '-' };
    }

    const amountBN = new BigNumber(amount);
    const toAmountBN = new BigNumber(toAmount);

    if (amountBN.lte(0) || toAmountBN.lte(0)) {
      return { fromLabel: '-', toDisplay: '-' };
    }

    const fromSymbol = getTokenSymbol(fromToken);
    const toSymbol = getTokenSymbol(toToken);

    // Calculate: 1 fromToken = ? toToken
    const fromDecimals = fromToken.decimals || 18;
    const toDecimals = toToken.decimals || 18;

    const rate = toAmountBN
      .div(new BigNumber(10).pow(toDecimals))
      .div(amountBN.div(new BigNumber(10).pow(fromDecimals)));

    const rateStr = rate.dp(8, BigNumber.ROUND_DOWN).toString();

    return {
      fromLabel: `1 ${fromSymbol}`,
      toDisplay: `${rateStr} ${toSymbol}`,
    };
  }, [fromToken, toToken, amount, toAmount, quoteLoading]);

  const sourceContentRender = useMemoizedFn(() => {
    return (
      <ListItem
        name={type === 'bridge' ? 'Source' : 'Source'}
        className="mb-4 h-[18px] text-[14px] font-medium text-primary-foreground"
      >
        {quoteLoading ? (
          <Skeleton />
        ) : (
          <div className="flex items-center gap-4  cursor-pointer">
            <div className="flex items-center gap-4 cursor-pointer">
              {isBestQuote ? (
                <span className="text-r-neutral-title2 text-[12px] font-medium italic py-1 pl-6 pr-8">
                  {t('page.swap.best')}
                </span>
              ) : null}
              {sourceLogo && (
                <img
                  className="w-4 h-4 rounded-full"
                  src={sourceLogo}
                  alt={sourceName}
                />
              )}
              <span className="text-[14px] font-light text-secondary-foreground">
                {sourceName}
              </span>
              {!sourceLogo && !sourceName ? (
                <span className="text-[14px] text-r-neutral-foot">-</span>
              ) : null}
            </div>
          </div>
        )}
      </ListItem>
    );
  });

  const lostValueContentRender = useCallback(() => {
    return (
      <>
        {data?.showLoss && !quoteLoading && (
          <div className="leading-4 mb-3 text-xs text-r-neutral-foot">
            <div className="flex justify-between">
              <span>{t('page.bridge.price-impact')}</span>
              <span
                className={clsx(
                  'font-medium  inline-flex items-center',
                  'text-r-red-default'
                )}
              >
                -{data.diff}%
                <div>
                  <RcIconInfo className="ml-1 text-rabby-neutral-foot w-[14px] h-[14px] " />
                </div>
              </span>
            </div>
            <div className="mt-[8px] rounded-[4px] border-[0.5px] border-rabby-red-default bg-r-red-light p-2 text-xs font-normal text-r-red-default">
              {t('page.bridge.loss-tips', {
                usd: data?.lossUsd,
              })}
            </div>
          </div>
        )}
      </>
    );
  }, [data, quoteLoading, toToken, fromToken]);

  return (
    <div className=" space-y-4">
      <ListItem name={exchangeRateDisplay.fromLabel} className="mb-4">
        <div className="text-[14px] font-medium text-secondary-foreground">
          {exchangeRateDisplay.toDisplay}
        </div>
      </ListItem>

      {lostValueContentRender()}
      {sourceContentRender()}

      <ListItem name="Network Fee" className="mt-3">
        <div className="text-[14px] font-medium text-secondary-foreground">
          {estimatedFeeDisplay}
        </div>
      </ListItem>

      <ListItem name={t('page.swap.rabbyFee.title')} className="mt-3 h-[18px]">
        <div
          className="text-[14px] font-medium text-secondary-foreground"
          onClick={openFeePopup}
        >
          {isWrapToken && type === 'swap'
            ? t('page.swap.no-fees-for-wrap')
            : RABBY_FEE}
        </div>
      </ListItem>

      {showMEVGuardedSwitch && type === 'swap' ? (
        <ListItem
          name={
            <>
              <span>{t('page.swap.preferMEV')}</span>
            </>
          }
          className="mt-12"
        >
          <PreferMEVGuardSwitch
            checked={originPreferMEVGuarded}
            onChange={switchPreferMEV}
          />
        </ListItem>
      ) : null}
      <BridgeSlippage
        autoSuggestSlippage={autoSuggestSlippage}
        value={slippage}
        displaySlippage={displaySlippage}
        onChange={onSlippageChange}
        autoSlippage={autoSlippage}
        isCustomSlippage={isCustomSlippage}
        setAutoSlippage={setAutoSlippage}
        setIsCustomSlippage={setIsCustomSlippage}
        type={type}
        isWrapToken={isWrapToken}
        recommendValue={recommendValue}
      />

      <Button onClick={() => setOpen(false)} className="w-full">
        Close
      </Button>
    </div>
  );
};

const GasTipsWrapper = styled.div`
  position: relative;

  .security-level-tip {
    margin-top: 10px;
    border-radius: 4px;
    padding: 6px 10px 6px 8px;
    font-weight: 500;
    font-size: 13px;
    line-height: 15px;
    display: flex;
    position: relative;
    .icon-level {
      width: 14px;
      height: 14px;
      margin-right: 6px;
    }
  }
`;

export const DirectSignGasInfo = ({
  supportDirectSign,
  loading,
  openShowMore,
  noQuote,
  chainServeId,
}: {
  supportDirectSign: boolean;
  loading: boolean;
  openShowMore: (v: boolean) => void;
  noQuote?: boolean;
  chainServeId: string;
}) => {
  const { t } = useTranslation();

  const [, setGasModalVisible] = useShowMoreGasSelectModalVisible();

  const chainEnum = findChainByServerID(chainServeId)?.enum;
  const chainInfo = findChainByServerID(chainServeId);

  const calcGasAccountUsd = useCallback((n: number | string) => {
    const v = Number(n);
    if (!Number.isNaN(v) && v < 0.0001) {
      return `$${n}`;
    }
    return formatGasHeaderUsdValue(n || '0');
  }, []);

  const { sig, accountId } = useGasAccountSign();

  const isGasAccountLogin = !!sig && !!accountId;

  const { ctx, config } = useSignatureStore();

  const gasInfoByUI = useGetGasInfoByUI();

  const { gasCostUsdStr, gasAccountCost } = gasInfoByUI || {};

  const gasCostUsd =
    ctx?.gasMethod === 'gasAccount'
      ? calcGasAccountUsd(
          (gasAccountCost?.estimate_tx_cost || 0) +
            Number(gasAccountCost?.gas_cost || 0)
        )
      : gasCostUsdStr;

  const gasCostUsdDisplay =
    gasCostUsd ||
    (ctx?.selectedGasCost?.gasCostUsd
      ? formatGasHeaderUsdValue(ctx.selectedGasCost.gasCostUsd.toString())
      : '--');

  const gasTokenAmountDisplay = ctx?.selectedGasCost?.gasCostAmount
    ? formatTokenAmount(ctx.selectedGasCost.gasCostAmount.toString(), 6, true)
    : '';

  const gasTokenSymbol = chainInfo?.nativeTokenSymbol || '';
  const gasTokenLogo = chainInfo?.nativeTokenLogo || '';

  const showGasContent = !!ctx?.txsCalc?.length && !loading && !noQuote;

  const isReady = (ctx?.txsCalc?.length || 0) > 0;
  const isGasNotEnough = !!ctx?.isGasNotEnough;
  const canUseGasLess = !!ctx?.gasless?.is_gasless;
  const noCustomRPC = !!ctx?.noCustomRPC;

  let gasLessConfig =
    canUseGasLess && ctx?.gasless?.promotion
      ? ctx?.gasless?.promotion?.config
      : undefined;
  if (
    gasLessConfig &&
    ctx?.gasless?.promotion?.id === '0ca5aaa5f0c9217e6f45fe1d109c24fb'
  ) {
    gasLessConfig = { ...gasLessConfig, dark_color: '', theme_color: '' };
  }

  const canGotoUseGasAccount =
    // isSupportedAddr &&
    noCustomRPC &&
    !!ctx?.gasAccount?.balance_is_enough &&
    !ctx?.gasAccount.chain_not_support &&
    !!ctx?.gasAccount.is_gas_account;

  const showGasLess = isReady && (isGasNotEnough || !!gasLessConfig);

  const showGasLessToSign =
    showGasLess && !canGotoUseGasAccount && canUseGasLess;

  // gas 提交使用 gasless
  const useGasLess =
    (isGasNotEnough || !!gasLessConfig) && !!canUseGasLess && !!ctx?.useGasless;

  const payGasByGasAccount = ctx?.gasMethod === 'gasAccount';

  const canDepositUseGasAccount =
    // isSupportedAddr &&
    noCustomRPC &&
    !!ctx?.gasAccount &&
    !ctx?.gasAccount?.balance_is_enough &&
    !ctx?.gasAccount.chain_not_support;

  const gasAccountCanPay =
    ctx?.gasMethod === 'gasAccount' &&
    // isSupportedAddr &&
    noCustomRPC &&
    !!ctx?.gasAccount?.balance_is_enough &&
    !ctx?.gasAccount.chain_not_support &&
    !!ctx?.gasAccount.is_gas_account &&
    !(ctx?.gasAccount as any).err_msg;

  const disabledProcess = payGasByGasAccount
    ? !gasAccountCanPay
    : useGasLess
    ? false
    : !ctx?.txsCalc?.length ||
      !!ctx.checkErrors?.some((e) => e.level === 'forbidden');

  // Gasless 切换
  const handleToggleGasless = (value) => {
    signatureStore.toggleGasless(value);
  };

  // Gas 方法切换 - 添加异步处理
  const handleChangeGasMethod = useCallback(
    async (method: 'native' | 'gasAccount') => {
      try {
        signatureStore.setGasMethod(method);
      } catch (error) {
        console.error('Gas method change error:', error);
      }
    },
    [ctx?.selectedGas]
  );

  useEffect(() => {
    if (loading || noQuote) {
      return;
    }
    const showGasLevelPopup = !!showGasContent && !!disabledProcess;
    const gasTooHigh =
      !!showGasContent &&
      !!gasCostUsdStr &&
      new BigNumber(gasCostUsdStr?.replace(/\$/g, '')).gt(
        chainEnum === CHAINS_ENUM.ETH ? 10 : 1
      );
    if (showGasLevelPopup || gasTooHigh) {
      openShowMore(true);
    } else {
      openShowMore(false);
    }
  }, [
    chainEnum,
    disabledProcess,
    isReady,
    gasCostUsdStr,
    openShowMore,
    showGasContent,
    loading,
    noQuote,
  ]);

  if (!supportDirectSign) {
    return null;
  }
  const gasTipsComponent = () => (
    <GasTipsWrapper>
      {showGasLessToSign ? (
        <GasLessActivityToSign
          directSubmit
          gasLessEnable={useGasLess}
          handleFreeGas={() => {
            handleToggleGasless?.(true);
          }}
          gasLessConfig={gasLessConfig}
        />
      ) : null}

      {showGasLess && !payGasByGasAccount && !canUseGasLess ? (
        <GasLessNotEnough
          directSubmit
          gasLessFailedReason={ctx?.gasless?.desc}
          canGotoUseGasAccount={canGotoUseGasAccount}
          onChangeGasAccount={() => handleChangeGasMethod('gasAccount')}
          canDepositUseGasAccount={canDepositUseGasAccount}
          miniFooter
          onRedirectToDeposit={config?.onRedirectToDeposit}
        />
      ) : null}

      {payGasByGasAccount && !gasAccountCanPay ? (
        <GasAccountTips
          directSubmit
          gasAccountCost={ctx?.gasAccount as any}
          isGasAccountLogin={isGasAccountLogin}
          isWalletConnect={false}
          noCustomRPC={noCustomRPC}
          miniFooter
          onRedirectToDeposit={config?.onRedirectToDeposit}
        />
      ) : null}
    </GasTipsWrapper>
  );

  const estimatedTime = ctx?.selectedGas?.estimated_seconds
    ? calcGasEstimated(ctx.selectedGas.estimated_seconds)
    : '~15 sec';

  return (
    <>
      <div className="mt-12">
        {showGasContent ? (
          <>
            <div className="flex items-center justify-between mb-1">
              {/* Left: Cost + Time */}
              <div className="flex items-center gap-1 text-r-neutral-title-1">
                {gasTokenLogo ? (
                  <img
                    src={gasTokenLogo}
                    alt="token"
                    className="w-[18px] h-[18px] rounded-full object-cover"
                  />
                ) : null}
                {gasTokenAmountDisplay ? (
                  <span className="text-base font-medium text-primary-foreground">
                    {gasTokenAmountDisplay}
                    {gasTokenSymbol ? ` ${gasTokenSymbol}` : ''}
                  </span>
                ) : (
                  <span className="text-base font-medium text-primary-foreground">
                    {gasCostUsdDisplay}
                  </span>
                )}
                <span className="text-secondary-foreground">~</span>
                <span className="text-sm text-secondary-foreground">
                  {estimatedTime}
                </span>
              </div>

              {/* Right: Gas Level Dropdown Pill */}
              <ShowMoreGasSelectModal>
                <button
                  className={clsx(
                    'rounded-full border px-3 py-1 text-sm font-medium',
                    'flex items-center gap-1.5 cursor-pointer',
                    'border-r-neutral-line bg-r-neutral-card-1',
                    disabledProcess
                      ? 'text-r-red-default'
                      : 'text-r-neutral-title-1'
                  )}
                  onClick={() => {
                    setGasModalVisible(true);
                  }}
                >
                  <span>
                    {ctx?.selectedGas?.level
                      ? t(getGasLevelI18nKey(ctx.selectedGas.level))
                      : t(getGasLevelI18nKey('normal'))}
                  </span>
                  <IconArrowDownCC
                    viewBox="0 0 14 14"
                    width={12}
                    height={12}
                    className="opacity-60"
                  />
                  {ctx.gasMethod === 'gasAccount' ? (
                    <Tooltip
                      align={{
                        offset: [10, 0],
                      }}
                      placement={'topRight'}
                      overlayClassName="rectangle w-[max-content]"
                      title={
                        <div onClick={(e) => e.stopPropagation()}>
                          <div>{t('page.signTx.gasAccount.description')}</div>
                          <div>
                            {t('page.signTx.gasAccount.estimatedGas')}{' '}
                            {calcGasAccountUsd(
                              gasAccountCost?.estimate_tx_cost || 0
                            )}
                          </div>
                          <div>
                            {t('page.signTx.gasAccount.maxGas')}{' '}
                            {calcGasAccountUsd(
                              gasAccountCost?.total_cost || '0'
                            )}
                          </div>
                          <div>
                            {t('page.signTx.gasAccount.sendGas')}{' '}
                            {calcGasAccountUsd(
                              gasAccountCost?.total_cost || '0'
                            )}
                          </div>
                          <div>
                            {t('page.signTx.gasAccount.gasCost')}{' '}
                            {calcGasAccountUsd(gasAccountCost?.gas_cost || '0')}
                          </div>
                        </div>
                      }
                    >
                      <IconInfoSVG
                        className="text-r-neutral-foot -top-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Tooltip>
                  ) : null}
                </button>
              </ShowMoreGasSelectModal>
            </div>
            {/* Second row: Estimated fee label */}
            <div className="text-xs text-r-neutral-foot">Estimated fee</div>
          </>
        ) : !loading && noQuote ? (
          <div>-</div>
        ) : (
          <Skeleton
            className="rounded"
            style={{
              width: 52,
              height: 12,
            }}
          />
        )}
      </div>
      {showGasContent && <>{gasTipsComponent()}</>}
    </>
  );
};

function ListItem({
  name,
  className,
  children,
}: PropsWithChildren<{ name: React.ReactNode; className?: string }>) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between py-1.5',
        'text-[14px] text-primary-foreground',
        className
      )}
    >
      <span className="text-primary-foreground">{name}</span>
      <div className="flex items-center text-secondary-foreground text-[14px]">
        {children}
      </div>
    </div>
  );
}

export const BridgeInfoSummary = ({
  sourceName,
  sourceLogo,
  duration,
  type,
  isBestQuote,
  quoteLoading,
  openQuotesList,
  onOpenInfo,
  fromToken,
  toToken,
  amount,
  toAmount,
}: {
  sourceName: string;
  sourceLogo: string;
  duration?: number;
  type: 'swap' | 'bridge';
  isBestQuote: boolean;
  quoteLoading?: boolean;
  openQuotesList: () => void;
  onOpenInfo: () => void;
  fromToken?: TokenItem;
  toToken?: TokenItem;
  amount?: string | number;
  toAmount?: string | number;
}) => {
  const { t } = useTranslation();

  const showMinDuration = useMemo(() => {
    return Math.max(Math.round((duration || 0) / 60), 1);
  }, [duration]);

  const durationColor = useMemo(() => {
    if (showMinDuration > 10) {
      return 'text-r-red-default';
    }
    if (showMinDuration > 3) {
      return 'text-r-orange-default';
    }
    return 'text-r-blue-default';
  }, [showMinDuration]);

  const bestQuoteStyle = useMemo(() => {
    if (isBestQuote) {
      return {
        backgroundImage: `url(${imgBestQuoteSharpBg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '38px',
      };
    }
    return undefined;
  }, [isBestQuote]);

  const exchangeRate = useMemo(() => {
    if (!fromToken || !toToken || !amount || !toAmount || quoteLoading) {
      return null;
    }

    const amountBN = new BigNumber(amount);
    const toAmountBN = new BigNumber(toAmount);

    if (amountBN.lte(0) || toAmountBN.lte(0)) {
      return null;
    }

    const fromSymbol = getTokenSymbol(fromToken);
    const toSymbol = getTokenSymbol(toToken);

    // Convert from smallest units to human-readable format
    const fromDecimals = fromToken.decimals || 18;
    const toDecimals = toToken.decimals || 18;

    const humanReadableFromAmount = amountBN.div(
      new BigNumber(10).pow(fromDecimals)
    );
    const humanReadableToAmount = toAmountBN.div(
      new BigNumber(10).pow(toDecimals)
    );

    // Format the amounts with appropriate precision
    const formattedFromAmount = formatAmount(
      humanReadableFromAmount.toNumber(),
      6
    );
    const formattedToAmount = formatAmount(humanReadableToAmount.toNumber(), 6);

    return `${formattedFromAmount} ${fromSymbol}  ~  ${formattedToAmount} ${toSymbol}`;
  }, [fromToken, toToken, amount, toAmount, quoteLoading]);

  return (
    <div
      className="mx-4 flex items-center gap-1 justify-end cursor-pointer"
      onClick={onOpenInfo}
    >
      <div>{exchangeRate || ''}</div>
      <Info size={16} />
    </div>
  );
};

export const BridgeInlineWarnings = ({
  fromToken,
  toToken,
  amount,
  toAmount,
  quoteLoading,
  slippageError,
  supportDirectSign,
  chainServeId,
}: {
  fromToken?: TokenItem;
  toToken?: TokenItem;
  amount?: string | number;
  toAmount?: string | number;
  quoteLoading?: boolean;
  slippageError?: boolean;
  supportDirectSign?: boolean;
  chainServeId?: string;
}) => {
  const { t } = useTranslation();

  const data = useMemo(() => {
    if (quoteLoading) {
      return {
        showLoss: false,
        diff: '',
        fromUsd: '',
        toUsd: '',
        lossUsd: '',
      };
    }
    return tokenPriceImpact(fromToken, toToken, amount, toAmount);
  }, [fromToken, toToken, amount, toAmount, quoteLoading]);

  if (!data?.showLoss && !slippageError) {
    return null;
  }

  return (
    <div className="mx-4 mt-4 space-y-3">
      {data?.showLoss && !quoteLoading && (
        <div className="leading-4 text-12 text-r-neutral-foot">
          <div className="flex justify-between">
            <span>{t('page.bridge.price-impact')}</span>
            <span
              className={clsx(
                'font-medium inline-flex items-center',
                'text-r-red-default'
              )}
            >
              -{data.diff}%
              <TooltipView
                content={
                  <div className="flex flex-col gap-4 py-[5px] text-13">
                    <div>
                      {t('page.bridge.est-payment')} {amount}
                      {getTokenSymbol(fromToken)} ≈ {data.fromUsd}
                    </div>
                    <div>
                      {t('page.bridge.est-receiving')} {toAmount}
                      {getTokenSymbol(toToken)} ≈ {data.toUsd}
                    </div>
                    <div>
                      {t('page.bridge.est-difference')} {data.lossUsd}
                    </div>
                  </div>
                }
              >
                <RcIconInfo className="ml-4 text-rabby-neutral-foot w-[14px] h-[14px]" />
              </TooltipView>
            </span>
          </div>
          <div className="mt-[8px] rounded-[4px] border-[0.5px] border-rabby-red-default bg-r-red-light p-8 text-13 font-normal text-r-red-default">
            {t('page.bridge.loss-tips', {
              usd: data?.lossUsd,
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const RecommendFromToken = ({
  token,
  className,
  onOk,
}: {
  token: TokenItem;
  className?: string;
  onOk: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={clsx(
        'flex items-center',
        'h-[44px] pl-12 pr-10 rounded-[8px]',
        'bg-r-neutral-card-1',
        className
      )}
    >
      <div
        className={clsx(
          'flex-1 flex items-center',
          'text-12 text-rabby-neutral-title-1'
        )}
      >
        <Trans t={t} i18nKey={'page.bridge.recommendFromToken'}>
          Bridge from
          <div
            className={clsx(
              'flex items-center gap-6',
              'px-8 py-6 mx-6',
              'text-primary-foreground ',
              'bg-rabby-blue-light1 rounded-[6px]'
            )}
          >
            <TokenWithChain
              token={token}
              width="16px"
              height="16px"
              chainSize={'10px'}
            />
            <span>{getTokenSymbol(token)}</span>
          </div>
          for an available quote
        </Trans>
      </div>
      <Button className="h-24 text-13 font-medium px-10 py-0" onClick={onOk}>
        {t('global.ok')}
      </Button>
    </div>
  );
};
