import React from 'react';
import { TCell, TRow } from './components/Table';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';
import clsx from 'clsx';
import IconUnknown from '@/ui/assets/token-default.svg';
import { Image } from 'antd';
import { isNil } from 'lodash';
import { findChain } from '@/utils/chain';
import { TooltipView } from '@repo/ui/primitives';

export interface Props {
  item: AbstractPortfolioToken;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const TokenItemAsset: React.FC<Props> = ({ item }) => {
  const chain = findChain({
    serverId: item.chain,
  });

  return (
    <TCell className="py-8 flex gap-3 items-center">
      <div className="relative w-8 h-8">
        <img
          src={item.logo_url || IconUnknown}
          alt={item.symbol}
          className="w-8 h-8 rounded-full"
        />

        <TooltipView content={chain?.name}>
          <img
            src={chain?.logo || IconUnknown}
            alt={item.chain}
            className="absolute w-[14px] h-[14px] right-[-4px] bottom-[-4px] rounded-full border-2 border-white bg-white"
          />
        </TooltipView>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <span className="text-primary-foreground text-base font-medium leading-[15px] truncate">
          {chain?.name}
        </span>
        <span className="text-secondary-foreground text-12 leading-[14px] whitespace-nowrap overflow-ellipsis overflow-hidden">
          {item._amountStr ?? '0'} {item.symbol}
        </span>
      </div>
    </TCell>
  );
};

// const TokenItemPrice: React.FC<Props> = ({ item }) => {
//   return (
//     <TCell
//       className={clsx(
//         'py-8 text-r-neutral-title1 text-13 w-[90px]',
//         'flex flex-col gap-2'
//       )}
//     >
//       <div>${item._priceStr}</div>
//       {isNil(item.price_24h_change) ? null : (
//         <div
//           className={clsx('font-normal text-12', {
//             'text-green': item.price_24h_change > 0,
//             'text-red-forbidden': item.price_24h_change < 0,
//           })}
//         >
//           {item.price_24h_change > 0 ? '+' : ''}
//           {(item.price_24h_change * 100).toFixed(2)}%
//         </div>
//       )}
//     </TCell>
//   );
// };

const TokenItemUSDValue: React.FC<Props> = ({ item }) => {
  return (
    <TCell
      className={clsx(
        'py-8 text-r-neutral-title1 text-13 w-[90px]',
        'flex flex-col items-end gap-2'
      )}
    >
      <div>{item._usdValueStr || '$0.00'}</div>
      {isNil(item.price_24h_change) || item.price_24h_change === null ? null : (
        <div
          className={clsx('font-normal text-12', {
            'text-green': item.price_24h_change > 0,
            'text-red-forbidden': item.price_24h_change < 0,
            'text-r-neutral-title1': item.price_24h_change === 0,
          })}
        >
          {item.price_24h_change > 0 ? '+' : ''}
          {(item.price_24h_change * 100).toFixed(2)}%
        </div>
      )}
    </TCell>
  );
};

export const TokenItem: React.FC<Props> = ({ item, style, onClick }) => {
  return (
    <TRow
      onClick={onClick}
      className={clsx(
        'cursor-pointer flex items-center justify-between px-4',
        'rounded-[16px] border border-transparent bg-[#FAFAFA] hover:bg-[#F4F4F4] h-[60px] '
      )}
    >
      <TokenItemAsset item={item} />
      <TokenItemUSDValue item={item} />
    </TRow>
  );
};
