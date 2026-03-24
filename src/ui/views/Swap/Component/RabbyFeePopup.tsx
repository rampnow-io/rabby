import React, { useMemo } from 'react';
import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { useTranslation } from 'react-i18next';
import ImgMetaMask from '@/ui/assets/swap/metamask.png';
import ImgPhantom from '@/ui/assets/swap/phantom.png';
import RampIconOne from '@/ui/assets/ramp-icon-one.png';
import clsx from 'clsx';
import { DEX } from '@/constant';
import { Button } from '@repo/ui/primitives';

const swapFee = [
  {
    name: 'MetaMask',
    logo: ImgMetaMask,
    rate: '0.875%',
  },
  {
    name: 'Phantom',
    logo: ImgPhantom,
    rate: '0.85%',
  },
  {
    name: 'Rampnow Wallet',
    logo: RampIconOne,
    rate: '0.25%',
  },
];

const bridgeList = [
  {
    name: 'MetaMask',
    logo: ImgMetaMask,
    rate: '0.875%',
  },
  {
    name: 'Rampnow Wallet',
    logo: RampIconOne,
    rate: '0.25%',
  },
];

const fee = {
  swap: swapFee,
  bridge: bridgeList,
};

export const RabbyFeePopup = ({
  visible,
  onClose,
  type = 'swap',
  feeDexDesc,
  dexName,
}: {
  visible: boolean;
  onClose: () => void;
  type?: keyof typeof fee;
  dexName?: string;
  feeDexDesc?: string;
}) => {
  const { t } = useTranslation();

  const hasSwapDexFee = useMemo(() => {
    return type === 'swap' && dexName && feeDexDesc && DEX?.[dexName]?.logo;
  }, [type, dexName, feeDexDesc]);

  return (
    <BottomFloatingSheet open={visible} onClose={onClose}>
      <div className="px-16 pb-16">
        <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-r-blue-default mx-auto">
          <img src={RampIconOne} className="w-[36px] h-[36px] rounded-full" />
        </div>

        <div className="text-20 text-center font-medium text-r-neutral-title1 my-12 leading-normal">
          {t('page.swap.rabbyFee.title')}
        </div>

        <div className="text-14 text-center text-rabby-neutral-body leading-[150%] mb-20">
          {type === 'swap'
            ? t('page.swap.rabbyFee.swapDesc')
            : t('page.swap.rabbyFee.bridgeDesc')}
        </div>

        <div
          className={clsx(
            'flex justify-between items-center',
            'px-16 mb-6',
            'text-12 text-r-neutral-foot'
          )}
        >
          <span>{t('page.swap.rabbyFee.wallet')}</span>
          <span>{t('page.swap.rabbyFee.rate')}</span>
        </div>
        <div className="border-[1px] border-rabby-neutral-line rounded-[6px] mb-16">
          {fee[type].map((item, idx, list) => (
            <div
              key={item.name}
              className={clsx(
                'flex justify-between items-center',
                'px-16 h-[44px]',
                'border-b-[1px] border-solid border-rabby-neutral-line',
                idx === list.length - 1 ? 'border-b-0' : ''
              )}
            >
              <div className="flex items-center">
                <img src={item.logo} className="w-[18px] h-[18px] mr-8" />
                <span className="text-13 leading-normal font-medium text-rabby-neutral-title1">
                  {item.name}
                </span>
              </div>
              <span className="text-13 leading-normal font-medium text-rabby-neutral-title1">
                {item.rate}
              </span>
            </div>
          ))}
        </div>

        <SwapAggregatorFee dexName={dexName} feeDexDesc={feeDexDesc} />

        <Button
          className="w-full h-[48px] text-16 font-medium text-r-neutral-title2"
          onClick={onClose}
        >
          {t('page.swap.rabbyFee.button')}
        </Button>
      </div>
    </BottomFloatingSheet>
  );
};

function SwapAggregatorFee({
  dexName,
  feeDexDesc,
}: {
  dexName?: string;
  feeDexDesc?: string;
}) {
  if (dexName && feeDexDesc && DEX?.[dexName]?.logo) {
    return (
      <div className="flex justify-center items-center mt-16 gap-[3px] text-12 text-r-neutral-foot">
        <img
          src={DEX[dexName].logo}
          className="w-[14px] h-[14px] rounded-full"
        />
        <span>{feeDexDesc}</span>
      </div>
    );
  }
  return null;
}
