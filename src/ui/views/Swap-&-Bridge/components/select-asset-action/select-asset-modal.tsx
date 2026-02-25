"use client"

import { Image, Input, TooltipView } from "@repo/ui/primitives"
import {
  type AssetConfig,
  ChainConfig,
  ChainConfigMap,
  cn,
  CurrencyConfigMap,
  getTokenCode,
  pluckUnique,
  truncate,
} from "@repo/utils"
import { Search, X } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"


import { BottomDrawer } from "@repo/ui"
import { NetSwitchTabsKey, useSwitchNetTab } from "@/ui/component/PillsSwitch/NetSwitchTabs"
import { Chain, CHAINS_ENUM } from "@/types/chain"
import { findChainByEnum, varyAndSortChainItems } from "@/utils/chain"
import { useRabbyDispatch, useRabbyGetter, useRabbySelector } from '@/ui/store';
import { TokenItem } from "@rabby-wallet/rabby-api/dist/types"
import { useWallet } from "@/ui/utils"
import { useAsync } from "react-use"
import BigNumber from "bignumber.js"

import { SelectChainListProps } from "@/ui/component/ChainSelector/components/SelectChainList"
import { useCurrentAccount } from "@/ui/hooks/backgroundState/useAccount"

interface SelectAssetModalProps {
  rootSelector?: string
  title: string
  onSelect?: (assetConfig: AssetConfig) => void
  onChainChange?: (chain: CHAINS_ENUM) => void
  onTokenChange?: (token: TokenItem) => void
  close: () => void
  selectionType?: 'from' | 'to'
  fromChain?: CHAINS_ENUM
  fromToken?: TokenItem
}

interface ChainListProps {
  chainConfigs: CHAINS_ENUM
  heading?: string
  label?: React.ReactNode
  onSelect: (v: string | undefined) => void
}

interface AssetListProps {
  assets: TokenItem[]
  onChainChange?: (chain: CHAINS_ENUM) => void
  onTokenChange?: (token: TokenItem) => void
  close?: () => void
}

