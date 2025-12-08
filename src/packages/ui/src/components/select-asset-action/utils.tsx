import {
  ChainConfig,
  CurrencyConfigMap,
  getAssetOrder,
  getChainOrder,
  searchKeyWords,
  type AssetConfig,
} from "@repo/utils"

export function getFilteredChains(
  chainConfigs: ChainConfig[],
  chainSearch: string | undefined,
): ChainConfig[] {
  return chainConfigs
    .filter((chainConfig) => {
      if (!chainSearch || chainSearch.trim() === "") {
        return true
      }

      return searchKeyWords(chainSearch, [chainConfig.name, chainConfig.code])
    })
    .sort((a, b) => {
      return getChainOrder(a.code) - getChainOrder(b.code)
    })
}

export function getFilteredCurrencies(
  assetConfigs: AssetConfig[],
  currencySearch: string | undefined,
  selectedChain?: string,
): AssetConfig[] {
  return assetConfigs
    .filter((assetConfig) => {
      if (selectedChain && assetConfig.chain !== selectedChain) {
        return false
      }

      if (!currencySearch) {
        return true
      }

      const currencyConfig = CurrencyConfigMap[assetConfig.currency]
      return searchKeyWords(currencySearch, [
        currencyConfig.name,
        currencyConfig.code,
        currencyConfig?.tokenCode,
      ])
    })
    .sort((a, b) => {
      return getAssetOrder(a.code) - getAssetOrder(b.code)
    })
}
