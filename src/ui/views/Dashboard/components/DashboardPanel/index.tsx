import RateModal from '@/ui/component/RateModal/RateModal';

import React, { useState, useCallback, useEffect, useMemo } from 'react';

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
import { useHistory, useLocation } from 'react-router-dom';
import { formatAppChain } from '@/ui/hooks/useAppChain';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { CHAINS } from 'consts';
import { getChain } from '@/utils';
import { getMainnetChainList } from '@/utils/chain';
import clsx from 'clsx';

const className =
  '!bg-white !text-[16px]/[24px] not-italic font-medium !data-[state=active]:text-primary-foreground text-[#A1A1AA] data-[state=active]:!bg-white shadow-none data-[state=active]:!hover:bg-white data-[state=active]:shadow-none w-16';

export const DashboardPanel: React.FC<{
  onRefresh?: () => void;
  chainBalancesWithValue?: DisplayChainWithWhiteLogo[];
}> = ({ onRefresh, chainBalancesWithValue = [] }) => {
  const currentAccount = useCurrentAccount();
  const history = useHistory();
  const location = useLocation();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    null
  );
  const [selectedNetworkLogo, setSelectedNetworkLogo] = useState<string | null>(
    null
  );
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const { data, apps, setData } = useCommonPopupView();
  const addTokenEntryRef = React.useRef<AddTokenEntryInst>(null);
  const networkMenuRef = React.useRef<HTMLDivElement>(null);

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

  // Memoize fallback chains to prevent infinite loops
  const fallbackChains = useMemo(
    () =>
      Object.values(getMainnetChainList())
        .filter((chain) => !chain.isTestnet)
        .map(
          (chain) =>
            ({
              id: chain.serverId,
              name: chain.name,
              logo_url: chain.logo,
              usd_value: 0,
            } as DisplayChainWithWhiteLogo)
        ),
    []
  );

  const chainList =
    chainListBase.length > 0
      ? [...chainListBase, ...appChains]
      : [...fallbackChains, ...appChains];

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setForceRefresh(true);
    try {
      await refreshBalance();
      if (onRefresh) {
        onRefresh();
      }
      // Reset forceRefresh after a brief delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setForceRefresh(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger forced refresh when navigating from send/swap/bridge with force_fetch=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('force_fetch') === 'true') {
      (async () => {
        await handleRefresh();
        params.delete('force_fetch');
        history.replace({ search: params.toString() });
      })();
    }
  }, [location.search]);

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
    // Always update context with chains for dropdown, even if balance is empty
    const chainsToSet =
      displayChainBalances && displayChainBalances.length > 0
        ? displayChainBalances
        : fallbackChains;

    setData({
      matteredChainBalances: chainsToSet,
      balance: data?.balance || 0,
      balanceLoading: false,
      isEmptyAssets: displayChainBalances?.length === 0,
    });
  }, [displayChainBalances, fallbackChains, setData]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (!showNetworkMenu || !networkMenuRef.current) {
        return;
      }

      const eventPath = event.composedPath();
      const isInsideNetworkMenu = eventPath.includes(networkMenuRef.current);

      if (!isInsideNetworkMenu) {
        setShowNetworkMenu(false);
      }
    };

    // Capture phase ensures this runs even when other popovers stop propagation.
    document.addEventListener('pointerdown', handleClickOutside, true);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [showNetworkMenu]);

  return (
    <div className="bg-white rounded-t-[24px] px-[16px] pt-[14px] pb-[12px] flex flex-col h-full">
      <Tabs defaultValue="asset" className="flex flex-col h-full">
        <div className="flex items-center justify-between ">
          <TabsList className="bg-white justify-start shrink-0 py-1">
            <TabsTrigger className={className} value="asset">
              Asset
            </TabsTrigger>
            <TabsTrigger className={className} value="activity">
              Activity
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div ref={networkMenuRef} className="relative z-50">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className={clsx(
                  'flex items-center gap-[5px] py-1 rounded-full border border-primary-foreground bg-white hover:bg-r-neutral-bg-1 transition-colors',
                  selectedNetworkLogo ? '!px-1.5' : 'px-2.5'
                )}
              >
                {selectedNetworkLogo && (
                  <img
                    src={selectedNetworkLogo}
                    alt={selectedNetwork || ''}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span className="text-xs font-medium text-primary-foreground">
                  {selectedNetwork ? selectedNetwork : 'All networks'}
                </span>
                <ChevronDown
                  className={`text-primary-foreground h-4 w-4 transition-transform ${
                    showNetworkMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showNetworkMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-r-neutral-line rounded-lg shadow-lg z-[100] max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleNetworkSelect(undefined)}
                    className="w-full text-left px-4 py-1.5 hover:bg-r-neutral-bg-1 font-medium not-italic text-primary-foreground transition-colors text-xs"
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
                            getChain(chain.id)?.logo || chain.logo_url
                          )
                        }
                        className={`w-full text-left px-4 py-2 hover:bg-r-neutral-bg-1 text-primary-foreground transition-colors font-medium text-xs flex items-center gap-2 ${
                          selectedNetworkId === chain.id
                            ? 'bg-r-neutral-bg-1'
                            : ''
                        }`}
                      >
                        {getChain(chain.id)?.logo && (
                          <img
                            src={getChain(chain.id)?.logo}
                            alt={getChain(chain.id)?.name}
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <span>
                          {chain.name}
                          {chain.usd_value
                            ? ` (${Number(chain.usd_value).toFixed(2)})`
                            : ''}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-r-neutral-foot">
                      {!data?.matteredChainBalances && !apps
                        ? 'Loading chains...'
                        : 'No chains available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <AddTokenEntry ref={addTokenEntryRef} onRefresh={handleRefresh} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="asset" className="h-full">
            <AssetList
              visible={true}
              onClose={() => {}}
              selectedNetwork={selectedNetworkId}
              forceRefresh={forceRefresh}
            />
          </TabsContent>

          <TabsContent value="activity" className="h-full">
            <HistoryList
              chainId={selectedNetworkId ?? undefined}
              forceRefresh={forceRefresh}
            />
          </TabsContent>
        </div>
      </Tabs>

      <RateModal />
    </div>
  );
};
