import { useCommonPopupView, useWallet } from '@/ui/utils';
import React, { useState, useRef } from 'react';
import { ChainList } from './ChainList';
import { AssetListContainer } from './AssetListContainer';
import { useSwitchNetTab } from 'ui/component/PillsSwitch/NetSwitchTabs';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { CustomTestnetAssetList } from './CustomTestnetAssetList';
import { SpecialTokenListPopup } from './components/TokenButton';
import { TestnetChainList } from './TestnetChainList';
import { useFilteredTokens } from './useFilteredTokens';
import { useOpenClose } from '@repo/ui';

export const AssetList = ({
  visible,
  onClose,
  selectedNetwork,
  forceRefresh,
}: {
  visible: boolean;
  onClose?(): void;
  selectedNetwork?: string | null;
  forceRefresh?: boolean;
}) => {
  const { t } = useTranslation();
  const { setHeight, data } = useCommonPopupView();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectChainId, setSelectChainId] = useState<string | null>(null);
  const [selectTestnetChainId, setSelectTestnetChainId] = useState<
    string | null
  >(null);
  const handleSelectChainChange = (id: string | null) => {
    setSelectChainId(id);
  };
  const handleTestnetSelectChainChange = (id: string | null) => {
    setSelectTestnetChainId(id);
  };
  const [isEmptyAssets, setIsEmptyAssets] = useState<boolean>(false);
  const [isTestnetEmptyAssets, setIsTestnetEmptyAssets] = useState(false);
  const { isShowTestnet, selectedTab, onTabChange } = useSwitchNetTab();

  React.useEffect(() => {
    setHeight(500);
  }, []);

  React.useEffect(() => {
    if (visible) {
      onTabChange('mainnet');
    } else {
      // Reset scroll position when component becomes invisible
      setTimeout(() => {
        if (containerRef.current && containerRef.current.parentElement) {
          containerRef.current.parentElement.scrollTop = 0;
        }
      }, 200);
    }
  }, [visible]);

  React.useEffect(() => {
    // Sync selectChainId when selectedNetwork changes (from network dropdown selection)
    setSelectChainId(selectedNetwork ?? null);
  }, [selectedNetwork]);

  const { sortedCustomize: tokens } = useFilteredTokens(selectChainId, false);
  const [showCustomizedTokens, setShowCustomizedTokens] = React.useState(false);

  return (
    <div ref={containerRef}>
      {/* {isShowTestnet && (
        <NetSwitchTabs
          value={selectedTab}
          onTabChange={onTabChange}
          // className="h-[28px] box-content mt-[20px] mb-[20px]"
        />
      )} */}
      <div className={clsx(selectedTab === 'testnet' ? 'hidden' : 'block')}>
        {/* <ChainList
          onChange={(id) => {
            handleSelectChainChange(id);
            onNetworkChange?.(id);
          }}
        /> */}
        <AssetListContainer
          selectChainId={selectChainId}
          visible={visible}
          onEmptyAssets={setIsEmptyAssets}
          forceRefresh={forceRefresh}
        />
        <SpecialTokenListPopup
          label={
            tokens?.length > 1
              ? t('page.dashboard.tokenDetail.customizedButtons')
              : t('page.dashboard.tokenDetail.customizedButton')
          }
          buttonText={t('page.dashboard.assets.customButtonText')}
          description={t('page.dashboard.assets.customDescription')}
          onClickButton={() => {
            setShowCustomizedTokens(true);
          }}
          tokens={tokens}
          visible={showCustomizedTokens}
          onClose={() => setShowCustomizedTokens(false)}
        />
      </div>
      <div className={clsx(selectedTab === 'testnet' ? 'block' : 'hidden')}>
        <TestnetChainList onChange={handleTestnetSelectChainChange} />
        <CustomTestnetAssetList
          selectChainId={selectTestnetChainId}
          visible={visible}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
