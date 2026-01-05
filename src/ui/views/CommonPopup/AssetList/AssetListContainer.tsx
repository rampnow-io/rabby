import React, { useEffect, useMemo } from 'react';
import { TokenSearchInput } from './TokenSearchInput';
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
  console.log('currentAccount:', currentAccount);
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
    let result = search ? list : tokenList;

    // If no tokens found, generate sample tokens from stablecoin map
    if (result.length === 0 && !isTokensLoading) {
      const sampleTokens: any[] = [];

      // Native tokens for EVM chains
      const nativeTokens: Record<
        string,
        { symbol: string; name: string; decimals: number }
      > = {
        eth: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        bnb: { symbol: 'BNB', name: 'BNB', decimals: 18 },
        op: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        arb: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        avax: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
        polygon: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
        era: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      };

      // Add native tokens first
      for (const [chainId, tokenInfo] of Object.entries(nativeTokens)) {
        sampleTokens.push({
          id: chainId,
          chain: chainId,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          display_symbol: null,
          optimized_symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          logo_url: `https://static.debank.com/image/coin/logo_url/${chainId.toLowerCase()}/6443cdccced33e204d90cb723c632917.png`,
          protocol_id: '',
          price: 0,
          price_24h_change: 0,
          credit_score: 0,
          total_supply: 0,
          is_verified: true,
          is_core: true,
          is_wallet: true,
          is_scam: false,
          is_suspicious: false,
          time_at: null,
          amount: 0,
          raw_amount: 0,
          raw_amount_hex_str: '0x0',
          raw_amount_str: '0',
          cex_ids: [],
          fdv: 0,
          _usdValue: 0,
        });
      }

      result = sampleTokens.slice(0, 10);
    }

    if (selectChainId) {
      const filtered = result.filter((item) => item.chain === selectChainId);
      return filtered;
    }
    return result;
  }, [list, tokenList, search, selectChainId, isTokensLoading]);

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

  const isEmptyAssets =
    !isTokensLoading &&
    !displayTokenList.length &&
    !isPortfoliosLoading &&
    !displayPortfolios?.length &&
    !displayBlockedTokens?.length &&
    !displayCustomizeTokens?.length &&
    !isAppPortfoliosLoading &&
    !appPortfolios?.length;

  React.useEffect(() => {
    onEmptyAssets(isEmptyAssets);
  }, [isEmptyAssets, onEmptyAssets]);

  // Get top 10 tokens by USD value
  const topTokens = useMemo(() => {
    const sorted = [...displayTokenList].sort(
      (a, b) => (b._usdValue || 0) - (a._usdValue || 0)
    );
    const top10 = sorted.slice(0, 10);
    return top10;
  }, [displayTokenList]);

  const sortTokens = topTokens;
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
      <div className="flex items-center justify-end gap-x-12 widget-has-ant-input">
        {isFocus || search ? null : <AddTokenEntry ref={addTokenEntryRef} />}
      </div>
      {isTokensLoading || isSearching ? (
        <TokenListSkeleton />
      ) : (
        <div className="mt-4">
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
