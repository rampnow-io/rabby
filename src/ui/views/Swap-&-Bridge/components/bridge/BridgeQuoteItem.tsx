import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QuoteLogo } from './QuoteLogo';
import ImgLock from '@/ui/assets/swap/lock.svg';
import { TokenWithChain } from '@/ui/component';
import ImgGas from '@/ui/assets/swap/gas.svg';
import { ReactComponent as RCIconDuration } from '@/ui/assets/bridge/duration.svg';
import { ReactComponent as RCIconDurationCC } from '@/ui/assets/bridge/durationCC.svg';
import clsx from 'clsx';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { TokenItem } from '@/background/service/openapi';
import { formatTokenAmount, formatUsdValue } from '@/ui/utils';
import BigNumber from 'bignumber.js';

import { Tooltip } from 'antd';
import { useRabbySelector } from '@/ui/store';
import styled from 'styled-components';
import { UnifiedQuote, useSetQuoteVisible } from '../../hooks';

const ItemWrapper = styled.div`
  position: relative;
`;

interface QuoteItemProps {
  quote: UnifiedQuote;
  payAmount: string;
  payToken: TokenItem;
  receiveToken: TokenItem;
  isBestQuote?: boolean;
  bestQuoteUsd: string;
  sortIncludeGasFee: boolean;
  setSelectedBridgeQuote?: (quote: UnifiedQuote) => void;
  onlyShow?: boolean;
  loading?: boolean;
  inSufficient?: boolean;
}

export const bridgeQuoteEstimatedValueBn = (
  quote: UnifiedQuote,
  receiveToken: TokenItem,
  sortIncludeGasFee: boolean
) => {
  const gasFee =
    quote.type === 'bridge'
      ? quote.gas_fee.usd_value
      : (quote.type === 'swap' && quote.dexQuote.preExecResult?.gasUsdValue) ||
        0;

  return new BigNumber(quote.to_token_amount)
    .times(receiveToken.price || 1)
    .minus(sortIncludeGasFee ? gasFee : 0);
};

