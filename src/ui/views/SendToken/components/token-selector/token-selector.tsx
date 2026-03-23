import { BottomDrawer } from '@repo/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import uniqBy from 'lodash/uniqBy';
import { useTokens } from '@/ui/utils/portfolio/token';
import { useRabbySelector } from '@/ui/store';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';
import { abstractTokenToTokenItem, getTokenSymbol } from '@/ui/utils/token';
import useSearchToken from '@/ui/hooks/useSearchToken';
import useSortToken from '@/ui/hooks/useSortTokens';
import NoTokenIcon1 from '@/ui/assets/no-tokens-icon-1.svg';
import { Button } from '@repo/ui/primitives';
import { findChain } from '@/utils/chain';
import { useWallet } from '@/ui/utils';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useHistory } from 'react-router-dom';
import IconUnknown from '@/ui/assets/token-default.svg';
import { Tooltip as TooltipView } from 'antd';

interface TokenSelectionProps {
  onSelect: (token: TokenItem) => void;

  chainId?: string;

  close: () => void;
}

const TokenSelectorModal = ({
  onSelect,
  chainId,
  close,
}: TokenSelectionProps) => {
  const currentAccount = useRabbySelector(
    (state) => state.account.currentAccount
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [updateNonce, setUpdateNonce] = useState(0);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokenList, setTokenList] = useState<TokenItem[]>([]);
  const wallet = useWallet();
  const history = useHistory();
  useEffect(() => {
    const fetchTokens = async () => {
      if (!currentAccount) return;
      try {
        setTokensLoading(true);
        const chainItem = findChain({ enum: 'eth' });
        if (!chainItem?.serverId) return;
        const tokens = await wallet.openapi.listToken(
          currentAccount.address,
          chainItem.serverId
        );
        setTokenList(tokens || []);
      } catch (e) {
        console.error('Failed to fetch tokens:', e);
        // Fallback for testnet - set empty list or mock tokens
        setTokenList([]);
      } finally {
        setTokensLoading(false);
      }
    };

    fetchTokens();
  }, [currentAccount, wallet]);

  // Format address - shows first 8 and last 4 chars with ellipsis
  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };

  // Use external tokens if provided, otherwise fetch from wallet
  const shouldLoadTokens = useMemo(() => !tokenList || tokenList.length === 0, [
    tokenList,
  ]);

  const { tokens: allTokens, isLoading: isLoadingAllTokens } = useTokens(
    currentAccount?.address,
    undefined,
    shouldLoadTokens,
    updateNonce,
    chainId
  );

  const allDisplayTokens = useMemo(() => {
    if (tokenList && tokenList.length > 0) {
      return tokenList as (TokenItem | AbstractPortfolioToken)[];
    }
    const abstractTokens = (allTokens as unknown) as AbstractPortfolioToken[];
    // Convert AbstractPortfolioToken to TokenItem to fix concatenated ID issue
    // Maps _tokenId (actual address) to id field
    return abstractTokens.map(abstractTokenToTokenItem);
  }, [allTokens, tokenList]);

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
    const filtered = searchQuery ? searchedDisplayTokens : allDisplayTokens;
    return uniqBy(filtered, (t) => `${t.chain}-${t.id}`);
  }, [searchQuery, searchedDisplayTokens, allDisplayTokens]);

  const displayTokenList = useSortToken(
    availableTokens as (TokenItem | AbstractPortfolioToken)[]
  );

  const hasPositiveBalance = useCallback(
    (token: TokenItem | AbstractPortfolioToken) => {
      const numericAmount = Number((token as TokenItem).amount ?? 0);
      return Number.isFinite(numericAmount) && numericAmount > 0;
    },
    []
  );

  const nonZeroTokenList = useMemo(() => {
    return displayTokenList.filter((token) => hasPositiveBalance(token));
  }, [displayTokenList, hasPositiveBalance]);

  const isLoading = isLoadingAllTokens;

  // Check if all tokens have 0 or undefined liquidity
  const allTokensHaveZeroLiquidity = useMemo(() => {
    return nonZeroTokenList.length === 0;
  }, [nonZeroTokenList]);

  const handleTokenClick = useCallback(
    (token: TokenItem) => {
      onSelect(token);
      close();
    },
    [onSelect, close]
  );
  return (
    <BottomDrawer secondaryAnimation close={close}>
      <div className="flex flex-shrink flex-grow flex-col overflow-hidden ">
        <div className=" w-full flex items-center justify-between px-4 py-6">
          <div className="text-lg font-medium">Send</div>
          <X
            className="cursor-pointer justify-self-end"
            size={20}
            onClick={() => {
              if (allTokensHaveZeroLiquidity) {
                history.goBack();
              } else {
                close();
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-4 px-4 flex-1 overflow-hidden">
          <div className="text-base text-primary-foreground font-semibold">
            Asset
          </div>

          <>
            {nonZeroTokenList.length > 0 && (
              <div className="flex flex-col gap-2 py-0 flex-1 min-h-0 overflow-y-auto">
                {nonZeroTokenList.map((token) => {
                  const chain = findChain({ serverId: token.chain });
                  return (
                    <div
                      key={`${token.chain}-${token.id}`}
                      className={`p-4  rounded-2xl cursor-pointer bg-[#FAFAFA] hover:bg-[#F4F4F4]  flex items-center gap-4 `}
                      onClick={() => handleTokenClick(token)}
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {token.logo_url ? (
                          <img
                            src={token.logo_url}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <img
                            src={IconUnknown}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <>
                          {chain?.logo ? (
                            <img
                              src={chain.logo}
                              alt={token.chain}
                              className="absolute w-4 h-4 right-[-4px] bottom-[-4px] rounded-full border-2 border-white bg-white"
                            />
                          ) : (
                            <img
                              src={IconUnknown}
                              alt={token.chain}
                              className="absolute w-4 h-4 right-[-4px] bottom-[-4px] rounded-full border-2 border-white bg-white"
                            />
                          )}
                        </>
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1">
                        <div className="font-medium text-base text-primary-foreground">
                          {token.symbol}
                        </div>
                        <div className="text-sm text-secondary-foreground">
                          {token.chain}
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5 text-right flex-shrink-0">
                        {token.amount !== undefined && token.amount > 0 && (
                          <div className="text-base text-primary-foreground">
                            {token.amount?.toFixed(4)}
                          </div>
                        )}
                        {token.price !== undefined && token.price > 0 && (
                          <div className="text-sm font-medium text-secondary-foreground">
                            ${token.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>

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
      </div>
    </BottomDrawer>
  );
};

export default TokenSelectorModal;
