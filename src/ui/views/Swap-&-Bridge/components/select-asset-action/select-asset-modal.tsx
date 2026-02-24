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

import { SelectChainListProps } from "@/ui/component/ChainSelector/components/SelectChainList"
import { useCurrentAccount } from "@/ui/hooks/backgroundState/useAccount"

interface SelectAssetModalProps {
  rootSelector?: string
  title: string
  onSelect?: (assetConfig: AssetConfig) => void
  onChainChange?: (chain: CHAINS_ENUM) => void
  onTokenChange?: (token: TokenItem) => void
  close: () => void
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
}: SelectAssetModalProps) {
  const [assetSearch, setAssetSearch] = useState<string>()
  const [chainSearch, setChainSearch] = useState<string>()
  const [selectedChain, setSelectedChain] = useState<CHAINS_ENUM | undefined>()

  const wallet = useWallet()
  const currentAccount = useCurrentAccount()
  const supportedChains = useRabbySelector((s) => s.bridge.supportedChains)

  const skipChainSelector = false

  // Fetch tokens for the selected chain
  const { value: tokens = [] as TokenItem[] } = useAsync(async () => {
    if (!selectedChain || !currentAccount?.address) {
      return []
    }
    const chainObj = findChainByEnum(selectedChain)
    if (!chainObj?.serverId) return []
    
    try {
      const tokenList = await wallet.openapi.listToken(
        currentAccount.address,
        chainObj.serverId
      )
      return tokenList || []
    } catch (e) {
      console.error('Failed to fetch tokens:', e)
      return []
    }
  }, [selectedChain, currentAccount?.address, wallet])

  // Filter tokens by search
  const filteredTokens = useMemo(() => {
    if (!assetSearch) return tokens
    const search = assetSearch.toLowerCase().trim()
    return tokens.filter((t) => 
      t.symbol?.toLowerCase().includes(search) ||
      t.name?.toLowerCase().includes(search) ||
      t.id?.toLowerCase().includes(search)
    )
  }, [tokens, assetSearch])

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
            "grid gap-3 overflow-auto",
            !skipChainSelector ? "grid-cols-[1.1fr_1.5fr]" : "grid-cols-1",
          )}
        >
          {!skipChainSelector && (
            <div className='flex flex-col gap-4 overflow-hidden'>
              <Input
                iconLeft={<Search className='h-5 w-5' />}
                type='text'
                placeholder='Chain'
                autoFocus
                value={chainSearch}
                onChange={(e) => setChainSearch(e.target.value)}
              />
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
          )}

          <div className='flex flex-col gap-4 overflow-hidden'>
            <Input
              iconLeft={<Search className='h-5 w-5' />}
              type='text'
              placeholder='Currency'
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
            />
            <AssetList assets={filteredTokens} onChainChange={onChainChange} onTokenChange={onTokenChange} close={close} />
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
  
  return (
    <div className='overflow-auto'>
      {assets.map((token) => {
        return (
          <ListItem
            key={token.id}
            onClick={() => handleAssetSelect(token)}
            tooltipContent={token.name}
          >
            <img
              src={token.logo_url}
              alt={token.symbol}
              height={32}
              width={32}
              className='w-8 h-8 rounded-full'
            />
            <div className='flex flex-col text-justify items-start gap-y-1'>
              <span className='font-medium block truncate text-base/[100%]'>
                {token.symbol}
              </span>
              <div className='flex items-center truncate gap-1 text-xs text-gray-500'>
                <span>{token.name}</span>
              </div>
            </div>
          </ListItem>
        )
      })}
    </div>
  )
}


