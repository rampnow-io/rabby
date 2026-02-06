import RateModal from '@/ui/component/RateModal/RateModal';

import React, { useState, useCallback, useEffect } from 'react';

import { AssetList } from '@/ui/views/CommonPopup/AssetList/AssetList';
import { ApprovalsTabPane } from '@/ui/views/DesktopProfile/components/ApprovalsTabPane';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/primitives';
import { HistoryList } from '@/ui/views/History/components/HistoryList';
import { ChevronDown, RefreshCw } from 'lucide-react';
import AddTokenEntry, {
  AddTokenEntryInst,
} from '@/ui/views/CommonPopup/AssetList/AddTokenEntry';
import { useCommonPopupView } from '@/ui/utils';
import { DisplayChainWithWhiteLogo } from '@/ui/hooks/useCurrentBalance';
import useCurrentBalance from '@/ui/hooks/useCurrentBalance';
import { formatAppChain } from '@/ui/hooks/useAppChain';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';

const className =
  '!bg-white data-[state=active]:!bg-white shadow-none data-[state=active]:!hover:bg-white data-[state=active]:shadow-none w-16';

export const DashboardPanel: React.FC<{
  onRefresh?: () => void;
  chainBalancesWithValue?: DisplayChainWithWhiteLogo[];
}> = ({ onRefresh, chainBalancesWithValue = [] }) => {
  const currentAccount = useCurrentAccount();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    null
  );
  const [selectedNetworkLogo, setSelectedNetworkLogo] = useState<string | null>(
    null
  );
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data, apps, setData } = useCommonPopupView();
  const addTokenEntryRef = React.useRef<AddTokenEntryInst>(null);

  // Get chain data from useCurrentBalance hook
  const {
    chainBalancesWithValue: latestChainBalances,
    refreshBalance,
  } = useCurrentBalance(currentAccount?.address, {
    update: true,
    noNeedBalance: false,
  });

  // Use either passed prop or latest from hook
  const displayChainBalances =
    chainBalancesWithValue.length > 0
      ? chainBalancesWithValue
      : latestChainBalances;

  // Prepare chain list from context or direct data
  const chainListBase =
    (data?.matteredChainBalances as DisplayChainWithWhiteLogo[]) ??
    displayChainBalances ??
    [];
  const appChains = apps?.map(formatAppChain) ?? [];
  const chainList = [...chainListBase, ...appChains];

  const handleNetworkSelect = (
    chainId: string | null | undefined,
    chainName?: string,
    logoUrl?: string
  ) => {
    setSelectedNetworkId(chainId || null);
    setSelectedNetwork(chainName || null);
    setSelectedNetworkLogo(logoUrl || null);
    setShowNetworkMenu(false);
  };

  // Call refreshBalance when refreshTrigger changes
  useEffect(() => {
    const performRefresh = async () => {
      try {
        await refreshBalance();

        // Call the parent's refresh function if provided
        if (onRefresh) {
          onRefresh();
        }

        // Wait a moment for data to update
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Reopen dropdown
      } finally {
        setIsRefreshing(false);
      }
    };

    performRefresh();
  }, []);

  // Update context data when chain balances change
  useEffect(() => {
    if (displayChainBalances && displayChainBalances.length > 0) {
      setData({
        matteredChainBalances: displayChainBalances,
        balance: data?.balance || 0,
        balanceLoading: false,
        isEmptyAssets: displayChainBalances.length === 0,
      });
    }
  }, [displayChainBalances, setData, data?.balance]);
  return (
    <div className="bg-white rounded-t-[24px] px-[16px] pt-[14px] pb-[12px] flex flex-col h-full">
      <Tabs defaultValue="assets" className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-white justify-start shrink-0 py-2">
            <TabsTrigger className={className} value="assets">
              Assets
            </TabsTrigger>
            <TabsTrigger className={className} value="activity">
              Activity
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative z-50">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="flex items-center gap-2 px-2 rounded-full border border-primary-foreground bg-white hover:bg-r-neutral-bg-1 transition-colors"
              >
                {selectedNetworkLogo && (
                  <img
                    src={selectedNetworkLogo}
                    alt={selectedNetwork || ''}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span className="text-xs text-primary-foreground">
                  {selectedNetwork ? selectedNetwork : 'All networks'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-r-neutral-foot transition-transform ${
                    showNetworkMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showNetworkMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-r-neutral-line rounded-lg shadow-lg z-[100] max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleNetworkSelect(undefined)}
                    className="w-full text-left px-4 py-2 hover:bg-r-neutral-bg-1 transition-colors text-sm"
                  >
                    All networks
                  </button>
                  {chainList && chainList.length > 0 ? (
                    chainList.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() =>
                          handleNetworkSelect(
                            chain.id,
                            chain.name,
                            chain.logo_url
                          )
                        }
                        className={`w-full text-left px-4 py-2 hover:bg-r-neutral-bg-1 transition-colors text-sm flex items-center gap-2 ${
                          selectedNetworkId === chain.id
                            ? 'bg-r-neutral-bg-1'
                            : ''
                        }`}
                      >
                        {chain.logo_url && (
                          <img
                            src={chain.logo_url}
                            alt={chain.name}
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <span>
                          {chain.name}
                          {chain.usd_value
                            ? ` (${chain.usd_value.toFixed(2)})`
                            : ''}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-r-neutral-foot">
                      {!data?.matteredChainBalances && !apps
                        ? 'Loading chains...'
                        : 'No chains available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <AddTokenEntry ref={addTokenEntryRef} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="assets" className="h-full">
            <AssetList
              visible={true}
              onClose={() => {}}
              selectedNetwork={selectedNetworkId}
              onNetworkChange={(id) => {
                setSelectedNetworkId(id);
              }}
            />
          </TabsContent>

          <TabsContent value="activity" className="h-full">
            <HistoryList />
          </TabsContent>
        </div>
      </Tabs>

      <RateModal />
    </div>
  );
};
