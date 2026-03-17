import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { getOriginFromUrl } from '@/utils';
import { ga4 } from '@/utils/ga4';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { message } from 'antd';
import { ConnectedSite } from 'background/service/permission';
import clsx from 'clsx';
import { CHAINS_ENUM, KEYRING_TYPE } from 'consts';
import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import IconDapps from 'ui/assets/dapps.svg';
import { ReactComponent as RCIconDisconnectCC } from 'ui/assets/dashboard/current-connection/cc-disconnect.svg';
import IconMetamaskMode from 'ui/assets/metamask-mode-circle.svg';
import { ChainSelector, FallbackSiteLogo } from 'ui/component';
import { getCurrentTab, useWallet } from 'ui/utils';
import { findChain } from '@/utils/chain';
import ChainSelectorModal from '@/ui/component/ChainSelector/Modal';
import { useMemoizedFn } from 'ahooks';
import { AccountSelector } from '@/ui/component/AccountSelector';
import { Account } from '@/background/service/preference';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import GnosisWrongChainAlertBar from '../GnosisWrongChainAlertBar';
import { useGnosisNetworks } from '@/ui/hooks/useGnosisNetworks';
import {
  TooltipView,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  ButtonType,
  ButtonSize,
} from '@repo/ui/primitives';
import { truncate } from '@repo/utils';
import {
  BROADCAST_TO_UI_EVENTS,
  BROADCAST_TO_UI_EVENTS_PAYLOAD,
} from '@/utils/broadcastToUI';
import { onBroadcastToUI } from '@/ui/utils/broadcastToUI';

