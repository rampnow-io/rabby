import React, { useMemo } from 'react';
import { CHAINS } from 'consts';
import { getTokenSymbol } from 'ui/utils/token';
import { TokenItem } from 'background/service/openapi';
import IconUnknown from 'ui/assets/token-default.svg';
import clsx from 'clsx';
import { TooltipWithMagnetArrow } from '../Tooltip/TooltipWithMagnetArrow';
import { findChain } from '@/utils/chain';

const TokenWithChain = ({
  token,
  hideConer,
  width = '28px',
  height = '28px',
  chainSize = 14,
  noRound = false,
  hideChainIcon = false,
  isShowChainTooltip = false,
  className,
  chainClassName,
}: {
  token: TokenItem;
  width?: string;
  height?: string;
  hideConer?: boolean;
  noRound?: boolean;
  hideChainIcon?: boolean;
  isShowChainTooltip?: boolean;
  className?: string;
  chainSize?: string | number;
  chainClassName?: string;
}) => {
  const chainServerId = token.chain;
  const chain = findChain({
    serverId: chainServerId,
  });

  const chainStyle = useMemo(
    () => ({
      width: chainSize,
      height: chainSize,
    }),
    [chainSize]
  );
  return (
    <div
      className={clsx(
        'relative inline-flex',
        !noRound && 'rounded-full',
        className
      )}
      style={{ width, height }}
    >
      <img
        className={clsx(
          'w-full h-full object-cover',
          !noRound && 'rounded-full'
        )}
        src={token.logo_url || IconUnknown}
        alt={getTokenSymbol(token)}
        style={{ width, height, minWidth: width }}
      />
      {!hideChainIcon &&
        (!hideConer || chain?.id) &&
        (isShowChainTooltip ? (
          <TooltipWithMagnetArrow
            title={chain?.name}
            className={clsx(
              'absolute -bottom-[2px] -right-[2px] rounded-full border-2 border-r-neutral-card-1',
              chainClassName
            )}
          >
            <img
              className="rounded-full"
              style={chainStyle}
              src={chain?.logo || IconUnknown}
            />
          </TooltipWithMagnetArrow>
        ) : (
          <img
            className={clsx(
              'absolute -bottom-[2px] -right-[2px] rounded-full border-2 border-r-neutral-card-1',
              chainClassName
            )}
            style={chainStyle}
            src={chain?.logo || IconUnknown}
          />
        ))}
    </div>
  );
};

export const IconWithChain = ({
  chainServerId,
  iconUrl,
  hideConer,
  width = '28px',
  height = '28px',
  noRound = false,
  hideChainIcon = false,
  chainSize,
  isShowChainTooltip = false,
  chainClassName,
}: {
  iconUrl?: string;
  chainServerId: string;
  width?: string;
  height?: string;
  hideConer?: boolean;
  noRound?: boolean;
  hideChainIcon?: boolean;
  isShowChainTooltip?: boolean;
  chainSize?: string;
  chainClassName?: string;
}) => {
  const chain = findChain({
    serverId: chainServerId,
  });
  const chainStyle = useMemo(
    () =>
      chainSize
        ? {
            width: chainSize,
            height: chainSize,
          }
        : {},
    [chainSize]
  );
  return (
    <div
      className={clsx('token-with-chain', noRound && 'no-round')}
      style={{ width, height }}
    >
      <img
        className={clsx('token-symbol', noRound && 'no-round')}
        src={iconUrl || IconUnknown}
        alt={''}
        style={{ width, height, minWidth: width }}
      />
      {!hideChainIcon &&
        (!hideConer || chain?.id) &&
        (isShowChainTooltip ? (
          <TooltipWithMagnetArrow
            title={chain?.name}
            className="rectangle w-[max-content]"
          >
            <img
              className={clsx('chain-symbol', chainClassName)}
              src={chain?.logo || IconUnknown}
              style={chainStyle}
            />
          </TooltipWithMagnetArrow>
        ) : (
          <img
            className={clsx('chain-symbol', chainClassName)}
            src={chain?.logo || IconUnknown}
            style={chainStyle}
          />
        ))}
    </div>
  );
};

export default TokenWithChain;