export const BridgeQuoteItem = (props: QuoteItemProps) => {
  const { t } = useTranslation();
  const { quote } = props;

  const openSwapQuote = useSetQuoteVisible();

  const aggregatorsList = useRabbySelector(
    (s) => s.bridge.aggregatorsList || []
  );
  const selectedAggregators = useRabbySelector(
    (s) => s.bridge.selectedAggregators || []
  );

  const showMinDuration = useMemo(() => {
    if (quote.type === 'bridge') {
      return Math.max(Math.round(quote.duration / 60), 1);
    }
    return 0; // Swaps are instant
  }, [quote]);

  const durationColor = useMemo(() => {
    if (showMinDuration > 10) {
      return 'text-r-red-default';
    }

    if (showMinDuration > 3) {
      return 'text-r-orange-default';
    }
    return 'text-r-neutral-foot';
  }, [showMinDuration]);

  const diffPercent = React.useMemo(() => {
    if (props.onlyShow || props.isBestQuote) {
      return '';
    }

    const percent = bridgeQuoteEstimatedValueBn(
      quote,
      props.receiveToken,
      props.sortIncludeGasFee
    )
      .minus(props.bestQuoteUsd)
      .div(props.bestQuoteUsd)
      .abs()
      .times(100)
      .toFixed(2, 1)
      .toString();
    return `-${percent}%`;
  }, [
    quote,
    props.onlyShow,
    props.isBestQuote,
    props.receiveToken,
    props.sortIncludeGasFee,
    props.bestQuoteUsd,
  ]);

  const handleClick = async () => {
    if (props.inSufficient) {
      return;
    }

    props?.setSelectedBridgeQuote?.({ ...quote, manualClick: true });
    openSwapQuote(false);
  };
  return (
    <Tooltip
      overlayClassName="rectangle w-[max-content]"
      placement="top"
      title={'Insufficient balance'}
      visible={props.inSufficient && !props.onlyShow ? undefined : false}
      align={{ offset: [0, 30] }}
      arrowPointAtCenter
    >
      <ItemWrapper
        className={clsx(
          ' flex flex-col gap-12  justify-center rounded-md',
          !props.inSufficient && 'enabledAggregator',
          props.onlyShow
            ? 'bg-transparent h-auto'
            : props.inSufficient
            ? 'h-[88px] p-16 pt-[20px] bg-transparent border-[1px] border-solid border-rabby-neutral-line'
            : clsx(
                'h-[88px] p-16 pt-[20px] cursor-pointer',
                'bg-r-neutral-card1 border-[1px] border-solid border-transparent hover:bg-rabby-blue-light1',
                ' hover:after:absolute hover:after:rounded-md hover:after:inset-[-1px] hover:after:border hover:after:border-rabby-blue-default hover:after:pointer-events-none'
              )
        )}
        style={
          props.onlyShow || props.inSufficient
            ? {}
            : {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
              }
        }
        onClick={handleClick}
      >
        <div className="flex items-center justify-between relative">
          <div className="flex gap-6  items-center  overflow-hidden pr-16">
            <QuoteLogo
              logo={
                quote.type === 'bridge'
                  ? quote.aggregator.logo_url
                  : quote.aggregator.logo
              }
              bridgeLogo={
                quote.type === 'bridge' ? quote.bridge.logo_url : undefined
              }
              isLoading={props.onlyShow ? false : quote.loading}
            />
            <span className="text-[16px] font-medium text-r-neutral-title1">
              {quote.type === 'bridge'
                ? quote.aggregator.name
                : quote.dexQuote.name}
            </span>
            {quote.type === 'bridge' && (
              <TooltipWithMagnetArrow
                title={t('page.bridge.via-bridge', {
                  bridge: quote.bridge.name,
                })}
                className="rectangle w-[max-content]"
                arrowPointAtCenter
                visible={props.onlyShow ? undefined : false}
              >
                <span
                  className={clsx(
                    'text-13 text-r-neutral-foot',
                    'overflow-hidden overflow-ellipsis whitespace-nowrap'
                  )}
                >
                  {t('page.bridge.via-bridge', {
                    bridge: quote.bridge.name,
                  })}
                </span>
              </TooltipWithMagnetArrow>
            )}
            {/* {quote.shouldApproveToken &&  */}
            {quote.shouldApproveToken && (
              <TooltipWithMagnetArrow
                overlayClassName="rectangle w-[max-content]"
                title={t('page.bridge.need-to-approve-token-before-bridge')}
                arrowPointAtCenter
                placement="top"
              >
                <img src={ImgLock} className="w-16 h16" />
              </TooltipWithMagnetArrow>
            )}
          </div>

          <div className="flex items-center gap-8 flex-1 justify-end">
            <TokenWithChain
              token={props.receiveToken}
              width="20px"
              height="20px"
              hideChainIcon
              hideConer
            />
            <span
              className={clsx(
                'text-[16px] font-medium text-rabby-neutral-title1 overflow-hidden overflow-ellipsis whitespace-nowrap',
                props.onlyShow ? 'max-w-[126px]' : 'max-w-[138px]'
              )}
              title={formatTokenAmount(quote.to_token_amount)}
            >
              {formatTokenAmount(quote.to_token_amount)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex  items-center text-13 text-r-neutral-foot">
            <img src={ImgGas} className="w-16 h16 mr-4" />
            <span>
              {formatUsdValue(
                quote.type === 'bridge'
                  ? quote.gas_fee.usd_value
                  : quote.dexQuote.preExecResult?.gasUsdValue || 0
              )}
            </span>
            {quote.type === 'bridge' && (
              <>
                <RCIconDurationCC
                  viewBox="0 0 16 16"
                  className={`w-16 h16 ml-8 mr-4 ${durationColor}`}
                />
                <span className={durationColor}>
                  {t('page.bridge.duration', {
                    duration: showMinDuration,
                  })}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-13 text-r-neutral-foot">
            <span>
              {t('page.bridge.estimated-value', {
                value: formatUsdValue(
                  new BigNumber(quote.to_token_amount)
                    .times(props.receiveToken.price)
                    .toString()
                ),
              })}
            </span>
          </div>
        </div>

        {!props.onlyShow && (
          <div
            className={clsx(
              'absolute top-[-1px] left-[-1px]',
              'rounded-tl-[4px] rounded-br-[4px] px-[6px] py-[1px]',
              'text-12 font-medium',
              props.isBestQuote
                ? 'text-r-blue-default bg-light-r-blue-light2'
                : 'text-r-red-default bg-r-red-light'
            )}
          >
            {props.isBestQuote ? t('page.bridge.best') : diffPercent}
          </div>
        )}
      </ItemWrapper>
    </Tooltip>
  );
};
