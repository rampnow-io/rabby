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
import React, { useState } from "react"
import BottomDrawer from "../bottom-drawer"
import {
  getFilteredCurrencies as getFilteredAssets,
  getFilteredChains,
} from "./utils"

interface SelectAssetModalProps {
  rootSelector?: string
  title: string
  assetConfigMap: Record<string, AssetConfig>
  onSelect?: (assetConfig: AssetConfig) => void
  close: () => void
}

interface ChainListProps {
  chainConfigs: ChainConfig[]
  heading?: string
  label?: React.ReactNode
  onSelect: (v: string | undefined) => void
}

interface AssetListProps {
  assets: AssetConfig[]
  onSelect: (assetConfig: AssetConfig) => void
}

export default function SelectAssetModal({
  rootSelector,
  title,
  assetConfigMap,
  onSelect,
  close,
}: SelectAssetModalProps) {
  const assetConfigs = Object.values(assetConfigMap)
  const [assetSearch, setAssetSearch] = useState<string>()
  const [chainSearch, setChainSearch] = useState<string>()
  const [selectedChain, setSelectedChain] = useState<string>()

  const chains = pluckUnique(assetConfigMap, "chain")
  const skipChainSelector = chains.length <= 1
  const chainConfigs = Object.values(chains).map(
    (chain) => ChainConfigMap[chain],
  )

  const fChainConfigs = getFilteredChains(chainConfigs, chainSearch)
  const fassetConfigs = getFilteredAssets(
    assetConfigs,
    assetSearch,
    selectedChain,
  )

  const onSelectHandler = (assetConfig: AssetConfig) => {
    if (assetConfig.disabled) {
      return
    }

    close()
    onSelect?.(assetConfig)
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
              <ChainList
                chainConfigs={fChainConfigs}
                chain={selectedChain}
                onSelect={setSelectedChain}
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
            <AssetList assets={fassetConfigs} onSelect={onSelectHandler} />
          </div>
        </div>
      </div>
    </BottomDrawer>
  )
}

const ChainList = ({
  chainConfigs,
  chain,
  onSelect,
}: {
  chainConfigs: ChainConfig[]
  chain?: string
  onSelect: (v: string | undefined) => void
}) => {
  const sortedChainConfigs = chainConfigs.sort(
    (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
  )

  return (
    <div className='flex flex-col overflow-hidden pr-2'>
      <div className='overflow-auto'>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 mb-1",
            { "bg-gray-100": !chain },
          )}
          onClick={() => onSelect(undefined)}
        >
          <Image
            src='/image/icon/chain/all-chains.svg'
            alt='all-chains'
            height={32}
            width={32}
            className='w-8 h-8'
          />
          <span className='font-medium text-base'>All Chains</span>
        </div>

        {renderChainList({ chainConfigs: sortedChainConfigs, onSelect })}
      </div>
    </div>
  )
}

const renderChainList = ({
  chainConfigs,
  heading,
  label,
  onSelect,
}: ChainListProps): React.ReactNode => {
  if (chainConfigs.length === 0) {
    return null
  }

  return (
    <>
      {heading && (
        <div className='flex items-center gap-2 text-sm font-medium py-2 pl-3'>
          {label}
          <span>{heading}</span>
        </div>
      )}
      {chainConfigs.map((config) => (
        <ListItem
          key={config.code}
          onClick={() => onSelect(config.code)}
          tooltipContent={config.name}
        >
          <Image
            src={config.image}
            alt={config.name}
            height={32}
            width={32}
            className='w-8 h-8 rounded-full'
          />
          <span className='font-medium text-base truncate'>{config.name}</span>
        </ListItem>
      ))}
    </>
  )
}

const AssetList = ({ assets, onSelect }: AssetListProps) => (
  <div className='overflow-auto'>
    {assets.map((assetConfig) => {
      const currencyConfig = CurrencyConfigMap[assetConfig.currency]
      const chainConfig = ChainConfigMap[assetConfig.chain]

      return (
        <ListItem
          key={assetConfig.code}
          onClick={() => !assetConfig.disabled && onSelect(assetConfig)}
          tooltipContent={
            truncate(assetConfig.contractAddress, [13, 10]) ||
            getTokenCode(currencyConfig.code)
          }
        >
          <Image
            src={currencyConfig.image}
            alt={currencyConfig.code}
            height={32}
            width={32}
            className='w-8 h-8 rounded-full'
          />
          <div className='flex flex-col text-justify items-start gap-y-1'>
            <span className='font-medium block truncate text-base/[100%]'>
              {getTokenCode(currencyConfig.code)}
            </span>
            <div className='flex items-center truncate gap-1 text-xs text-gray-500'>
              {assetConfig.chain == "fiat" ? (
                <span>{currencyConfig.name}</span>
              ) : (
                <>
                  <span>on</span>
                  <Image
                    src={chainConfig.image}
                    alt={chainConfig.code}
                    height={14}
                    width={14}
                    className='w-3 h-3 rounded-full'
                  />
                  <span>{chainConfig.name}</span>
                </>
              )}
            </div>
          </div>
        </ListItem>
      )
    })}
  </div>
)

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