export default function SelectAssetModal({
  rootSelector,
  title,
  onChainChange,
  onTokenChange,
  close,
  selectionType = 'from',
  fromChain,
  fromToken,
}: SelectAssetModalProps) {
  const [assetSearch, setAssetSearch] = useState<string>()
  const [chainSearch, setChainSearch] = useState<string>()
  const [selectedChain, setSelectedChain] = useState<CHAINS_ENUM | undefined>()

  const wallet = useWallet()
  const currentAccount = useCurrentAccount()
  const allSupportedChains = useRabbySelector((s) => s.bridge.supportedChains)

  const skipChainSelector = false

  // Keep chain selection aligned with Bridge behavior: no pre-filtering by assets.
  const supportedChains = useMemo(() => {
    return allSupportedChains
  }, [allSupportedChains])

  // Auto-select first available destination chain when "to" modal opens
  useEffect(() => {
    if (selectionType === 'to' && supportedChains.length > 0 && !selectedChain) {
      setSelectedChain(supportedChains[0])
    }
  }, [selectionType, supportedChains, selectedChain])

  // Fetch tokens for the selected chain
  const { value: tokens = [] as TokenItem[], loading: tokensLoading } = useAsync(async () => {
    if (!selectedChain || !currentAccount?.address) {
      return []
    }
    const chainObj = findChainByEnum(selectedChain)
    if (!chainObj?.serverId) return []
    
    try {
      // For "to" selection: use getBridgeToTokenList to get only route-available tokens
      if (selectionType === 'to' && fromChain && fromToken) {
        const fromChainObj = findChainByEnum(fromChain)
        if (!fromChainObj?.serverId) return []
        
        const list = await wallet.openapi.getBridgeToTokenList({
          from_chain_id: fromChainObj.serverId,
          from_token_id: fromToken.id,
          to_chain_id: chainObj.serverId,
          q: assetSearch || '',
        })
        return list?.token_list || []
      } else {
        // For "from" selection: use listToken to show all user tokens
        const tokenList = await wallet.openapi.listToken(
          currentAccount.address,
          chainObj.serverId
        )
        return tokenList || []
      }
    } catch (e) {
      console.error('Failed to fetch tokens:', e)
      return []
    }
  }, [selectedChain, currentAccount?.address, wallet, selectionType, fromChain, fromToken, assetSearch])

  // Filter and sort tokens by search and liquidity (balance > 0 for 'from' only)
  const filteredTokens = useMemo(() => {
    // First filter by balance requirement
    let baseTokens = selectionType === 'from' 
      ? tokens.filter((t) => new BigNumber(t.raw_amount_hex_str || 0, 16).gt(0))
      : tokens

    // Then apply search filter if keyword exists
    if (assetSearch && assetSearch.trim()) {
      const search = assetSearch.toLowerCase().trim()
      baseTokens = baseTokens.filter((t) => 
        t.symbol?.toLowerCase().includes(search) ||
        t.name?.toLowerCase().includes(search) ||
        t.id?.toLowerCase().includes(search)
      )
    }

    // Sort tokens
    if (selectionType === 'from') {
      // For 'from': sort by balance (highest first)
      baseTokens.sort((a, b) => {
        const balanceA = new BigNumber(a.raw_amount_hex_str || 0, 16)
        const balanceB = new BigNumber(b.raw_amount_hex_str || 0, 16)
        return balanceB.minus(balanceA).toNumber()
      })
    } else {
      // For 'to': sort by popularity/common tokens first (those with price data)
      baseTokens.sort((a, b) => {
        const priceA = a.price ? 1 : 0
        const priceB = b.price ? 1 : 0
        return priceB - priceA
      })
    }

    return baseTokens
  }, [tokens, assetSearch, selectionType])

  const onSelectHandler = (token: TokenItem) => {
    if (onChainChange && selectedChain) {
      onChainChange(selectedChain)
    }
    if (onTokenChange) {
      onTokenChange(token)
    }
    close()
  }

  return (
    <BottomDrawer secondaryAnimation rootSelector={rootSelector} close={close}>
      <div className='flex flex-col h-full overflow-hidden p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='text-xl font-semibold'>{title}</div>
          <X className='cursor-pointer' size={24} onClick={close} />
        </div>
        <div
          className={cn(
            "grid gap-3 flex-1 min-h-0",
            !skipChainSelector ? "grid-cols-[1.1fr_1.5fr]" : "grid-cols-1",
          )}
        >
          {!skipChainSelector && (
            <div className='flex flex-col gap-4 overflow-hidden h-full min-h-0'>
              <Input
                iconLeft={<Search className='h-5 w-5' />}
                type='text'
                placeholder='Chain'
                autoFocus
                value={chainSearch}
                onChange={(e) => setChainSearch(e.target.value)}
              />
              <div className='flex-1 overflow-y-auto min-h-0'>
                <ChainListSelector
                  chains={supportedChains}
                  selectedChain={selectedChain}
                  searchKeyword={chainSearch}
                  onSelect={(chain) => {
                    setSelectedChain(chain)
                    if (onChainChange && chain) {
                      onChainChange(chain)
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div className='flex flex-col gap-4 overflow-hidden h-full min-h-0'>
            <Input
              iconLeft={<Search className='h-5 w-5' />}
              type='text'
              placeholder='Currency'
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
            />
            <div className='flex-1 overflow-y-auto min-h-0 pr-2'>
              {tokensLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-sm text-gray-500'>Loading tokens...</div>
                </div>
              ) : (
                <AssetList 
                  assets={filteredTokens} 
                  onChainChange={onChainChange} 
                  onTokenChange={onTokenChange} 
                  close={close} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </BottomDrawer>
  )
}

function ListItem({
  children,
  disabled,
  isSelected,
  tooltipContent,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  isSelected?: boolean
  tooltipContent?: string
  onClick: () => void
}) {
  return (
    <TooltipView
      content={tooltipContent}
      className='w-full flex'
      variant='dark'
    >
      <div
        className={cn(
          "w-full flex items-center gap-3 p-3.5 rounded-lg hover:bg-gray-100 transition justify-start",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          { "bg-gray-100": isSelected },
        )}
        onClick={onClick}
      >
        {children}
      </div>
    </TooltipView>
  )
}

const ChainListSelector = ({
  chains,
  selectedChain,
  searchKeyword,
  onSelect,
}: {
  chains: CHAINS_ENUM[]
  selectedChain?: CHAINS_ENUM
  searchKeyword?: string
  onSelect: (chain: CHAINS_ENUM) => void
}) => {
  const filteredChains = useMemo(() => {
    if (!searchKeyword) return chains
    const search = searchKeyword.toLowerCase().trim()
    return chains.filter((chainEnum) => {
      const chainObj = findChainByEnum(chainEnum)
      return chainObj?.name?.toLowerCase().includes(search)
    })
  }, [chains, searchKeyword])

  return (
    <div className='overflow-auto'>
      {filteredChains.map((chainEnum) => {
        const chainObj = findChainByEnum(chainEnum)
        if (!chainObj) return null
        
        return (
          <ListItem
            key={chainEnum}
            isSelected={selectedChain === chainEnum}
            onClick={() => onSelect(chainEnum)}
            tooltipContent={chainObj.name}
          >
            <img
              src={chainObj.logo}
              alt={chainObj.name}
              height={32}
              width={32}
              className='w-8 h-8 rounded-full'
            />
            <span className='font-medium text-base truncate'>{chainObj.name}</span>
          </ListItem>
        )
      })}
    </div>
  )
}

const AssetList = ({ assets, onChainChange, onTokenChange, close }: AssetListProps) => {
  const handleAssetSelect = (token: TokenItem) => {
    if (onTokenChange) {
      onTokenChange(token)
    }
    if (close) {
      close()
    }
  }

  // Helper to format balance
  const formatBalance = (token: TokenItem): string => {
    if (!token.raw_amount_hex_str) return '0'
    try {
      const balanceBN = new BigNumber(token.raw_amount_hex_str, 16)
      const decimals = token.decimals || 0
      const formatted = balanceBN.div(10 ** decimals).toFixed(4)
      return formatted
    } catch (e) {
      return '0'
    }
  }

  // Helper to format price
  const formatPrice = (price: number | undefined): string => {
    if (!price) return '$0.00'
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toFixed(4)}`
  }

  // Helper to determine liquidity badge based on token properties
  const getLiquidityBadge = (token: TokenItem): { label: string; color: string } => {
    // In a real implementation, you would check token.is_verified, token.is_suspicious, or real liquidity data
    // For now, assume tokens with a price have higher liquidity
    if (token.price && token.price > 0) {
      return { label: 'High liquidity', color: 'bg-green-100 text-green-700' }
    }
    return { label: '', color: '' }
  }

  // Helper to get price change percentage
  const getPriceChange = (token: TokenItem): { value: number; color: string } | null => {
    // Note: TokenItem may not have price_24h_change property
    // This is for reference if you need to display it from a different data source
    return null
  }

  // Helper to get price in USD
  const getPriceUsd = (token: TokenItem, balance: string): string => {
    if (!token.price) return '$0.00'
    const balanceNum = parseFloat(balance) || 0
    const usdValue = balanceNum * token.price
    return `$${usdValue.toFixed(2)}`
  }
  
  return (
    <div className='overflow-auto'>
      {assets && assets.length > 0 ? (
        assets.map((token) => {
          const balance = formatBalance(token)
          const liquidityBadge = getLiquidityBadge(token)
          const priceUsd = getPriceUsd(token, balance)

          return (
            <div
              key={token.id}
              onClick={() => handleAssetSelect(token)}
              className='px-3 py-4 mb-2 rounded-lg bg-white border border-gray-100 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors'
            >
              <div className='flex items-start gap-3'>
                {/* Token Logo */}
                <div className='relative flex-shrink-0'>
                  <img
                    src={token.logo_url}
                    alt={token.symbol}
                    className='w-10 h-10 rounded-full'
                  />
                </div>

                {/* Token Info - Left Side */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='font-semibold text-sm text-gray-900'>
                      {token.symbol}
                    </span>
                    {/* Exchange Indicators */}
                    <div className='flex items-center gap-1'>
                      {/* Placeholder for exchange icons */}
                      <span className='text-xs text-gray-400'>+25</span>
                    </div>
                  </div>

                  {/* Liquidity Badge */}
                  {liquidityBadge.label && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${liquidityBadge.color}`}>
                      {liquidityBadge.label}
                    </span>
                  )}

                  {/* Price Info */}
                  <div className='mt-1 text-xs text-gray-600'>
                    <span>@{formatPrice(token.price)}</span>
                  </div>
                </div>

                {/* Balance & USD Value - Right Side */}
                <div className='text-right flex-shrink-0'>
                  <div className='font-semibold text-sm text-gray-900 mb-1'>
                    {balance}
                  </div>
                  <div className='text-xs text-gray-600'>
                    {priceUsd}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      ) : (
        <div className='p-4 text-center text-gray-500 text-sm'>
          No tokens available
        </div>
      )}
    </div>
  )
}


