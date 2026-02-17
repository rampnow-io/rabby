import React, { useEffect, useMemo } from 'react';
import AddTokenEntry, { AddTokenEntryInst } from './AddTokenEntry';
import { useRabbySelector } from '@/ui/store';
import { HomeTokenList } from './TokenList';

import useSearchToken from '@/ui/hooks/useSearchToken';
import {
  TokenListSkeleton,
  TokenListViewSkeleton,
} from './TokenListViewSkeleton';
import ProtocolList from './ProtocolList';
import { useQueryProjects } from 'ui/utils/portfolio';
import { InputRef } from 'antd';
import { useFilterProtocolList } from './useFilterProtocolList';
import { useAppChain } from '@/ui/hooks/useAppChain';
import { useCommonPopupView } from '@/ui/utils';
import { StablecoinMapAggregatedByChain } from '@/constant/dex-swap';
import { findChain } from '@/utils/chain';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';

interface Props {
  className?: string;
  selectChainId: string | null;
  visible: boolean;
  onEmptyAssets: (isEmpty: boolean) => void;
  isTestnet?: boolean;
}

export const AssetListContainer: React.FC<Props> = ({
  className,
  selectChainId,
  visible,
  onEmptyAssets,
  isTestnet = false,
}) => {
  const [search, setSearch] = React.useState<string>('');
  const handleOnSearch = React.useCallback((value: string) => {
    setSearch(value);
  }, []);
  const [isFocus, setIsFocus] = React.useState<boolean>(false);
  const { currentAccount } = useRabbySelector((s) => ({
    currentAccount: s.account.currentAccount,
  }));
  const { setApps } = useCommonPopupView();
  const {
    isTokensLoading,
    isPortfoliosLoading,
    portfolios,
    tokens: tokenList,
    hasTokens,
    blockedTokens,
    customizeTokens,
    removeProtocol,
  } = useQueryProjects(currentAccount?.address, false, visible, isTestnet);
  const {
    data: appPortfolios,
    isLoading: isAppPortfoliosLoading,
  } = useAppChain(currentAccount?.address, visible, isTestnet);

  const inputRef = React.useRef<InputRef>(null);
  const { isLoading: isSearching, list } = useSearchToken(
    currentAccount?.address,
    search,
    selectChainId ? selectChainId : undefined,
    true,
    isTestnet
  );
  const displayTokenList = useMemo(() => {
    const result = search ? list : tokenList;
    if (selectChainId) {
      return result.filter((item) => item.chain === selectChainId);
    }
    return result;
  }, [list, tokenList, search, selectChainId]) as AbstractPortfolioToken[];

  const displayPortfolios = useMemo(() => {
    const combinedPortfolios = [
      ...(portfolios || []),
      ...(appPortfolios || []),
    ].sort((m, n) => (n.netWorth || 0) - (m.netWorth || 0));
    if (selectChainId) {
      return combinedPortfolios?.filter((item) => item.chain === selectChainId);
    }
    return combinedPortfolios;
  }, [portfolios, appPortfolios, selectChainId]);

  const displayBlockedTokens = useMemo(() => {
    if (selectChainId) {
      return blockedTokens?.filter((item) => item.chain === selectChainId);
    }
    return blockedTokens;
  }, [blockedTokens, selectChainId]);

  const displayCustomizeTokens = useMemo(() => {
    if (selectChainId) {
      return customizeTokens?.filter((item) => item.chain === selectChainId);
    }
    return customizeTokens;
  }, [customizeTokens, selectChainId]);

  // Sort all tokens: liquidity tokens first (with balance), then by USD value
  const sortedTokens = useMemo(() => {
    const getUsdValue = (item: any) => item?._usdValue ?? item?.usd_value ?? 0;
    const getAmount = (item: any) => item?.amount ?? 0;
    const hasLiquidity = (item: any) => getAmount(item) > 0;

    const sorted = [...displayTokenList].sort((a, b) => {
      const aHasLiquidity = hasLiquidity(a);
      const bHasLiquidity = hasLiquidity(b);

      // Tokens with liquidity first
      if (aHasLiquidity && !bHasLiquidity) return -1;
      if (!aHasLiquidity && bHasLiquidity) return 1;

      // Both have or both don't have liquidity: sort by USD value
      return getUsdValue(b) - getUsdValue(a);
    });

    // Debug: Log filter info
    if (selectChainId) {
      const filteredByChain = tokenList.filter(
        (t) => t.chain === selectChainId
      );
      console.log(
        `🔍 Filter by chain: ${selectChainId} - Total: ${tokenList.length}, Filtered: ${filteredByChain.length}, Sorted: ${sorted.length}`
      );
    }

    return sorted;
  }, [displayTokenList, selectChainId, tokenList]);

  const sortTokens = sortedTokens;
  const filteredPortfolios = useFilterProtocolList({
    list: displayPortfolios,
    kw: search,
  });

  const handleFocusInput = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!visible) {
      setSearch('');
      if (inputRef.current?.input) {
        inputRef.current.input.value = '';
      }
      inputRef.current?.focus();
      inputRef.current?.blur();
    }
  }, [visible]);

  // Reset search when chain filter changes to show all tokens for that chain
  React.useEffect(() => {
    if (selectChainId) {
      setSearch('');
      if (inputRef.current?.input) {
        inputRef.current.input.value = '';
      }
      console.log(`📍 Chain filter changed to: ${selectChainId}`);
    }
  }, [selectChainId]);

  // Log token data for debugging live values
  useEffect(() => {
    if (sortTokens.length > 0 && visible) {
      const debugInfo = sortTokens.slice(0, 5).map((t) => ({
        symbol: t.symbol,
        chain: t.chain,
        _usdValue: t._usdValue ?? 0,
        _usdValueStr: t._usdValueStr ?? '$0.00',
        price: t.price,
        price_24h_change: t.price_24h_change,
        price_24h_change_type: typeof t.price_24h_change,
        price_24h_change_isNull: t.price_24h_change === null,
        price_24h_change_isUndefined: t.price_24h_change === undefined,
        amount: t.amount,
      }));

      console.log('Token data check (first 5):', debugInfo);

      // Check for tokens with missing price change data
      const tokensWithMissingPriceChange = sortTokens.filter(
        (t) => t.price_24h_change === null || t.price_24h_change === undefined
      );

      if (tokensWithMissingPriceChange.length > 0) {
        console.warn(
          `⚠️ ${tokensWithMissingPriceChange.length}/${sortTokens.length} tokens have missing price_24h_change:`,
          tokensWithMissingPriceChange
            .slice(0, 3)
            .map((t) => ({ symbol: t.symbol, chain: t.chain, price: t.price }))
        );
      }

      // Debug: Check for Pulse Chain tokens
      const pulseTokens = sortTokens.filter((t) => t.chain === 'pls');
      if (pulseTokens.length > 0) {
        console.log(
          '✅ Found Pulse Chain tokens:',
          pulseTokens.length,
          pulseTokens.slice(0, 3)
        );
      } else {
        console.warn('⚠️ No Pulse Chain tokens found in displayTokenList');
      }
    }
  }, [sortTokens, visible]);

  useEffect(() => {
    if (appPortfolios) {
      setApps(
        appPortfolios.map((item) => ({
          logo: item.logo || '',
          name: item.name,
          id: item.id,
          usd_value: item.netWorth || 0,
        }))
      );
    }
  }, [appPortfolios]);
  const appIds = useMemo(() => {
    return [...new Set(appPortfolios?.map((item) => item.id) || [])];
  }, [appPortfolios]);

  const addTokenEntryRef = React.useRef<AddTokenEntryInst>(null);

  if (isTokensLoading && !hasTokens) {
    return <TokenListViewSkeleton />;
  }

  const isNoResults =
    !isSearching &&
    !isTokensLoading &&
    !isPortfoliosLoading &&
    !isAppPortfoliosLoading &&
    !!search &&
    !sortTokens.length &&
    !filteredPortfolios?.length;

  return (
    <div className={className}>
      {isTokensLoading || isSearching ? (
        <TokenListSkeleton />
      ) : (
        <div className="mt-4 ">
          <HomeTokenList
            list={sortTokens}
            onFocusInput={handleFocusInput}
            onOpenAddEntryPopup={() => {
              addTokenEntryRef.current?.startAddToken();
            }}
            isSearch={!!search}
            isNoResults={isNoResults}
            blockedTokens={displayBlockedTokens}
            customizeTokens={displayCustomizeTokens}
            isTestnet={isTestnet}
            selectChainId={selectChainId}
          />
        </div>
      )}

      <div
        style={{
          display: visible ? 'block' : 'none',
        }}
      >
        {isPortfoliosLoading && isAppPortfoliosLoading ? (
          <TokenListSkeleton />
        ) : (
          <ProtocolList
            removeProtocol={removeProtocol}
            appIds={appIds}
            isSearch={!!search}
            list={filteredPortfolios}
          />
        )}
      </div>
    </div>
  );
};
