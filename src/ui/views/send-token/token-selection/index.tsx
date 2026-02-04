import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@repo/ui/primitives';
import styled from 'styled-components';
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
}

const TokenListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
`;

const TokenItemWrapper = styled.div<{ selected?: boolean; disabled?: boolean }>`
  padding: 12px 16px;
  border: 1px solid
    ${(props) =>
      props.selected
        ? 'var(--r-blue-default, #7084ff)'
        : 'var(--r-neutral-line, rgba(255, 255, 255, 0.1))'};
  border-radius: 8px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  background-color: ${(props) =>
    props.selected ? 'var(--r-blue-light-1, #eef1ff)' : 'transparent'};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: all 0.2s ease;

  &:hover {
    ${(props) =>
      !props.disabled &&
      `
    border-color: var(--r-blue-default, #7084ff);
    background-color: var(--r-blue-light-1, #eef1ff);
    `}
  }

  display: flex;
  align-items: center;
  gap: 12px;
`;

const TokenLogo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const TokenInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TokenName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: var(--r-neutral-title-1, #fff);
`;

const TokenSymbol = styled.div`
  font-size: 12px;
  color: var(--r-neutral-body, #b3b3b3);
`;

const TokenBalance = styled.div`
  font-size: 12px;
  color: var(--r-neutral-body, #b3b3b3);
  text-align: right;
`;

const TokenPriceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
`;

const TokenPrice = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--r-neutral-title-1, #000);
`;

const DisabledText = styled.div`
  font-size: 11px;
  color: var(--r-red-default, #ff0000);
  max-width: 120px;
  text-align: right;
`;

const TokenSelection: React.FC<TokenSelectionProps> = ({
  onSelect,
  selectedToken,
  loading: externalLoading = false,
  tokens: externalTokens,
  chainId,
  excludeTokens = [],
  disableItemCheck,
}) => {
  const { t } = useTranslation();
  const currentAccount = useRabbySelector(
    (state) => state.account.currentAccount
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [updateNonce, setUpdateNonce] = useState(0);

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
    return abstractTokens;
  }, [allTokens, externalTokens]);

  const { list: searchedTokenByQuery } = useSearchToken(
    currentAccount?.address,
    searchQuery,
    chainId,
    true
  );

  const availableTokens = useMemo(() => {
    const filtered = (searchQuery
      ? searchedTokenByQuery
      : allDisplayTokens
    ).filter((e) => !excludeTokens.includes(e.id));
    return uniqBy(filtered, (t) => `${t.chain}-${t.id}`);
  }, [searchQuery, searchedTokenByQuery, allDisplayTokens, excludeTokens]);

  const displayTokenList = useSortToken(
    availableTokens as (TokenItem | AbstractPortfolioToken)[]
  );

  const isLoading = externalLoading || isLoadingAllTokens;

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
    <div className="p-4">
      <div className="pb-4">
        <Input
          placeholder={t('page.sendToken.tokenSearch') || 'Search tokens...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Spin />
        </div>
      ) : (
        <TokenListContainer>
          {displayTokenList.map((token) => {
            const disableInfo = disableItemCheck?.(token);
            const isDisabled = disableInfo?.disable || false;

            return (
              <TokenItemWrapper
                key={`${token.chain}-${token.id}`}
                selected={
                  selectedToken?.id === token.id &&
                  selectedToken?.chain === token.chain
                }
                disabled={isDisabled}
                onClick={() => handleTokenClick(token)}
              >
                {token.logo_url && (
                  <TokenLogo src={token.logo_url} alt={token.symbol} />
                )}
                <TokenInfo>
                  <TokenName>{token.name}</TokenName>
                  <TokenSymbol>{getTokenSymbol(token)}</TokenSymbol>
                </TokenInfo>

                {isDisabled ? (
                  <DisabledText title={disableInfo?.reason}>
                    {disableInfo?.shortReason}
                  </DisabledText>
                ) : (
                  <TokenPriceSection>
                    {token.amount !== undefined && token.amount > 0 && (
                      <TokenBalance>
                        {token.amount?.toFixed(4)} {getTokenSymbol(token)}
                      </TokenBalance>
                    )}
                    {token.price !== undefined && token.price > 0 && (
                      <TokenPrice>${token.price.toFixed(2)}</TokenPrice>
                    )}
                  </TokenPriceSection>
                )}
              </TokenItemWrapper>
            );
          })}
        </TokenListContainer>
      )}

      {!isLoading && displayTokenList.length === 0 && (
        <div className="text-center py-8">
          <p className="text-secondary-foreground text-sm">
            {t('page.sendToken.noTokens') || 'No tokens found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenSelection;
