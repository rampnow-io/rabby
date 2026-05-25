import React from 'react';
import { Props as TokenItemProps } from './TokenItem';
import { useExpandList } from '@/ui/utils/portfolio/expandList';
import BigNumber from 'bignumber.js';
import { TokenLowValueItem } from './TokenLowValueItem';
import { TokenTable } from './components/TokenTable';
import { BlockedButton } from './BlockedButton';
import { CustomizedButton } from './CustomizedButton';
import { TokenListEmpty } from './TokenListEmpty';
import { useTranslation } from 'react-i18next';

export interface Props {
  list?: TokenItemProps['item'][];
  isSearch: boolean;
  onFocusInput: () => void;
  onOpenAddEntryPopup: () => void;
  isNoResults?: boolean;
  blockedTokens?: TokenItemProps['item'][];
  customizeTokens?: TokenItemProps['item'][];
  isTestnet: boolean;
  selectChainId?: string | null;
}

export const HomeTokenList = ({
  list,
  onFocusInput,
  onOpenAddEntryPopup,
  isSearch,
  isNoResults,
  blockedTokens,
  customizeTokens,
  isTestnet,
  selectChainId,
}) => {
  // First, sort all tokens: liquidity tokens first (with balance), then by USD value
  const sortedList = React.useMemo(() => {
    if (!list) return list;

    const getUsdValue = (item: any) => item?._usdValue ?? item?.usd_value ?? 0;
    const getAmount = (item: any) => item?.amount ?? 0;
    const hasLiquidity = (item: any) => getAmount(item) > 0;

    return [...list].sort((a, b) => {
      const aHasLiquidity = hasLiquidity(a);
      const bHasLiquidity = hasLiquidity(b);

      // Tokens with liquidity first
      if (aHasLiquidity && !bHasLiquidity) return -1;
      if (!aHasLiquidity && bHasLiquidity) return 1;

      // Both have or both don't have liquidity: sort by USD value
      return getUsdValue(b) - getUsdValue(a);
    });
  }, [list]);

  const totalValue = React.useMemo(() => {
    return sortedList;
  }, [sortedList]);
  const { result: currentList } = useExpandList(sortedList, totalValue);
  const lowValueList = React.useMemo(() => {
    // 排除customized tokens
    const customizedTokenIds = new Set(
      customizeTokens?.map((token) => token.id) || []
    );
    return sortedList?.filter(
      (item) =>
        currentList?.indexOf(item) === -1 &&
        !customizedTokenIds.has(item.id) &&
        !blockedTokens?.some(
          (blocked) => blocked.id === item.id && blocked.chain === item.chain
        )
    );
  }, [currentList, sortedList, isSearch, customizeTokens]);
  const { t } = useTranslation();

  const hasList = !!(
    list?.length ||
    currentList?.length ||
    blockedTokens?.length ||
    customizeTokens?.length
  );
  const hasLowValueList = !!lowValueList?.length;

  return (
    <div>
      <div>
        <TokenTable
          list={isSearch ? list : currentList}
          EmptyComponent={<div></div>}
        />
      </div>
    </div>
  );
};
