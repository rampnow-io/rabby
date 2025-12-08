import { type ChainAdapter } from "@reown/appkit"
import { BitcoinAdapter } from "@reown/appkit-adapter-bitcoin"
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  base,
  baseSepolia,
  bitcoin,
  bsc,
  celo,
  ChainNamespace,
  eos,
  lumiaMainnet,
  mainnet,
  near,
  optimism,
  optimismSepolia,
  polygon,
  pulsechain,
  ronin,
  sepolia,
  solana,
  solanaDevnet,
  solanaTestnet,
  tron,
  type AppKitNetwork,
} from "@reown/appkit/networks"

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? ""

export const evmChainNamespace: ChainNamespace = "eip155"
export const svmChainNamespace: ChainNamespace = "solana"
export const btcChainNamespace: ChainNamespace = "bip122"

export const svmNetworks: AppKitNetwork[] = [
  solana,
  // Testnets
  solanaDevnet,
  solanaTestnet,
]
export const bitcoinNetworks: AppKitNetwork[] = [bitcoin]
export const evmNetworks: AppKitNetwork[] = [
  arbitrum,
  avalanche,
  base,
  bsc,
  celo,
  eos,
  lumiaMainnet,
  mainnet,
  near,
  optimism,
  polygon,
  pulsechain,
  ronin,
  tron,
  // Testnets
  baseSepolia,
  sepolia,
  arbitrumSepolia,
  optimismSepolia,
]

export const allNetworks = [
  ...evmNetworks,
  ...svmNetworks,
  ...bitcoinNetworks,
] as [AppKitNetwork, ...AppKitNetwork[]]

export function getChainAdapters(
  projectId: string,
): ChainAdapter[] | undefined {
  const wagmiAdapter = getWagmiAdapter(projectId)
  const bitcoinAdapter = new BitcoinAdapter({ projectId })
  const solanaAdapter = new SolanaAdapter({})

  return [wagmiAdapter, bitcoinAdapter, solanaAdapter]
}

export function getWagmiAdapter(projectId: string): WagmiAdapter {
  return new WagmiAdapter({ networks: allNetworks, projectId })
}
