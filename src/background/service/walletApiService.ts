import { INITIAL_WALLET_API_URL } from '@/constant';
import { findChain, findChainByID } from '@/utils/chain';
import type {
  BuildBridgeTxResponse,
  ExecuteSwapResponse,
  GetSwapChainsResponse,
  GetSwapQuoteResponse,
  GetSwapToolsResponse,
  GetSwapRoutesResponse,
  GetSwapStatusResponse,
  GetRecommendBridgeToChainResponse,
  GetIsSameBridgeTokenResponse,
  GetSuggestSlippageResponse,
  GetRecommendFromTokenResponse,
} from './hypermid.types';

const BASE_URL = `${INITIAL_WALLET_API_URL}/v1`;
const API_KEY = process.env.RAMPNOW_API_KEY || '';

// ─── Exported types used by UI models ────────────────────────────────────────

export interface BridgeAggregator {
  id: string;
  name: string;
  logo_url: string;
  bridge_list: { id: string; name: string; logo_url: string }[];
}

/** Bridge quote as returned by Hypermid API, ready for UI consumption */
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

/** Bridge token item with chain ID already normalised to Rabby serverId */
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

/** A single history entry returned by getBridgeHistoryList (chain IDs normalised) */
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

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function get<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString(), {
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hypermid API ${res.status}: ${text}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hypermid API ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Chain ID helpers ─────────────────────────────────────────────────────────

/** Rabby serverId ("eth", "matic") → Hypermid numeric string ("1", "137") */
function serverIdToNumericId(serverId: string): string {
  return findChain({ serverId })?.id?.toString() || serverId;
}

/** Hypermid numeric string ("137") → Rabby serverId ("matic") */
function numericIdToServerId(numericId: string | number): string {
  return findChainByID(Number(numericId))?.serverId || String(numericId);
}

/** Map Hypermid FeeInfo.usd_value (string) to number expected by Rabby types */
function feeUsd(feeInfo?: { usd_value: string } | null): number {
  return parseFloat(feeInfo?.usd_value ?? '0') || 0;
}

// ─── HypermidApiService ───────────────────────────────────────────────────────

class HypermidApiService {
  // ── Discovery ───────────────────────────────────────────────────────────────

  /** GET /v1/swap/tools → aggregator + exchange list */
  async getBridgeAggregatorList(): Promise<BridgeAggregator[]> {
    const data = await get<GetSwapToolsResponse>('/swap/tools');

    return (data.bridges || []).map(
      (b): BridgeAggregator => ({
        id: b.key,
        name: b.name,
        logo_url: b.logo_uri || '',
        bridge_list: [],
      })
    );
  }

  /** GET /v1/swap/chains → list of supported chain server-IDs */
  async getBridgeSupportChainV2(): Promise<string[]> {
    const data = await get<GetSwapChainsResponse>('/swap/chains');

    return (data.chains || [])
      .map((c) => numericIdToServerId(c.id))
      .filter(Boolean);
  }

  // ── Swap ─────────────────────────────────────────────────────────────────────

  /**
   * GET /v1/swap/dex_quote — single-chain DEX swap quote.
   * Accepts Rabby-format params; chain_id is converted to numeric for API.
   */
  async getSwapQuote(params: {
    id: string;
    chain_id: string;
    dex_id: string;
    pay_token_id: string;
    pay_token_raw_amount: string;
    receive_token_id: string;
    slippage: number;
    fee?: boolean;
    no_pre_exec?: boolean;
  }): Promise<GetSwapQuoteResponse> {
    const wrapped = await get<{ code: number; data: GetSwapQuoteResponse; message: string; traceId: string }>(
      '/swap/dex_quote',
      {
        id: params.id,
        chain_id: serverIdToNumericId(params.chain_id),
        dex_id: params.dex_id,
        pay_token_id: params.pay_token_id,
        pay_token_raw_amount: params.pay_token_raw_amount,
        receive_token_id: params.receive_token_id,
        slippage: params.slippage,
        ...(params.fee ? { fee: true } : {}),
        ...(params.no_pre_exec ? { no_pre_exec: true } : {}),
      }
    );
    return wrapped.data;
  }

  // ── Bridge ───────────────────────────────────────────────────────────────────

  /**
   * GET /v1/swap/routes → cross-chain routes.
   * Returns multiple routes which are mapped to HypermidBridgeQuoteBase[] for UI consumption.
   * Maintains backwards compatibility with the old getBridgeQuoteV2 interface.
   *
   * Note: The new API returns all available routes without aggregator_id filtering.
   * If aggregator_id is provided, results are filtered by tool key.
   */
  async getBridgeQuoteV2(params: {
    aggregator_id?: string;
    user_addr: string;
    from_chain_id: string; // Rabby serverId e.g. "eth"
    from_token_id: string;
    from_token_raw_amount: string;
    to_chain_id: string; // Rabby serverId e.g. "matic"
    to_token_id: string;
    slippage: string;
  }): Promise<HypermidBridgeQuoteBase[]> {
    const routes = await get<GetSwapRoutesResponse>('/swap/routes', {
      fromChain: serverIdToNumericId(params.from_chain_id),
      toChain: serverIdToNumericId(params.to_chain_id),
      fromToken: params.from_token_id,
      toToken: params.to_token_id,
      fromAmount: params.from_token_raw_amount,
      fromAddress: params.user_addr,
      slippage: parseFloat(params.slippage),
    });

    // Filter by aggregator_id if provided (map to tool key in the new API)
    let filteredRoutes = routes;
    if (params.aggregator_id) {
      filteredRoutes = routes.filter(
        (r) => r.steps?.[0]?.toolDetails?.key === params.aggregator_id
      );
    }

    // Map new route format to old HypermidBridgeQuoteBase format
    return filteredRoutes.map((route) => {
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
        protocol_fee: { usd_value: 0 }, // Not provided in new API
        rabby_fee: { usd_value: 0 }, // Not provided in new API
        approve_contract_id: firstStep?.estimate?.approvalAddress || '',
        duration: firstStep?.estimate?.executionDuration || 0,
        // Store route data for later use in buildBridgeTx
        // Include route.id for execute endpoint, and other params for reconstruction
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
    });
  }

  /** POST /v1/swap/execute → execute a route and get transaction result */
  async buildBridgeTx(params: {
    aggregator_id: string;
    bridge_id: string;
    user_addr: string;
    from_chain_id: string;
    from_token_id: string;
    from_token_raw_amount: string;
    to_chain_id: string;
    to_token_id: string;
    slippage: string;
    quote_key: string; // JSON-stringified quote_key from getBridgeQuoteV2
  }): Promise<BuildBridgeTxResponse> {
    let routeId = '';
    let fromAddress = params.user_addr;
    let toChainId = params.to_chain_id;

    // Extract route_id and other data from quote_key
    try {
      const parsed =
        typeof params.quote_key === 'string'
          ? JSON.parse(params.quote_key)
          : params.quote_key;
      routeId = parsed.route_id || '';
      fromAddress = parsed.from_address || params.user_addr;
      toChainId = parsed.to_chain_id || params.to_chain_id;
    } catch (e) {
      // If parsing fails, use defaults
      routeId = params.quote_key || '';
    }

    // Call /swap/execute endpoint
    const response = await post<ExecuteSwapResponse>('/swap/execute', {
      route_id: routeId,
      from_address: fromAddress,
    });

    // The new API returns transaction hash and status
    // Map ExecuteSwapResponse to BuildBridgeTxResponse format for UI compatibility
    // Note: The new API handles transaction building/execution differently
    // We return the transaction hash as part of the response
    const toChainNumericId = serverIdToNumericId(toChainId);

    return {
      chainId: parseInt(toChainNumericId) || 137,
      from: fromAddress,
      to: '', // Not provided by execute endpoint
      data: response.transaction_hash || '', // Use tx hash as data placeholder
      value: params.from_token_raw_amount,
      gasPrice: undefined,
      gasLimit: undefined,
    };
  }

  /** Bridge history (backwards compatibility stub - new API doesn't provide this) */
  async getBridgeHistoryList(params: {
    user_addr: string;
    start: number;
    limit: number;
    is_all?: boolean;
  }): Promise<{
    total_cnt: number;
    history_list: HypermidBridgeHistoryItem[];
  }> {
    // New API doesn't provide history list endpoint
    // Return empty list to maintain backwards compatibility
    return {
      total_cnt: 0,
      history_list: [],
    };
  }

  /** Recommend destination chain (backwards compatibility stub) */
  async getRecommendBridgeToChain(params: {
    from_chain_id: string; // Rabby serverId
  }): Promise<GetRecommendBridgeToChainResponse> {
    // New API doesn't provide chain recommendation
    // Return a reasonable default
    const recommendedChainId = findChain({ serverId: 'matic' })?.id;
    return {
      to_chain_id: recommendedChainId?.toString() || '137',
    };
  }

  /** Check if token is the same on both chains (backwards compatibility stub) */
  async isSameBridgeToken(params: {
    from_chain_id: string;
    from_token_id: string;
    to_chain_id: string;
    to_token_id: string;
  }): Promise<GetIsSameBridgeTokenResponse> {
    // New API doesn't provide this check
    // Assume tokens with same address are the same
    const isSame = params.from_token_id === params.to_token_id;
    return [{ is_same: isSame, aggregator_id: '' }];
  }

  /** Suggest slippage value (backwards compatibility stub) */
  async suggestSlippage(params: {
    chain_id: string;
    slippage: string;
    from_token_id: string;
    to_token_id: string;
    from_token_amount: string;
  }): Promise<GetSuggestSlippageResponse> {
    // New API doesn't provide slippage suggestions
    // Return provided slippage or default to 0.5%
    const slippageNum = parseFloat(params.slippage) || 0.5;
    return {
      suggest_slippage: slippageNum,
    };
  }

  /** Recommend alternative source token (backwards compatibility stub) */
  async getRecommendFromToken(params: {
    user_addr: string;
    from_chain_id: string;
    from_token_id: string;
    from_token_amount: string;
    to_chain_id: string;
    to_token_id: string;
  }): Promise<{ token_list: HypermidBridgeTokenItem[] }> {
    // New API doesn't provide token recommendations
    // Return empty list - UI will handle gracefully
    return {
      token_list: [],
    };
  }
}

export const hypermidApiService = new HypermidApiService();

/**
 * Minimal adapter for @rabby-wallet/rabby-swap's getQuote(dexId, params, api).
 * The library only calls api.getSwapQuote — route it through hypermidApiService
 * so it uses X-API-Key auth instead of Rabby's WebSignApiPlugin.
 */
export const swapQuoteApiAdapter = {
  getSwapQuote: hypermidApiService.getSwapQuote.bind(hypermidApiService),
};
