import {
  type AssetConfig,
  ChainConfigMap,
  cn,
  CurrencyConfigMap,
  getAsset,
  getTokenCode,
} from "@repo/utils"
import { ChevronDown } from "lucide-react"
import useEventRef from "../hooks/use-event-ref"
import { TooltipView } from "../primitives"
import { Image } from "../primitives/image"
import SelectAssetAction from "./select-asset-action"

interface AssetSelectorProps {
  className?: string
  rootSelector?: string
  title: string
  selectedCurrency: string
  selectedChain: string
  assetConfigMap: Record<string, AssetConfig>
  onSelect?: (assetConfig: AssetConfig) => void
}

function AssetSelector({
  className,
  rootSelector,
  title,
  selectedCurrency,
  selectedChain,
  assetConfigMap,
  onSelect,
}: AssetSelectorProps) {
  const [selectAsset, selectAssetRef] = useEventRef()
  const assetConfig: AssetConfig | undefined =
    assetConfigMap[getAsset(selectedChain, selectedCurrency)]
  const currencyConfig = CurrencyConfigMap[assetConfig?.currency]
  const chainConfig = ChainConfigMap[assetConfig?.chain]

  if (!currencyConfig || !chainConfig) {
    return <></>
  }

  return (
    <>
      <div
        className={cn("flex cursor-pointer flex-col items-center", className)}
        onClick={selectAsset}
      >
        <div className='flex w-full items-center gap-2 bg-inherit text-base font-semibold text-[#002C15] hover:bg-inherit'>
          <TooltipView
            variant='dark'
            content={getTokenCode(currencyConfig.code)}
            className='flex items-center gap-2'
          >
            <Image
              src={currencyConfig.image}
              alt={currencyConfig.name}
              width={30}
              height={30}
              draggable={false}
              className='rounded-full h-[30px] w-[30px]'
            />
            <div className='text-xl max-w-[100px] truncate'>
              {getTokenCode(currencyConfig.code)}
            </div>
          </TooltipView>
          <ChevronDown size={18} />
        </div>
        {currencyConfig.isCrypto ? (
          <div className='text-sm pt-2 font-normal leading-[12px] text-[#6E7685]'>
            {chainConfig.name}
          </div>
        ) : null}
      </div>
      <SelectAssetAction
        title={title}
        rootSelector={rootSelector}
        actionRef={selectAssetRef}
        assetConfigMap={assetConfigMap}
        onSelect={onSelect}
      />
    </>
  )
}

AssetSelector.displayName = "CurrencySelector"

export default AssetSelector
