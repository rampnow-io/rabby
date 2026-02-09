import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Button,
  ButtonSize,
  Input,
  InputSize,
  Separator,
} from '@repo/ui/primitives';
import { Spin } from '@/ui/component';
import { useRabbySelector } from '@/ui/store';
import { useTokens } from '@/ui/utils/portfolio/token';
import useSearchToken from '@/ui/hooks/useSearchToken';
import useSortToken from '@/ui/hooks/useSortTokens';
import { abstractTokenToTokenItem, getTokenSymbol } from '@/ui/utils/token';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import uniqBy from 'lodash/uniqBy';
import { useWallet } from '@/ui/utils';
import { useTranslation } from 'react-i18next';
import NoTokenIcon1 from '@/ui/assets/no-tokens-icon-1.svg';

export type { TokenItem };

interface TokenSelectionProps {
  onSelect: (token: TokenItem) => void;
  selectedToken: TokenItem | null;
  loading?: boolean;
  tokens?: TokenItem[];
  chainId?: string;
  excludeTokens?: TokenItem['id'][];
  disableItemCheck?: (
    token: TokenItem
  ) => {
    disable: boolean;
    cexId?: string;
    reason: string;
    shortReason: string;
  };
  recipientAddress?: string;
}

const TokenSelection: React.FC<TokenSelectionProps> = ({
  onSelect,
  selectedToken,
  loading: externalLoading = false,
  tokens: externalTokens,
  chainId,
  excludeTokens = [],
  disableItemCheck,
  recipientAddress = '',
}) => {
  const { t } = useTranslation();
  const currentAccount = useRabbySelector(
    (state) => state.account.currentAccount
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [updateNonce, setUpdateNonce] = useState(0);

  // Format address - shows first 8 and last 4 chars with ellipsis
  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };

  // Use external tokens if provided, otherwise fetch from wallet
  const shouldLoadTokens = useMemo(
    () => !externalTokens || externalTokens.length === 0,
    [externalTokens]
  );

  const { tokens: allTokens, isLoading: isLoadingAllTokens } = useTokens(
    currentAccount?.address,
    undefined,
    shouldLoadTokens,
    updateNonce,
    chainId
  );

  const allDisplayTokens = useMemo(() => {
    if (externalTokens && externalTokens.length > 0) {
      return externalTokens as (TokenItem | AbstractPortfolioToken)[];
    }
    const abstractTokens = (allTokens as unknown) as AbstractPortfolioToken[];
    // Convert AbstractPortfolioToken to TokenItem to fix concatenated ID issue
    // Maps _tokenId (actual address) to id field
    return abstractTokens.map(abstractTokenToTokenItem);
  }, [allTokens, externalTokens]);

  const { list: searchedTokenByQuery } = useSearchToken(
    currentAccount?.address,
    searchQuery,
    chainId,
    true
  );

  const searchedDisplayTokens = useMemo(() => {
    // Convert searched tokens from AbstractPortfolioToken to TokenItem
    // This ensures token.id contains the actual contract address from _tokenId
    // instead of the concatenated id+chain value
    return searchedTokenByQuery.map(abstractTokenToTokenItem);
  }, [searchedTokenByQuery]);

  const availableTokens = useMemo(() => {
    const filtered = (searchQuery
      ? searchedDisplayTokens
      : allDisplayTokens
    ).filter((e) => !excludeTokens.includes(e.id));
    return uniqBy(filtered, (t) => `${t.chain}-${t.id}`);
  }, [searchQuery, searchedDisplayTokens, allDisplayTokens, excludeTokens]);

  const displayTokenList = useSortToken(
    availableTokens as (TokenItem | AbstractPortfolioToken)[]
  );

  const isLoading = externalLoading || isLoadingAllTokens;

  // Check if all tokens have 0 or undefined liquidity
  const allTokensHaveZeroLiquidity = useMemo(() => {
    return (
      displayTokenList.length === 0 ||
      displayTokenList.every(
        (token) => token.amount === 0 || token.amount === undefined
      )
    );
  }, [displayTokenList]);

  const handleTokenClick = useCallback(
    (token: TokenItem) => {
      const disableInfo = disableItemCheck?.(token);
      if (!disableInfo?.disable) {
        onSelect(token);
      }
    },
    [onSelect, disableItemCheck]
  );

  return (
    <div className="flex flex-col gap-5 ">
      <div
        className={`flex items-center gap-3 px-2 bg-r-neutral-bg-1 rounded-lg border ${'border-r-neutral-line'}`}
      >
        <label className="text-14 flex items-center text-secondary-foreground justify-center font-medium min-w-8">
          To
        </label>
        <Separator orientation="vertical" />
        <Input
          placeholder="Wallet Address (0x...)"
          value={recipientAddress}
          sizeVariant={InputSize.SM}
          readOnly
          className="flex-1 text-14 border-0 outline-0 bg-transparent p-0"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Spin />
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-0">
          {displayTokenList.map((token) => {
            const disableInfo = disableItemCheck?.(token);
            const isDisabled = disableInfo?.disable || false;
            const isSelected =
              selectedToken?.id === token.id &&
              selectedToken?.chain === token.chain;

            // Filter out tokens with amount === 0 or undefined
            if (token.amount === 0 || token.amount === undefined) {
              return null;
            }

            return (
              <div
                key={`${token.chain}-${token.id}`}
                className={`p-4 rounded-2xl cursor-pointer bg-[#F9F9F9] transition-all duration-200 flex items-start gap-4 self-stretch ${
                  isSelected ? ' bg-white border border-gray-400' : ''
                } ${
                  isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border hover:border-gray-400 '
                }`}
                onClick={() => handleTokenClick(token)}
              >
                {token.logo_url && (
                  <img
                    src={token.logo_url}
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col gap-0.5 flex-1">
                  <div className="font-semibold text-14 text-r-neutral-title-1">
                    {token.name}
                  </div>
                  <div className="text-12 text-r-neutral-body">
                    {getTokenSymbol(token)}
                  </div>
                </div>

                {isDisabled ? (
                  <div
                    className="text-11 text-r-red-default max-w-30 text-right"
                    title={disableInfo?.reason}
                  >
                    {disableInfo?.shortReason}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 text-right">
                    {token.amount !== undefined && token.amount > 0 && (
                      <div className="text-12 text-r-neutral-body">
                        {token.amount?.toFixed(4)} {getTokenSymbol(token)}
                      </div>
                    )}
                    {token.price !== undefined && token.price > 0 && (
                      <div className="text-12 font-medium text-r-neutral-title-1">
                        ${token.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && allTokensHaveZeroLiquidity && (
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <div className="flex items-center justify-center gap-2">
            <img
              src={NoTokenIcon1}
              alt="No tokens icon 1"
              className="w-full h-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-primary-foreground text-center">
              No tokens yet
            </h3>
            <p className="text-14 text-secondary-foreground text-center">
              Buy your first crypto with Rampnow
            </p>
          </div>

          <Button
            className="w-full"
            onClick={() =>
              window.open('https://app.rampnow.io/order/quote', '_blank')
            }
          >
            Buy
          </Button>
        </div>
      )}
    </div>
  );
};

export default TokenSelection;
