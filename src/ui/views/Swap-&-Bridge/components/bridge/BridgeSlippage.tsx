import clsx from 'clsx';
import {
  memo,
  useMemo,
  useCallback,
  ChangeEventHandler,
  useState,
  useEffect,
} from 'react';
import BigNumber from 'bignumber.js';
import React from 'react';
import { Pencil } from 'lucide-react';

import i18n from '@/i18n';
import { Trans, useTranslation } from 'react-i18next';
import { Input } from '@repo/ui/primitives';

const BRIDGE_SLIPPAGE = ['0.5', '1'];

export const SWAP_SLIPPAGE = ['0.5', '3'];

const BRIDGE_MAX_SLIPPAGE = 10;

const SWAP_MAX_SLIPPAGE = 50;

interface BridgeSlippageProps {
  value: string;
  displaySlippage: string;
  onChange: (n: string) => void;
  recommendValue?: number;
  autoSlippage: boolean;
  isCustomSlippage: boolean;
  setAutoSlippage: (boolean: boolean) => void;
  setIsCustomSlippage: (boolean: boolean) => void;
  type: 'swap' | 'bridge';
  isWrapToken?: boolean;
  autoSuggestSlippage?: string;
}
export const BridgeSlippage = memo((props: BridgeSlippageProps) => {
  const { t } = useTranslation();

  const {
    value,
    displaySlippage,
    onChange,
    recommendValue,
    autoSlippage,
    isCustomSlippage,
    setAutoSlippage,
    setIsCustomSlippage,
    type,
    isWrapToken,
    autoSuggestSlippage,
  } = props;

  const [slippageOpen, setSlippageOpen] = useState(false);

  const [minimumSlippage, maximumSlippage] = useMemo(() => {
    if (type === 'swap') {
      return [0.1, 10];
    }
    return [0.2, 3];
  }, [type]);

  const SLIPPAGE = useMemo(() => {
    if (type === 'swap') {
      return SWAP_SLIPPAGE;
    }
    return BRIDGE_SLIPPAGE;
  }, [type]);

  const MAX_SLIPPAGE = useMemo(() => {
    if (type === 'swap') {
      return SWAP_MAX_SLIPPAGE;
    }
    return BRIDGE_MAX_SLIPPAGE;
  }, [type]);

  const [isLow, isHigh] = useMemo(() => {
    return [
      value?.trim() !== '' && Number(value || 0) < minimumSlippage,
      value?.trim() !== '' && Number(value || 0) > maximumSlippage,
    ];
  }, [value, minimumSlippage]);

  const setRecommendValue = useCallback(() => {
    onChange(new BigNumber(recommendValue || 0).times(100).toString());
    setAutoSlippage(false);
    setIsCustomSlippage(false);
  }, [onChange, recommendValue, setAutoSlippage, setIsCustomSlippage]);

  const tips = useMemo(() => {
    if (isLow) {
      return i18n.t(
        'page.swap.low-slippage-may-cause-failed-transactions-due-to-high-volatility'
      );
    }
    if (isHigh) {
      return i18n.t(
        'page.swap.transaction-might-be-frontrun-because-of-high-slippage-tolerance'
      );
    }
    if (recommendValue) {
      return (
        <span>
          <Trans
            i18nKey="page.swap.recommend-slippage"
            value={{
              slippage: new BigNumber(recommendValue || 0)
                .times(100)
                .toString(),
            }}
            t={t}
          >
            To prevent front-running, we recommend a slippage of{' '}
            <span
              onClick={setRecommendValue}
              className="underline cursor-pointer"
            >
              {new BigNumber(recommendValue || 0).times(100).toString()}
            </span>
            %{' '}
          </Trans>
        </span>
      );
    }
    return null;
  }, [isHigh, isLow, recommendValue, setRecommendValue]);

  const onInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setAutoSlippage(false);
      setIsCustomSlippage(true);
      const v = e.target.value;
      if (/^\d*(\.\d*)?$/.test(v)) {
        onChange(Number(v) > MAX_SLIPPAGE ? `${MAX_SLIPPAGE}` : v);
      }
    },
    [onChange, setAutoSlippage, setIsCustomSlippage]
  );

  useEffect(() => {
    if (
      !autoSlippage &&
      !isCustomSlippage &&
      SLIPPAGE.findIndex((item) => item === value) === -1
    ) {
      setIsCustomSlippage(true);
    }
  }, [SLIPPAGE, autoSlippage, isCustomSlippage, setIsCustomSlippage, value]);

  useEffect(() => {
    if (tips) {
      setSlippageOpen(true);
    }
  }, [tips]);

  if (type === 'swap' && isWrapToken) {
    return (
      <div
        className="flex justify-between cursor-pointer text-12"
        onClick={() => {
          setSlippageOpen((e) => !e);
        }}
      >
        <span className="font-normal text-r-neutral-foot">
          {t('page.swap.slippage-tolerance')}
        </span>
        <span className="font-medium text-r-neutral-foot">
          {t('page.swap.no-slippage-for-wrap')}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex justify-between cursor-pointer text-[12px] mb-3"
        onClick={() => {
          setSlippageOpen((e) => !e);
        }}
      >
        <span className="font-normal text-primary-foreground">
          {t('page.swap.slippage-tolerance')}
        </span>
        <span className="font-normal text-primary-foreground inline-flex items-center gap-1.5">
          <span
            className={clsx(
              tips ? 'text-r-red-default' : 'text-secondary-foreground'
            )}
          >
            {type === 'swap' && autoSlippage
              ? autoSuggestSlippage || displaySlippage
              : displaySlippage}
            %
          </span>
          <Pencil size={16} className="text-r-neutral-body" />
        </span>
      </div>
      <div className="widget-has-ant-input">
        <div
          className={clsx(
            'flex items-center gap-2',
            slippageOpen ? '' : 'h-0 overflow-hidden'
          )}
        >
          <div
            onClick={(event) => {
              if (autoSlippage) {
                return;
              }
              event.stopPropagation();
              onChange(value);
              setAutoSlippage(true);
              setIsCustomSlippage(false);
            }}
            className={clsx(
              'relative flex justify-center items-center',
              'border',
              'cursor-pointer',
              'min-w-[50px] h-[36px]',
              'font-medium text-xs',
              'overflow-hidden',
              'rounded-[8px]',
              'hover:border-primary text-secondary-foreground',
              autoSlippage
                ? 'border-[#8ACE00] bg-[#FDFDFD] '
                : 'border-[#C9CBCE] bg-[#FDFDFD] '
            )}
          >
            {t('page.swap.Auto')}
          </div>
          {SLIPPAGE.map((e) => (
            <div
              key={e}
              onClick={(event) => {
                event.stopPropagation();
                setIsCustomSlippage(false);
                setAutoSlippage(false);
                onChange(e);
              }}
              className={clsx(
                'relative flex justify-center items-center',
                'border',
                'cursor-pointer',
                'min-w-[50px] h-[36px]',
                'font-medium text-xs',
                'overflow-hidden',
                'rounded-[8px]',
                'hover:border-primary text-secondary-foreground',
                !autoSlippage && !isCustomSlippage && e === value
                  ? 'border-[#8ACE00] bg-[#FDFDFD] '
                  : 'border-[#C9CBCE] bg-[#FDFDFD] '
              )}
            >
              {e}%
            </div>
          ))}
          <div
            onClick={(event) => {
              event.stopPropagation();
              setAutoSlippage(false);
              setIsCustomSlippage(true);
            }}
            className={clsx(
              'relative flex flex-col justify-center items-center',
              'border',
              'cursor-pointer',
              'min-w-[50px] h-[36px]',
              'font-medium text-xs',
              'overflow-hidden',
              'flex-1',
              'gap-10',
              'rounded-[8px]',
              'hover:border-primary text-secondary-foreground',
              isCustomSlippage && !tips
                ? 'border-[#8ACE00] bg-[#FDFDFD] '
                : 'border-[#C9CBCE] bg-[#FDFDFD] ',
              tips && 'border-r-red-default bg-r-red-light'
            )}
          >
            {isCustomSlippage ? (
              <Input
                className={clsx(
                  'bg-transparent border-none rounded font-medium text-xs text-center',
                  tips && 'text-r-red-default'
                )}
                value={value}
                onChange={onInputChange}
                onFocus={() => {
                  setAutoSlippage(false);
                  setIsCustomSlippage(true);
                }}
                placeholder="Enter"
                iconRight={
                  <div
                    className={clsx('text-12', tips && 'text-r-red-default')}
                  >
                    %
                  </div>
                }
                autoFocus
              />
            ) : (
              <span className="text-r-neutral-body">Enter</span>
            )}
          </div>
        </div>

        {!!tips && (
          <div className="p-8 rounded-[4px] border-[0.5px] border-r-red-default bg-r-red-light text-r-red-default text-13 font-normal mt-8">
            {tips}
          </div>
        )}
      </div>
    </div>
  );
});
