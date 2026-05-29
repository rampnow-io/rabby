import {
  PortfolioItem,
  PortfolioItemToken,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import { CHAINS } from 'consts';
import { DisplayedProject, encodeProjectTokenId } from './project';
import { WalletControllerType } from '../WalletContext';
import { requestOpenApiWithChainId } from '@/ui/utils/openapi';
import {
  isTestnet as checkIsTestnet,
  getChainList,
  getMainnetChainList,
} from '@/utils/chain';
import { pQueue } from './utils';
import { flatten } from 'lodash';
import { getTokenList } from '@/snippets/client';
import { AbstractPortfolioToken } from './types';
import { formatAmount, formatPrice, formatUsdValue } from '..';
import { getTokenSymbol } from '../token';

export const queryTokensCache = async (
  user_id: string,
  wallet: WalletControllerType,
  isTestnet = false,
  forceRefresh = false
) => {
  return requestOpenApiWithChainId(
    ({ openapi }) => openapi.getCachedTokenList(user_id),
    {
      isTestnet,
      wallet,
    }
  );
};

export const batchQueryTokens = async (
  user_id: string,
  wallet: WalletControllerType,
  chainId?: string,
  isTestnet: boolean = !chainId ? false : checkIsTestnet(chainId),
  isAll: boolean = true,
  forceRefresh = false
) => {
  if (!chainId && !isTestnet) {
    const allSupportedChains = getMainnetChainList().map(
      (chain) => chain.serverId
    );

    const response = await getTokenList({
      body: {
        address: user_id,
        chains: allSupportedChains,
        force_fetch: forceRefresh,
      },
    });

    return flatten((response.data?.data?.list as unknown) as TokenItem[][]);
  }

  const response = await getTokenList({
    body: {
      address: user_id,
      chains: [chainId || ''],
      force_fetch: forceRefresh,
    },
  });

  return flatten((response.data?.data?.list as unknown) as TokenItem[]);
};

export const batchQueryHistoryTokens = async (
  user_id: string,
  time_at: number,
  wallet: WalletControllerType,
  isTestnet = false,
  forceRefresh = false
) => {
  return requestOpenApiWithChainId(
    ({ openapi }) =>
      openapi.getHistoryTokenList({
        id: user_id,
        timeAt: time_at,
      }),
    {
      wallet,
      isTestnet,
    }
  );
};

export const walletProject = new DisplayedProject({
  id: 'Wallet',
  name: 'Wallet',
});

export const setWalletTokens = (
  p?: DisplayedProject,
  tokensDict?: Record<string, TokenItem[]>
) => {
  if (!p || !tokensDict) {
    return;
  }

  Object.entries(tokensDict).forEach(([chain, tokens]) => {
    p?.setPortfolios([
      // 假的结构 portfolio，只是用来对齐结构 PortfolioItem
      {
        pool: {
          id: chain,
        },
        asset_token_list: tokens as PortfolioItemToken[],
      } as PortfolioItem,
    ]);
  });
};

// Major chains to prioritize (show first)
const MAJOR_CHAINS_ORDER = [
  'eth',
  'bsc',
  'matic',
  'avax',
  'op',
  'arb',
  'pls',
  'celo',
];

/**
 * Sort tokens by:
 * 1. Liquidity first (tokens with amount > 0 at top)
 * 2. Chain priority (major chains first)
 * 3. USD value within each chain (descending)
 * Shows ALL tokens
 */
export const sortWalletTokens = (wallet: DisplayedProject) => {
  const allTokens = wallet._portfolios.flatMap((x) => x._tokenList);

  return allTokens.sort((a, b) => {
    const getAmount = (item: any) => item?.amount ?? 0;
    const aHasLiquidity = getAmount(a) > 0;
    const bHasLiquidity = getAmount(b) > 0;

    // First priority: tokens with liquidity come first
    if (aHasLiquidity && !bHasLiquidity) return -1;
    if (!aHasLiquidity && bHasLiquidity) return 1;

    // Within same liquidity group, sort by chain priority
    const chainA = a.chain || '';
    const chainB = b.chain || '';

    const chainAIndex = MAJOR_CHAINS_ORDER.indexOf(chainA);
    const chainBIndex = MAJOR_CHAINS_ORDER.indexOf(chainB);

    const priorityA = chainAIndex === -1 ? 999 : chainAIndex;
    const priorityB = chainBIndex === -1 ? 999 : chainBIndex;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Within same chain, sort by USD value (highest first)
    return (b._usdValue || 0) - (a._usdValue || 0);
  });
};

export const concatAndSort = <
  T extends {
    symbol: string;
    is_core?: boolean;
    price?: number;
    amount?: number;
  }
>(
  source: T[],
  appendList: T[],
  keyword: string
): T[] => {
  return source
    .concat(
      appendList.filter((token) =>
        token.symbol.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (a.is_core && !b.is_core) {
        return -1;
      }
      if (!a.is_core && b.is_core) {
        return 1;
      }
      const aValue = (a.price ?? 0) * (a.amount ?? 0);
      const bValue = (b.price ?? 0) * (b.amount ?? 0);
      return bValue - aValue;
    });
};

export const parseTokenItem = (token: TokenItem): AbstractPortfolioToken => {
  const formattedPrice = token.price || 0;
  const formattedAmount = token.amount || 0;
  const realUsdValue = formattedPrice * formattedAmount;
  const usdValue = Math.abs(realUsdValue);
  return {
    id: encodeProjectTokenId(token),
    _tokenId: token.id,
    chain: token.chain,
    symbol: getTokenSymbol(token),
    logo_url: token.logo_url,
    amount: formattedAmount,
    price: formattedPrice,
    _realUsdValue: realUsdValue,
    _usdValue: usdValue,
    _amountStr: formatAmount(Math.abs(formattedAmount)),
    _priceStr: formatPrice(formattedPrice),
    _usdValueStr: formatUsdValue(usdValue),

    decimals: token.decimals,
    display_symbol: token.display_symbol,
    name: token.name,
    optimized_symbol: token.optimized_symbol,
    is_core: token.is_core,
    is_wallet: token.is_wallet,
    is_verified: token.is_verified,
    is_suspicious: token.is_suspicious,
    time_at: token.time_at,
    price_24h_change: token.price_24h_change,
    low_credit_score: token.low_credit_score,
    raw_amount_hex_str: token.raw_amount_hex_str,
    cex_ids: token.cex_ids || [],

    _amountChangeStr: '',
    _usdValueChangeStr: '-',
    _amountChangeUsdValueStr: '',
  };
};
