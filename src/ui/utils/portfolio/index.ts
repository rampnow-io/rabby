import { useCallback } from 'react';

import { useTokens } from './token';
import { usePortfolios } from './usePortfolio';

type UseQueryProjectsOptions = {
  visible?: boolean;
  lpTokenMode?: boolean;
  searchMode?: boolean;
  autoLoad?: boolean;
};

export const useQueryProjects = (
  userAddr: string | undefined,
  {
    visible = false,
    lpTokenMode = false,
    searchMode = false,
    autoLoad = true,
  }: UseQueryProjectsOptions = {}
) => {
  const shouldAutoLoad = visible && autoLoad;

  const {
    tokens,
    isLoading: isTokensLoading,
    hasValue: hasTokens,
    updateData: updateTokens,
  } = useTokens(userAddr, undefined, shouldAutoLoad);

  const {
    data: portfolios,
    isLoading: isPortfoliosLoading,
    hasValue: hasPortfolios,
    netWorth: portfolioNetWorth,
    updateData: updatePortfolio,
    removeProtocol,
  } = usePortfolios(userAddr, undefined, shouldAutoLoad);

  const refreshPositions = useCallback(() => {
    if (!autoLoad || (!isTokensLoading && !isPortfoliosLoading)) {
      updatePortfolio();
      updateTokens();
    }
  }, [
    updatePortfolio,
    updateTokens,
    isTokensLoading,
    isPortfoliosLoading,
    autoLoad,
  ]);

  return {
    portfolioNetWorth,
    refreshPositions,
    refreshTokens: updateTokens,
    refreshPortfolios: updatePortfolio,
    isTokensLoading,
    isPortfoliosLoading,
    hasTokens,
    hasPortfolios,
    tokens,
    portfolios,
    removeProtocol,
  };
};
