// ============================================================
// Rampnow Swap & Bridge API  —  Base URL: /v1
// All monetary amounts are strings (wei / decimal precision)
// ============================================================

// ─── Shared ──────────────────────────────────────────────────

export interface TokenItem {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  priceUSD: string;
}

export interface NativeToken {
  symbol: string;
  decimals: number;
  address: string;
  priceUSD: string;
}

export interface FeeInfo {
  raw_amount_hex_str: string;
  usd_value: string; // decimal string e.g. "0.42"
}

export interface BridgeAggregator {
  id: string;
  name: string;
  logo_url: string;
}

export interface BridgeInfo {
  id: string;
  name: string;
  logo_url: string;
}

export interface BridgeTokenItem {
  id: string;
  chain: string; // numeric chain-ID string e.g. "137"
  name: string;
  symbol: string;
  decimals: number;
  logo_url: string;
  price: number;
  amount: number;
}

export interface GasPriceTier {
  max_fee_per_gas: string; // wei
  max_priority_fee_per_gas: string; // wei
}

export interface ChainGasPrice {
  slow: GasPriceTier;
  standard: GasPriceTier;
  fast: GasPriceTier;
}

export type SwapStatus = 'NOT_FOUND' | 'PENDING' | 'DONE' | 'FAILED';
export type SwapSubStatus =
  | 'WAIT_SOURCE_CONFIRMATIONS'
  | 'BRIDGE_IN_PROGRESS'
  | 'WAIT_DESTINATION_TRANSACTION'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'REFUNDED';

// ─── Discovery ───────────────────────────────────────────────

export interface GetSwapChainsResponse {
  chains: {
    id: number;
    name: string;
    type: string;
    nativeToken: NativeToken;
    blockExplorerUrl: string;
    rpcUrl?: string;
  }[];
}

export interface GetSwapTokensResponse {
  tokens: Record<string, TokenItem[]>;
}

export interface GetSwapConnectionsResponse {
  connections: {
    from_chain_id: number;
    to_chain_id: number;
    from_tokens: TokenItem[];
    to_tokens: TokenItem[];
  }[];
}

export interface GetSwapToolsResponse {
  bridges: {
    key: string;
    name: string;
    logo_uri: string;
    supported_chains: number[];
  }[];
  exchanges: {
    key: string;
    name: string;
    logo_uri: string;
    supported_chains: number[];
  }[];
}

export interface GetSwapGasPricesResponse {
  gas_prices: Record<string, ChainGasPrice>;
}

export interface GetSwapBalancesResponse {
  balances: {
    chain_id: string;
    token_address: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
    balance_formatted: string;
    usd_value: string;
    logo_uri: string;
    native_token: boolean;
  }[];
}

// ─── Swap ────────────────────────────────────────────────────

export interface SwapToken {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  display_symbol: string | null;
  optimized_symbol: string;
  decimals: number;
  logo_url: string;
  protocol_id: string;
  price: number;
  price_24h_change: number;
  is_verified: boolean;
  is_core: boolean;
  is_wallet: boolean;
  is_suspicious: boolean;
  time_at: number | null;
  total_supply: number;
  credit_score: number;
}

export interface GetSwapQuoteResponse {
  pay_token: SwapToken;
  receive_token: SwapToken;
  receive_token_raw_amount: number;
  is_success: boolean;
  gas_used: number;
  dex_approve_to: string;
  dex_swap_to: string;
  dex_swap_calldata: string;
  is_wrapped: boolean;
  dex_fee_desc: string | null;
  gas_costs?: { amount: string; amount_usd: number }[];
  fee_costs?: {
    name: string;
    amount: string;
    amount_usd: number;
    percentage: string;
  }[];
  execution_duration?: number;
}

export interface HypermidToken {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  coinKey: string;
  logoURI: string;
  priceUSD: string;
  tags: string[];
  verificationStatus: string;
}

export interface HypermidEstimate {
  tool: string;
  fromAmount: string;
  fromAmountUSD: string;
  toAmount: string;
  toAmountUSD: string;
  toAmountMin: string;
  approvalAddress: string;
  gasCosts: {
    type: string;
    price: string;
    estimate: string;
    limit: string;
    amount: string;
    amountUSD: string;
    token: HypermidToken;
  }[];
  feeCosts: {
    name: string;
    description: string;
    amount: string;
    amountUSD: string;
    percentage: string;
    included: boolean;
    token: HypermidToken;
  }[];
  executionDuration: number;
}

