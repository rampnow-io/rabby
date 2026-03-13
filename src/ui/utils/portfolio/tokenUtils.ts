import {
  PortfolioItem,
  PortfolioItemToken,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import { CHAINS } from 'consts';
import { DisplayedProject } from './project';
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

export const queryTokensCache = async (
  user_id: string,
  wallet: WalletControllerType,
  isTestnet = false
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
  isAll: boolean = true
) => {
  if (!chainId && !isTestnet) {
    const allSupportedChains = getMainnetChainList().map(
      (chain) => chain.serverId
    );

    const response = await getTokenList({
      body: {
        address: user_id,
        chains: allSupportedChains,
      },
    });

    return flatten((response.data?.data?.list as unknown) as TokenItem[][]);
  }

  const response = await getTokenList({
    body: {
      address: user_id,
      chains: [chainId || ''],
    },
  });

  return flatten((response.data?.data?.list as unknown) as TokenItem[]);
};

export const batchQueryHistoryTokens = async (
  user_id: string,
  time_at: number,
  wallet: WalletControllerType,
  isTestnet = false
) => {
  return requestOpenApiWithChainId(
    ({ openapi }) =>
      openapi.getHistoryTokenList({ id: user_id, timeAt: time_at }),
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
