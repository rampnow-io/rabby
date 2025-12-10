import {
  Chain,
  formatCurrency,
  getChainIcon,
  getChainName,
  getCurrencyIcon,
  getCurrencyName,
} from '@repo/utils';
import React from 'react';
import { Image } from '../../primitives';
import { CellText } from '../data-table/data-table-cell';

export enum DisplayVariant {
  DEFAULT = 'default',
  INLINE = 'inline',
}

export interface DisplayAmountProps {
  currency?: string;
  chain?: string;
  amount?: string;
  variant?: DisplayVariant;
  className?: string;
}

export const getChainSubtext = (chain?: string, currency?: string) => {
  const subText =
    chain !== Chain.FIAT ? getChainName(chain) : getCurrencyName(currency);

  return (
    <>
      {![Chain.FIAT, Chain.EXCHANGE].includes(chain as Chain) && (
        <>
          <span>on</span>
          <Image
            src={getChainIcon(chain)}
            alt={`${chain} icon`}
            width={12}
            height={12}
          />
        </>
      )}
      <span className="text-nowrap overflow-hidden">{subText}</span>
    </>
  );
};

export const DisplayAmount: React.FC<DisplayAmountProps> = ({
  currency,
  chain,
  amount,
  variant = DisplayVariant.DEFAULT,
}) => {
  const icon = getCurrencyIcon(currency);

  if (variant === DisplayVariant.INLINE) {
    return (
      <div className="flex items-center space-x-2">
        {icon ? <Image src={icon} alt={icon} width={18} height={18} /> : null}
        <span className="text-weight-500 text-sm">
          {formatCurrency(amount, currency)}
        </span>
      </div>
    );
  }

  return (
    <CellText
      text={formatCurrency(amount, currency)}
      subtext={getChainSubtext(chain, currency)}
      icon={
        <Image
          src={icon}
          alt={icon}
          width={30}
          height={30}
          className="rounded-full"
        />
      }
    />
  );
};