export interface HypermidTransactionRequest {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  chainId: number;
  from: string;
}

export interface GetSwapQuoteV2Response {
  id: string;
  type: string;
  tool: string;
  toolDetails: { key: string; name: string; logoURI: string };
  action: {
    fromChainId: number;
    toChainId: number;
    fromToken: HypermidToken;
    toToken: HypermidToken;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
    slippage: string;
  };
  estimate: HypermidEstimate;
  transactionRequest: HypermidTransactionRequest;
  provider: string;
  feeBps: number;
  feeBreakdown: { hypermidBps: number; partnerBps: number; totalBps: number };
  isDryQuote: boolean;
  swapRef: string;
}

export interface RouteStep {
  id: string;
  type: string;
  tool: string;
  toolDetails: { key: string; name: string; logoURI: string };
  estimate: HypermidEstimate;
}

export type GetSwapRoutesResponse = {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromAmount: string;
  fromAmountUSD: string;
  toAmount: string;
  toAmountUSD: string;
  toAmountMin: string;
  fromToken: HypermidToken;
  toToken: HypermidToken;
  fromAddress: string;
  toAddress: string;
  gasCostUSD: string;
  containsSwitchChain: boolean;
  steps: RouteStep[];
  tags: string[];
  integrator: string;
  executionType: string;
}[];

export interface ExecuteSwapRequest {
  route_id: string;
  from_address: string;
  tx_hash?: string;
}

export interface ExecuteSwapResponse {
  transaction_hash: string;
  status: string;
}

export interface GetSwapStatusResponse {
  transaction_id: string;
  status: SwapStatus;
  sub_status?: SwapSubStatus;
  sending?: { tx_hash: string; chain_id: number; status: string };
  receiving?: { tx_hash: string; chain_id: number; status: string };
}

export interface RegisterInboundReceiverRequest {
  chain_id: string;
  address: string;
  token_address?: string;
}

export interface RegisterInboundReceiverResponse {
  receiver_id: string;
  status: string;
}

export interface SubmitDepositRequest {
  chain_id: string;
  tx_hash: string;
}

export interface SubmitDepositResponse {
  deposit_id: string;
  status: string;
}

export interface GetDepositStatusResponse {
  deposit_id: string;
  status: string;
  tx_hash?: string;
}

// ─── Bridge ──────────────────────────────────────────────────

export interface BridgeQuote {
  aggregator: BridgeAggregator;
  bridge_id: string;
  bridge: BridgeInfo;
  to_token_raw_amount: string;
  to_token_raw_amount_hex_str: string;
  to_token_amount: string;
  protocol_fee: FeeInfo;
  rabby_fee: FeeInfo;
  gas_fee: FeeInfo;
  approve_contract_id: string | null;
  duration: number;
  quote_key: {
    to_token_raw_amount: string;
    approve_contract_id: string;
  };
}

export interface GetBridgeQuoteListResponse {
  quotes: BridgeQuote[];
}

// Raw array — no wrapper object
export type GetBridgeQuoteV2Response = {
  aggregator: BridgeAggregator;
  bridge_id: string;
  bridge: BridgeInfo;
  to_token_amount: string;
  to_token_raw_amount: string;
  to_token_raw_amount_hex_str: string;
  gas_fee: FeeInfo;
  protocol_fee: FeeInfo;
  rabby_fee: FeeInfo;
  duration: number;
  routePath: string;
  approve_contract_id: string;
  quote_key: Record<string, unknown>;
}[];

export interface BuildBridgeTxRequest {
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
}

export interface BuildBridgeTxResponse {
  chainId: number;
  from: string;
  to: string;
  data: string;
  value: string;
  gasPrice?: string;
  gasLimit?: string;
}

export interface GetRecommendBridgeToChainResponse {
  to_chain_id: string;
}

export interface GetBridgeHistoryListResponse {
  total_cnt: number;
  history_list: {
    aggregator: BridgeAggregator;
    bridge: BridgeInfo;
    from_token: BridgeTokenItem;
    to_token: BridgeTokenItem;
    status: string;
    create_at: number;
    detail_url: string;
  }[];
}

// Raw array — no wrapper object
export type GetIsSameBridgeTokenResponse = {
  is_same: boolean;
  aggregator_id: string;
}[];

export interface GetSuggestSlippageResponse {
  suggest_slippage: number;
}

export interface GetRecommendFromTokenResponse {
  token_list: BridgeTokenItem[];
}
