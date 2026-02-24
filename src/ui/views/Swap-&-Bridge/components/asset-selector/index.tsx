import {
  type AssetConfig,
  ChainConfigMap,
  cn,
  CurrencyConfigMap,
  getAsset,
  getTokenCode,
} from "@repo/utils"
import { ChevronDown } from "lucide-react"


import { useEventRef } from "@repo/ui"
import { TooltipView } from "@repo/ui/primitives"
import SelectAssetAction from "../select-asset-action"
import { CHAINS_ENUM } from "@/types/chain"
import { TokenItem } from "@rabby-wallet/rabby-api/dist/types"
import { findChainByEnum } from "@/utils/chain"


interface AssetSelectorProps {
  className?: string
  rootSelector?: string
  title: string
  selectedToken?: TokenItem
  selectedChain?: CHAINS_ENUM
  onSelect?: (assetConfig: AssetConfig) => void
  onChainChange?: (chain: CHAINS_ENUM) => void
  onTokenChange?: (token: TokenItem) => void
}

function AssetSelector({
  className,
  rootSelector,
  title,
  selectedToken,
  selectedChain,
  onSelect,
  onChainChange,
  onTokenChange,
}: AssetSelectorProps) {
  const [selectAsset, selectAssetRef] = useEventRef()
  const chainObj = selectedChain ? findChainByEnum(selectedChain) : undefined

  return (
    <>
      <div
        className={cn("flex cursor-pointer flex-col items-center", className)}
        onClick={selectAsset}
      >
        {selectedToken && chainObj ? (
          <div className='flex w-full items-center gap-2 bg-inherit text-base font-semibold text-[#002C15] hover:bg-inherit'>
            <TooltipView
              variant='dark'
              content={selectedToken.symbol}
              className='flex items-center gap-2'
            >
              <img
                src={selectedToken.logo_url}
                alt={selectedToken.name}
                width={30}
                height={30}
                draggable={false}
                className='rounded-full'
              />
              <div className='text-[16px] max-w-[100px] truncate'>
                {selectedToken.symbol} ({chainObj?.name})
              </div>
            </TooltipView>
            <ChevronDown size={18} />
          </div>
        ) : (
          <div className='flex w-full items-center gap-2 bg-inherit text-base font-semibold text-[#A1A1AA]'>
            <div className='w-8 h-8 rounded-full bg-gray-200' />
            <div className='text-[16px]'>Select</div>
            <ChevronDown size={18} />
          </div>
        )}
        {selectedToken && chainObj ? (
          <div className='text-sm pt-2 font-normal leading-[12px] text-[#6E7685]'>
            {chainObj.name}
          </div>
        ) : null}
      </div>
      <SelectAssetAction
        title={title}
        rootSelector={rootSelector}
        actionRef={selectAssetRef}
        onChainChange={onChainChange}
        onTokenChange={onTokenChange}
      />
    </>
  )
}

AssetSelector.displayName = "AssetSelector"

export default AssetSelector
