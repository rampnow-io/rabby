import {
  PortfolioItem,
  PortfolioItemToken,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import { CHAINS } from 'consts';
import { DisplayedProject } from './project';
import { WalletControllerType } from '../WalletContext';
import { requestOpenApiWithChainId } from '@/ui/utils/openapi';
import { isTestnet as checkIsTestnet } from '@/utils/chain';
import { pQueue } from './utils';
import { flatten } from 'lodash';

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
    const usedChains = await wallet.openapi.usedChainList(user_id);
    let chainIdList = usedChains.map((item) => item.id);

    console.log('📊 usedChainList returned:', chainIdList.length, 'chains');

    // IMPORTANT FIX: Always include major chains even if not in usedChainList
    // This ensures we get tokens even if user hasn't used the chain yet
    const majorChains = [
      'eth',
      'bsc',
      'matic',
      'avax',
      'op',
      'arb',
      'pls',
      'celo',
    ];
    const missingMajorChains = majorChains.filter(
      (chain) => !chainIdList.includes(chain)
    );

    if (missingMajorChains.length > 0) {
      console.warn(
        `⚠️ Adding ${missingMajorChains.length} major chains not in usedChainList:`,
        missingMajorChains
      );
      chainIdList = [...chainIdList, ...missingMajorChains];
    }

    console.log('🔍 Querying tokens for chains:', chainIdList);

    const res = await Promise.all(
      chainIdList.map((serverId) =>
        pQueue.add(() => {
          return requestOpenApiWithChainId(
            ({ openapi }) => openapi.listToken(user_id, serverId, isAll),
            {
              wallet,
              isTestnet,
            }
          );
        })
      )
    );

    const flatRes = flatten(res);

    // Debug: Log API response for Pulse tokens
    const pulseTokensFromAPI = flatRes.filter((t) => t.chain === 'pls');
    console.log(
      `📡 API Response: Total tokens=${flatRes.length}, Pulse tokens=${pulseTokensFromAPI.length}`
    );
    if (pulseTokensFromAPI.length > 0) {
      console.log(
        '✅ Pulse tokens from API:',
        pulseTokensFromAPI
          .slice(0, 3)
          .map((t) => ({ symbol: t.symbol, chain: t.chain }))
      );
    } else {
      console.warn('⚠️ No Pulse tokens returned from API');
    }

    return flatRes;
  }
  return requestOpenApiWithChainId(
    ({ openapi }) => openapi.listToken(user_id, chainId, isAll),
    {
      wallet,
      isTestnet,
    }
  );
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

export const sortWalletTokens = (wallet: DisplayedProject) => {
  return wallet._portfolios
    .flatMap((x) => x._tokenList)
    .sort((m, n) => (n._usdValue || 0) - (m._usdValue || 0));
};
