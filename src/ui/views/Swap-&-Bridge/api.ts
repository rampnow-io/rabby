import { createClient, createConfig } from '@/snippets/client/client';
import {
  getDexSwapQuote,
  getSwapRoutes,
  getSwapTools,
  getSwapChains,
  getSwapGasPrices,
  getSwapStatus,
  submitDeposit,
} from '@/snippets/client/sdk.gen';
import type { GetDexSwapQuoteResponse } from '@/snippets/client/types.gen';
import type { GasLevel } from '@rabby-wallet/rabby-api/dist/types';
import { INITIAL_WALLET_API_URL } from '@/constant';
import { findChain, findChainByID } from '@/utils/chain';

const API_KEY = process.env.RAMPNOW_API_KEY || '';
const BASE_V1 = `${INITIAL_WALLET_API_URL}/v1`;

// SDK client configured to point at our backend with Bearer auth
export const apiClient = createClient(
  createConfig({
    baseUrl: INITIAL_WALLET_API_URL,
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HypermidBridgeQuoteBase {
  aggregator: { id: string; name: string; logo_url: string; logo?: string };
  bridge_id: string;
  bridge: { id: string; name: string; logo_url: string };
  to_token_amount: string;
  to_token_raw_amount: string;
  to_token_raw_amount_hex_str: string;
  gas_fee: { usd_value: number };
  protocol_fee: { usd_value: number };
  rabby_fee: { usd_value: number };
  approve_contract_id: string;
  duration: number;
  quote_key: Record<string, unknown>;
  routePath: string;
}

export interface HypermidBridgeTokenItem {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  logo_url: string;
  price: number;
  amount: number;
}

export interface HypermidBridgeHistoryItem {
  aggregator: { id: string; name: string; logo_url: string };
  bridge: { id: string; name: string; logo_url: string };
  from_token: HypermidBridgeTokenItem;
  to_token: HypermidBridgeTokenItem;
  status: string;
  create_at: number;
  detail_url: string;
  chain?: string;
  from_tx?: { tx_id?: string };
}

export interface BridgeAggregator {
  id: string;
  name: string;
  logo_url: string;
  bridge_list: { id: string; name: string; logo_url: string }[];
}

// ── Chain ID helpers ──────────────────────────────────────────────────────────

function serverIdToNumericId(serverId: string): string {
  return findChain({ serverId })?.id?.toString() || serverId;
}

export function numericIdToServerId(numericId: string | number): string {
  return findChainByID(Number(numericId))?.serverId || String(numericId);
}

// ── SDK-based functions ───────────────────────────────────────────────────────

/** GET /v1/swap/routes — cross-chain bridge quotes (all aggregators, one call) */
export async function fetchBridgeRoutes(params: {
  user_addr: string;
  from_chain_id: string;
  from_token_id: string;
  from_token_raw_amount: string;
  to_chain_id: string;
  to_token_id: string;
  slippage: string;
}): Promise<HypermidBridgeQuoteBase[]> {
  const result = await getSwapRoutes({
    client: apiClient,
    query: {
      fromChain: serverIdToNumericId(params.from_chain_id),
      toChain: serverIdToNumericId(params.to_chain_id),
      fromToken: params.from_token_id,
      toToken: params.to_token_id,
      fromAmount: params.from_token_raw_amount,
      fromAddress: params.user_addr,
      slippage: params.slippage,
    },
  });

  // API may return a raw array or { code, data: [...] } wrapper
  const raw = result.data as any;
  const routes: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return routes.map(
    (route: any): HypermidBridgeQuoteBase => {
      const firstStep = route.steps?.[0];
      const toolDetails = firstStep?.toolDetails || {
        key: '',
        name: '',
        logoURI: '',
      };
      return {
        aggregator: {
          id: toolDetails.key || 'unknown',
          name: toolDetails.name || 'Unknown',
          logo_url: toolDetails.logoURI || '',
          logo: toolDetails.logoURI || '',
        },
        bridge_id: toolDetails.key || 'unknown',
        bridge: {
          id: toolDetails.key || 'unknown',
          name: toolDetails.name || 'Unknown',
          logo_url: toolDetails.logoURI || '',
        },
        to_token_raw_amount: route.toAmount || '0',
        to_token_raw_amount_hex_str: route.toAmount || '0',
        to_token_amount: route.toAmountUSD || '0',
        gas_fee: { usd_value: parseFloat(route.gasCostUSD || '0') },
        protocol_fee: { usd_value: 0 },
        rabby_fee: { usd_value: 0 },
        approve_contract_id: firstStep?.estimate?.approvalAddress || '',
        duration: firstStep?.estimate?.executionDuration || 0,
        quote_key: {
          route_id: route.id,
          from_address: params.user_addr,
          from_chain_id: params.from_chain_id,
          to_chain_id: params.to_chain_id,
          to_amount: route.toAmount,
          to_amount_usd: route.toAmountUSD,
        },
        routePath: route.id || '',
      };
    }
  );
}

/** GET /v1/swap/tools — aggregator + exchange list */
export async function fetchAggregatorList(): Promise<BridgeAggregator[]> {
  const result = await getSwapTools({ client: apiClient });
  const raw = result.data as any;
  const bridges: any[] = raw?.bridges || raw?.data?.bridges || [];
  return bridges.map(
    (b: any): BridgeAggregator => ({
      id: b.key,
      name: b.name,
      logo_url: b.logo_uri || '',
      bridge_list: [],
    })
  );
}

/** GET /v1/swap/chains — supported chain server-IDs */
export async function fetchSupportedChains(): Promise<string[]> {
  const result = await getSwapChains({ client: apiClient });
  const raw = result.data as any;
  const chains: any[] = raw?.chains || raw?.data?.chains || [];
  return chains.map((c: any) => numericIdToServerId(c.id)).filter(Boolean);
}

/**
 * Adapter for @rabby-wallet/rabby-swap's getQuote(dexId, params, api).
 * The library only calls api.getSwapQuote — this routes it through the SDK
 * with correct auth and endpoint (/v1/swap/dex_quote).
 */
export const dexSwapQuoteAdapter = {
  getSwapQuote: async (params: {
    id: string;
    chain_id: string;
    dex_id: string;
    pay_token_id: string;
    pay_token_raw_amount: string;
    receive_token_id: string;
    slippage: number;
    fee?: boolean;
    no_pre_exec?: boolean;
  }): Promise<GetDexSwapQuoteResponse> => {
    const result = await getDexSwapQuote({
      client: apiClient,
      query: {
        id: params.id,
        chain_id: serverIdToNumericId(params.chain_id),
        dex_id: params.dex_id,
        pay_token_id: params.pay_token_id,
        pay_token_raw_amount: params.pay_token_raw_amount,
        receive_token_id: params.receive_token_id,
        slippage: String(params.slippage),
        fee: params.fee,
      },
    });
    // Unwrap: response is { code, data: GetDexSwapQuoteResponse, ... }
    return (result.data as any)?.data as GetDexSwapQuoteResponse;
  },
};

// ── Direct fetch for endpoints not in the SDK ─────────────────────────────────

async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(BASE_V1 + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_V1}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

/** GET /v1/bridge/history_list */
export async function fetchBridgeHistoryList(params: {
  user_addr: string;
  start: number;
  limit: number;
  is_all?: boolean;
}): Promise<{ total_cnt: number; history_list: HypermidBridgeHistoryItem[] }> {
  const data = await apiFetch<{
    total_cnt: number;
    history_list: {
      aggregator: { id: string; name: string; logo_url: string };
      bridge: { id: string; name: string; logo_url: string };
      from_token: {
        id: string;
        chain: string;
        name: string;
        symbol: string;
        decimals: number;
        logo_url: string;
        price: number;
        amount: number;
      };
      to_token: {
        id: string;
        chain: string;
        name: string;
        symbol: string;
        decimals: number;
        logo_url: string;
        price: number;
        amount: number;
      };
      status: string;
      create_at: number;
      detail_url: string;
      from_tx?: { tx_id?: string };
    }[];
  }>('/bridge/history_list', params);

  return {
    total_cnt: data.total_cnt || 0,
    history_list: (data.history_list || []).map((item) => ({
      ...item,
      from_token: {
        ...item.from_token,
        chain: numericIdToServerId(item.from_token.chain),
      },
      to_token: {
        ...item.to_token,
        chain: numericIdToServerId(item.to_token.chain),
      },
    })),
  };
}

/** GET /v1/bridge/recommend_chain */
export async function fetchRecommendBridgeToChain(params: {
  from_chain_id: string;
}): Promise<{ to_chain_id: string }> {
  const data = await apiFetch<{ to_chain_id: string }>(
    '/bridge/recommend_chain',
    { from_chain_id: serverIdToNumericId(params.from_chain_id) }
  );
  return { to_chain_id: numericIdToServerId(data.to_chain_id) };
}

/** GET /v1/bridge/is_same_token */
export async function fetchIsSameBridgeToken(params: {
  from_chain_id: string;
  from_token_id: string;
  to_chain_id: string;
  to_token_id: string;
}): Promise<{ is_same: boolean; aggregator_id: string }[]> {
  return apiFetch('/bridge/is_same_token', {
    from_chain_id: serverIdToNumericId(params.from_chain_id),
    from_token_id: params.from_token_id,
    to_chain_id: serverIdToNumericId(params.to_chain_id),
    to_token_id: params.to_token_id,
  });
}

/** GET /v1/bridge/suggest_slippage */
export async function fetchSuggestSlippage(params: {
  chain_id: string;
  slippage: string;
  from_token_id: string;
  to_token_id: string;
  from_token_amount: string;
}): Promise<{ suggest_slippage: number }> {
  return apiFetch('/bridge/suggest_slippage', {
    chain_id: serverIdToNumericId(params.chain_id),
    slippage: params.slippage,
    from_token_id: params.from_token_id,
    to_token_id: params.to_token_id,
    from_token_amount: params.from_token_amount,
  });
}

/** GET /v1/bridge/recommend_from_token */
export async function fetchRecommendFromToken(params: {
  user_addr: string;
  from_chain_id: string;
  from_token_id: string;
  from_token_amount: string;
  to_chain_id: string;
  to_token_id: string;
}): Promise<{ token_list: HypermidBridgeTokenItem[] }> {
  const data = await apiFetch<{
    token_list: {
      id: string;
      chain: string;
      name: string;
      symbol: string;
      decimals: number;
      logo_url: string;
      price: number;
      amount: number;
    }[];
  }>('/bridge/recommend_from_token', {
    user_addr: params.user_addr,
    from_chain_id: serverIdToNumericId(params.from_chain_id),
    from_token_id: params.from_token_id,
    from_token_amount: params.from_token_amount,
    to_chain_id: serverIdToNumericId(params.to_chain_id),
    to_token_id: params.to_token_id,
  });
  return {
    token_list: (data.token_list || []).map((t) => ({
      ...t,
      chain: numericIdToServerId(t.chain),
    })),
  };
}

/** POST /v1/bridge/build_tx */
export async function fetchBuildBridgeTx(params: {
  aggregator_id: string;
  bridge_id: string;
  user_addr: string;
  from_chain_id: string;
  from_token_id: string;
  from_token_raw_amount: string;
  to_chain_id: string;
  to_token_id: string;
  slippage: string;
  quote_key: string;
  should_approve?: boolean;
  approve_contract_id?: string;
  should_two_step_approve?: boolean;
}): Promise<{
  chainId: number;
  from: string;
  to: string;
  data: string;
  value: string;
  gasPrice?: string;
  gasLimit?: string;
}> {
  return apiPost('/bridge/build_tx', {
    ...params,
    from_chain_id: serverIdToNumericId(params.from_chain_id),
    to_chain_id: serverIdToNumericId(params.to_chain_id),
  });
}

/**
 * GET /v1/swap/gas_prices → GasLevel[]
 * Fetches gas prices from the Rampnow backend and maps them to the GasLevel
 * format expected by the MiniSign prefetch (slow / normal / fast).
 * chainNumericId: the numeric chain ID (e.g. 137 for Polygon).
 */
/** POST /v1/swap/deposit/submit — register a bridge tx and get its deposit_id */
export async function fetchSubmitDeposit(
  chainId: string,
  txHash: string
): Promise<{ deposit_id: string; status: string }> {
  const result = await submitDeposit({
    client: apiClient,
    body: { chain_id: chainId, tx_hash: txHash },
  });
  const raw = result.data as any;
  return raw?.data ?? raw;
}

export interface SwapStatusToken {
  address: string;
  chain_id: number;
  symbol: string;
  decimals: number;
  name?: string;
  logo_uri?: string;
}

export interface SwapStatusSide {
  tx_hash?: string;
  tx_link?: string;
  chain_id: number;
  amount: string;
  amount_usd?: string;
  token: SwapStatusToken;
  timestamp?: number;
}

export interface SwapStatusResponse {
  transaction_id: string;
  status: string;
  sub_status: string;
  sub_status_message?: string;
  sending?: SwapStatusSide;
  receiving?: SwapStatusSide | null;
}

/** GET /v1/swap/status — poll bridge/swap status by tx hash and chains */
export async function fetchDepositStatus(params: {
  txHash: string;
  fromChain?: string;
  toChain?: string;
}): Promise<SwapStatusResponse> {
  const result = await getSwapStatus({
    client: apiClient,
    query: {
      txHash: params.txHash,
      fromChain: params.fromChain,
      toChain: params.toChain,
    },
  });
  const raw = result.data as any;
  return raw?.data ?? raw;
}

export async function fetchRampnowGasMarket(
  chainNumericId: number
): Promise<GasLevel[]> {
  const result = await getSwapGasPrices({
    client: apiClient,
    query: { chains: String(chainNumericId) },
  });
  const raw = result.data as any;
  const chainData =
    raw?.data?.[String(chainNumericId)] ?? raw?.data?.[chainNumericId];
  if (!chainData) return [];

  // SwapChainGasPrice: { standard, fast, fastest, last_updated }
  const standard: number = chainData.standard || 0;
  const fast: number = chainData.fast || Math.floor(standard * 1.25);
  const slow: number = Math.floor(standard * 0.85);

  return [
    {
      level: 'slow',
      price: slow,
      front_tx_count: 0,
      estimated_seconds: 60,
      priority_price: null,
      base_fee: 0,
    },
    {
      level: 'normal',
      price: standard,
      front_tx_count: 0,
      estimated_seconds: 15,
      priority_price: null,
      base_fee: 0,
    },
    {
      level: 'fast',
      price: fast,
      front_tx_count: 0,
      estimated_seconds: 5,
      priority_price: null,
      base_fee: 0,
    },
  ];
}