interface CurrentConnectionProps {
  onChainChange?: (chain: CHAINS_ENUM) => void;
}
export const CurrentConnection = memo((props: CurrentConnectionProps) => {
  const { onChainChange } = props;
  const wallet = useWallet();
  const { t } = useTranslation();
  const [site, setSite] = useState<ConnectedSite | null>(null);
  const { state } = useLocation<{
    trigger?: string;
    showChainsModal?: boolean;
  }>();
  const { showChainsModal = false, trigger } = state ?? {};

  const isEnabledDappAccount = useRabbySelector((s) => {
    return s.preference.isEnabledDappAccount;
  });

  const [visible, setVisible] = useState(
    trigger === 'current-connection' && showChainsModal
  );

  const [popoverVisible, setPopoverVisible] = useState(false);

  const getCurrentSite = useCallback(async () => {
    const tab = await getCurrentTab();
    if (!tab.id || !tab.url) return;
    const domain = getOriginFromUrl(tab.url);
    const current = await wallet.getCurrentSite(tab.id, domain);
    setSite(current);
    return current;
  }, []);

  const handleRemove = async (origin: string) => {
    await wallet.removeConnectedSite(origin);
    ga4.fireEvent('Click_DisconnectDapp', {
      event_category: 'Front Page Click',
    });
    getCurrentSite();
    message.success({
      icon: <i />,
      content: (
        <span className="text-white">
          {t('page.dashboard.recentConnection.disconnected')}
        </span>
      ),
    });
  };

  const handleChangeDefaultChain = async (chain: CHAINS_ENUM) => {
    const _site = {
      ...site!,
      chain,
    };
    setSite(_site);
    setVisible(false);
    onChainChange?.(chain);
    await wallet.setSite(_site);
    const rpc = await wallet.getCustomRpcByChain(chain);
    if (rpc) {
      const avaliable = await wallet.pingCustomRPC(chain);
      if (!avaliable) {
        message.error(t('page.dashboard.recentConnection.rpcUnavailable'));
      }
    }
  };

  const currentAccount = useCurrentAccount();

  const currentSiteAccount = useMemo(() => {
    if (!isEnabledDappAccount) {
      return currentAccount;
    }
    return site?.account ? site.account : currentAccount;
  }, [site?.account, currentAccount, isEnabledDappAccount]);

  const handleSiteAccountChange = useMemoizedFn(async (account) => {
    if (!site) {
      return;
    }
    if (!isEnabledDappAccount) {
      await dispatch.account.changeAccountAsync(account);
    } else {
      const _site = {
        ...site!,
        account,
      };
      setSite(_site);
      setVisible(false);
      await wallet.setSiteAccount({ origin: _site.origin, account });
    }
  });

  useEffect(() => {
    getCurrentSite().then((site) => {
      if (site?.chain) {
        onChainChange?.(site.chain);
      }
    });
  }, []);

  useEffect(() => {
    const disposers = [
      onBroadcastToUI(BROADCAST_TO_UI_EVENTS.storeChanged, (payload) => {
        if (payload?.bgStoreName === 'permission') {
          getCurrentSite();
        }
      }),
      onBroadcastToUI(
        BROADCAST_TO_UI_EVENTS.accountsChanged,
        (_payload: BROADCAST_TO_UI_EVENTS_PAYLOAD['accountsChanged']) => {
          getCurrentSite();
        }
      ),
    ];

    const handleFocus = () => {
      getCurrentSite();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getCurrentSite();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposers.forEach((dispose) => dispose());
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getCurrentSite]);

  const chain = useMemo(() => {
    if (!site || !site.isConnected) {
      return null;
    }
    return findChain({
      enum: site.chain || CHAINS_ENUM.ETH,
    });
  }, [site]);

  const handleClickChain = useMemoizedFn(() => {
    if (!site?.isConnected) {
      return;
    }
    setVisible(true);
    matomoRequestEvent({
      category: 'Front Page Click',
      action: 'Click',
      label: 'Change Chain',
    });

    ga4.fireEvent('Click_ChangeChain', {
      event_category: 'Front Page Click',
    });
  });

  const handleSiteIconClick = useMemoizedFn(() => {
    if (site?.isConnected) {
      getCurrentSite();
      setPopoverVisible(!popoverVisible);
    }
  });

  const handlePopoverOpenChange = useMemoizedFn((open: boolean) => {
    setPopoverVisible(open);
    if (open) {
      getCurrentSite();
    }
  });

  useEffect(() => {
    if (!popoverVisible) {
      return;
    }

    const timer = window.setInterval(() => {
      getCurrentSite();
    }, 1200);

    return () => {
      window.clearInterval(timer);
    };
  }, [popoverVisible, getCurrentSite]);

  const dispatch = useRabbyDispatch();

  const { data: gnosisNetworks, loading } = useGnosisNetworks({
    address:
      currentSiteAccount?.address &&
      currentSiteAccount?.type === KEYRING_TYPE.GnosisKeyring
        ? currentSiteAccount.address
        : '',
  });

  const isShowGnosisAlert = useMemo(() => {
    return (
      currentSiteAccount?.type === KEYRING_TYPE.GnosisKeyring &&
      site?.isConnected &&
      (!gnosisNetworks?.length ||
        (!gnosisNetworks?.find((id) => {
          return (
            +id ===
            findChain({
              enum: site.chain || CHAINS_ENUM.ETH,
            })?.id
          );
        }) &&
          !loading))
    );
  }, [
    currentSiteAccount,
    site?.isConnected,
    site?.chain,
    gnosisNetworks,
    loading,
  ]);

  // if (!isEnabledDappAccount) {
  //   return (
  //     <>
  //       <div>
  //         {site ? (
  //           <>
  //             <div className="site">
  //               <div className="relative">
  //                 <FallbackSiteLogo
  //                   url={site.icon}
  //                   origin={site.origin}
  //                   width="20px"
  //                   className="site-icon"
  //                 />
  //                 {site.isMetamaskMode ? (
  //                   <TooltipView
  //                     className={clsx('rectangle max-w-[360px] w-[360px]')}
  //                     content={t(
  //                       'page.dashboard.recentConnection.metamaskModeTooltipNew'
  //                     )}
  //                   >
  //                     <div className="absolute top-[-4px] right-[-4px] text-r-neutral-title-2">
  //                       <img
  //                         src={IconMetamaskMode}
  //                         alt="metamask mode"
  //                         className="h-5 w-5"
  //                       />
  //                     </div>
  //                   </TooltipView>
  //                 ) : null}
  //               </div>
  //               <div className="site-content">
  //                 <div
  //                   className={clsx(
  //                     'site-status text-[12px]',
  //                     site?.isConnected && 'active'
  //                   )}
  //                 >
  //                   <RCIconDisconnectCC
  //                     viewBox="0 0 14 14"
  //                     className="site-status-icon w-3 h-3 ml-1 text-r-neutral-foot hover:text-rabby-red-default"
  //                     onClick={() => handleRemove(site!.origin)}
  //                   />
  //                 </div>
  //               </div>
  //             </div>
  //           </>
  //         ) : (
  //           <div className="site is-empty">
  //             <img src={IconDapps} className="site-icon ml-6 h-5 w-5" alt="" />
  //           </div>
  //         )}
  //       </div>
  //       {isShowGnosisAlert ? <GnosisWrongChainAlertBar /> : null}
  //     </>
  //   );
  // }

  return (
    <>
      {site ? (
        <Popover open={popoverVisible} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <div
              className={clsx(
                'site-icon-container',
                site?.isConnected ? 'is-support' : ''
              )}
              onClick={handleSiteIconClick}
            >
              <div className="relative">
                <FallbackSiteLogo
                  url={site.icon}
                  origin={site.origin}
                  width="20px"
                ></FallbackSiteLogo>
                {/* {site.isMetamaskMode ? (
                  <div>
                    <div className="absolute top-[-4px] right-[-4px] text-r-neutral-title-2">
                      <img src={IconMetamaskMode} alt="metamask mode"></img>
                    </div>
                  </div>
                ) : null} */}
                {chain ? (
                  <div className="absolute bottom-[12px] right-[-3px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#27c193]" />
                  </div>
                ) : null}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            className="!mr-1 w-[220px] rounded-[32px] border border-[#CACACD] bg-[rgba(250,250,250,0.75)] shadow-[0_23px_14px_4px_rgba(24,24,27,0.03)] backdrop-blur-[12px]"
          >
            <div className="">
              <div className="flex items-center gap-4 mb-3">
                <FallbackSiteLogo
                  url={site.icon}
                  origin={site.origin}
                  width="32px"
                />
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-sm text-primary-foreground truncate text-nowrap">
                    {truncate(site.name, [10, 0])}
                  </div>
                  <div className="text-xs text-secondary-foreground truncate">
                    <TooltipView
                      variant="dark"
                      content={site.origin}
                      className="flex items-center gap-2  truncate"
                    >
                      {truncate(site.origin, [10, 0])}
                    </TooltipView>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2 rounded mb-3 text-xs">
                {site.isConnected ? (
                  <Fragment>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#27c193]" />
                    <div className="font-medium text-[#27c193]">
                      {t('page.dashboard.recentConnection.connected')}
                    </div>
                  </Fragment>
                ) : (
                  <Fragment>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff5c5c]" />
                    <div className="font-medium text-[#ff5c5c]">
                      {t('page.dashboard.recentConnection.disconnected')}
                    </div>
                  </Fragment>
                )}

                {chain ? (
                  <div className="flex items-center gap-1 ml-auto">
                    <img src={chain.logo} alt="chain" className="w-4 h-4" />
                    <span className="text-secondary-primary ">
                      {chain.name}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  buttonType={ButtonType.SECONDARY}
                  buttonSize={ButtonSize.SM}
                  onClick={() => {
                    setVisible(true);
                    setPopoverVisible(false);
                  }}
                >
                  Manage connections
                </Button>
                {site.isConnected && (
                  <Button
                    buttonType={ButtonType.SECONDARY}
                    buttonSize={ButtonSize.SM}
                    className="border-red-500 text-red-500"
                    onClick={() => {
                      handleRemove(site.origin);
                      setPopoverVisible(false);
                    }}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="site is-empty">
          <img src={IconDapps} className="site-icon ml-6 h-5 w-5" alt="" />
        </div>
      )}

      {isShowGnosisAlert ? <GnosisWrongChainAlertBar /> : null}
    </>
  );
});
