import { TokenEntityDetail, TokenItem } from 'background/service/openapi';
import clsx from 'clsx';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import IconUnknown from '@/ui/assets/token-default.svg';
import { Image } from 'antd';
import {
  splitNumberByStep,
  useWallet,
  useCommonPopupView,
  getUiType,
} from 'ui/utils';
import { getChain } from '@/utils';
import { ellipsisOverflowedText } from 'ui/utils';
import { getTokenSymbol } from '@/ui/utils/token';
import { BlockedButton } from './BlockedButton';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import TokenChainAndContract from './TokenInfo';
import { TokenCharts } from '@/ui/component/TokenChart';
import { BlockedTopTips } from './BlockedTopTips';
import { ScamTokenTips } from './ScamTokenTips';
import { useGetHandleTokenSelectInTokenDetails } from '@/ui/component/TokenSelector/context';
import { Account } from '@/background/service/preference';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { DbkButton } from '@/ui/views/Ecology/dbk-chain/components/DbkButton';
import { DBK_CHAIN_ID, ThemeIconType } from '@/constant';
import { Button, ButtonType, Separator } from '@repo/ui/primitives';
import { HistoryList } from '@/ui/views/History/components/HistoryList';
import { RcIconExternal1CC } from '@/ui/assets/dashboard';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import {
  RcIconSettingCC,
  RcIconReceiveCC,
  RcIconSendCC,
  RcIconSwapCC,
  RcIconBuyCC,
} from 'ui/assets/dashboard/panel';
import IconAlertRed from 'ui/assets/alert-red.svg';

const isDesktop = getUiType().isDesktop;

type IPanelItem = {
  icon: ThemeIconType;
  content: string;
  onClick: React.MouseEventHandler<HTMLElement>;
  badge?: number;
  badgeAlert?: boolean;
  badgeClassName?: string;
  iconSpin?: boolean;
  hideForGnosis?: boolean;
  showAlert?: boolean;
  disabled?: boolean;
  commingSoonBadge?: boolean;
  disableReason?: string;
  eventKey: string;
  iconClassName?: string;
  subContent?: React.ReactNode;
  isFullscreen?: boolean;
};

interface TokenDetailProps {
  onClose?(): void;
  token: TokenItem;
  addToken(token: TokenItem): void;
  removeToken(token: TokenItem): void;
  variant?: 'add';
  isAdded?: boolean;
  canClickToken?: boolean;
  hideOperationButtons?: boolean;
  popupHeight: number;
  tipsFromTokenSelect?: string;
  account?: Account;
}

const TokenDetail = ({
  token,
  addToken,
  removeToken,
  variant,
  isAdded,
  onClose,
  canClickToken = true,
  popupHeight,
  hideOperationButtons = false,
  tipsFromTokenSelect,
  account,
}: TokenDetailProps) => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [entityLoading, setEntityLoading] = React.useState(true);
  const [tokenWithAmount, setTokenWithAmount] = React.useState<TokenItem>(
    token
  );
  const [tokenEntity, setTokenEntity] = React.useState<TokenEntityDetail>();
  const _currentAccount = useCurrentAccount();
  const currentAccount = account || _currentAccount;

  const getTokenAmount = React.useCallback(async () => {
    // if (token.amount !== undefined) return;
    const info = await wallet.openapi.getToken(
      currentAccount!.address,
      token.chain,
      token.id
    );
    if (info) {
      setTokenWithAmount({
        ...token,
        is_suspicious: info.is_suspicious,
        is_verified: info.is_verified,
        amount: info.amount,
      });
    }
  }, [token]);

  const getTokenEntity = React.useCallback(async () => {
    try {
      const info = await wallet.openapi.getTokenEntity(token.id, token.chain);
      if (info) {
        setTokenEntity(info);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEntityLoading(false);
    }
  }, [token.id, token.chain, wallet]);

  React.useEffect(() => {
    if (currentAccount) {
      getTokenAmount();
      getTokenEntity();
    }
  }, [currentAccount, getTokenAmount]);

  const { setVisible } = useCommonPopupView();

  const history = useHistory();
  const location = useLocation();

  const action = new URLSearchParams(location.search).get('action');

  const isSwap =
    location.pathname === '/swap-and-bridge' ||
    (action === 'swap' && isDesktop);
  const isSend =
    location.pathname === '/send-token' || (action === 'send' && isDesktop);
  const isBridge =
    location.pathname === '/bridge' || (action === 'bridge' && isDesktop);
  const isInDesktopActionModal =
    isDesktop &&
    (action === 'send' || action === 'swap' || action === 'bridge');

  const handleInTokenSelect = useGetHandleTokenSelectInTokenDetails();

  const desktopPathname = location.pathname.startsWith('/desktop/profile')
    ? location.pathname
    : '/desktop/profile';

  const goToSend = useCallback(() => {
    setVisible(false);
    if (isDesktop) {
      history.push(
        `${desktopPathname}?action=send&rbisource=tokendetail&token=${token?.chain}:${token?.id}`
      );
    } else {
      history.push(
        `/send-token?rbisource=tokendetail&token=${token?.chain}:${token?.id}`
      );
    }
  }, [history, token, isDesktop, desktopPathname]);

  const goToReceive = useCallback(() => {
    setVisible(false);
    if (isDesktop) {
      history.push(
        `${desktopPathname}?rbisource=tokendetail&action=receive&chain=${
          getChain(token?.chain)?.enum
        }&token=${token?.symbol}`
      );
    } else {
      history.push(
        `/receive?rbisource=tokendetail&chain=${
          getChain(token?.chain)?.enum
        }&token=${token?.symbol}`
      );
    }
  }, [history, token, isDesktop, desktopPathname]);

  const gotoBridge = useCallback(() => {
    setVisible(false);
    if (isBridge && handleInTokenSelect) {
      handleInTokenSelect(token);
    } else {
      if (isDesktop) {
        history.push(
          `${desktopPathname}?rbisource=tokendetail&action=bridge&fromChainServerId=${token?.chain}&fromTokenId=${token?.id}`
        );
      } else {
        history.push(
          `/bridge?rbisource=tokendetail&fromChainServerId=${token?.chain}&fromTokenId=${token?.id}`
        );
      }
    }
  }, [history, token, desktopPathname]);

  const goToSwap = useCallback(() => {
    setVisible(false);
    history.push(
      `/swap-and-bridge?rbisource=tokendetail&fromChainServerId=${token?.chain}&fromTokenId=${token?.id}`
    );
  }, [history, token]);

  const isCustomizedNotAdded = useMemo(() => {
    return !token.is_core && !isAdded && variant === 'add';
  }, [token, variant, isAdded]);

  const chain = useMemo(() => getChain(token?.chain), [token?.chain]);
  const isCustomNetworkToken = useMemo(() => {
    return token.id.startsWith('custom');
  }, [token]);

  const panelItems: Record<
    'receive' | 'send' | 'exchange' | 'buy',
    IPanelItem
  > = {
    receive: {
      icon: RcIconReceiveCC,
      eventKey: 'Receive',
      content: t('page.dashboard.home.panel.receive'),
      onClick: () => goToReceive(),
    },
    send: {
      icon: RcIconSendCC,
      eventKey: 'Send',
      content: t('page.dashboard.home.panel.send'),
      onClick: () => goToSend(),
    },
    exchange: {
      icon: RcIconSwapCC,
      eventKey: 'Exchange',
      content: 'Exchange',
      onClick: () => goToSwap(),
    },
    buy: {
      icon: RcIconBuyCC,
      eventKey: 'Buy',
      content: t('page.dashboard.home.panel.buy'),
      onClick: () => history.push('/buy'),
    },
  };

  const pickedPanelKeys = useMemo(
    () => ['receive', 'send', 'exchange', 'buy'] as const,
    []
  );
  let i = 0;

  return (
    <div className="token-detail">
      <div className={clsx('token-detail-header', 'border-b-0 pb-2')}>
        <div className={clsx('flex items-center')}>
          <div className="flex items-center mr-8">
            <div className="relative h-[44px]">
              <Image
                className="w-[44px] h-[44px] rounded-full"
                src={token.logo_url || IconUnknown}
                fallback={IconUnknown}
                preview={false}
              />
              {chain?.logo ? (
                <img
                  className="w-[14px] h-[14px] absolute right-[-2px] top-[-2px] rounded-full"
                  src={chain?.logo}
                />
              ) : null}
            </div>

            <div
              className="token-symbol ml-[8px]"
              title={getTokenSymbol(token)}
            >
              {ellipsisOverflowedText(getTokenSymbol(token), 16)}
            </div>
          </div>
        </div>
      </div>

      <div
        className={clsx(
          'token-detail-body flex flex-col gap-[12px]',
          'pt-[0px]'
        )}
      >
        {variant === 'add' && !isDesktop && (
          <BlockedTopTips
            token={token}
            isAdded={isAdded}
            onOpen={() => addToken(tokenWithAmount)}
            onClose={() => removeToken(tokenWithAmount)}
          ></BlockedTopTips>
        )}
        {!isCustomNetworkToken && <TokenCharts token={token}></TokenCharts>}
        <div className={clsx('relative grid grid-cols-4 gap-2 overflow-auto')}>
          {pickedPanelKeys.map((key) => {
            const item = panelItems[key];

            return (
              <div
                key={key}
                onClick={(e) => {
                  item.onClick(e);
                }}
                className="group h-[74px] cursor-pointer rounded-[16px]
                         border border-[var(--r-neutral-card2,#f2f4f7)]
                         bg-white hover:bg-[var(--r-neutral-card2,#f2f4f7)]
                         flex flex-col items-center justify-center relative"
              >
                {item.showAlert && (
                  <ThemeIcon
                    src={IconAlertRed}
                    className="absolute right-2 top-2"
                  />
                )}

                <ThemeIcon
                  src={item.icon}
                  className={clsx(
                    'w-6 h-6 mb-1',
                    item.iconSpin && 'animate-spin'
                  )}
                />

                <div className="text-[13px] font-medium leading-4 text-center">
                  {item.content}
                </div>

                {item.isFullscreen && (
                  <div className="absolute top-1.5 right-1.5 opacity-50 hidden group-hover:block">
                    <RcIconExternal1CC />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-[3px] bg-r-neutral-card-1 rounded-[8px]">
          <div className="balance-content flex flex-col gap-[8px]  py-[12px]">
            <div className="flex flex-row justify-between w-full pb-1">
              <div className="text-primary-foreground  text-base  font-normal">
                Your balance
              </div>
            </div>
            <div className="flex flex-row justify-between w-full rounded-[16px] bg-[#FAFAFA] px-4 h-[60px] items-center">
              <div className="flex flex-row gap-[8px] items-center">
                <Image
                  className="w-[40px] h-[40px] rounded-full"
                  src={token.logo_url || IconUnknown}
                  fallback={IconUnknown}
                  preview={false}
                />
                <div className="relative">
                  <div className="flex flex-col gap-1">
                    <div className="font-normal text-sm text-primary-foreground">
                      {' '}
                      {ellipsisOverflowedText(getTokenSymbol(token), 8)}
                    </div>
                    <div className=" truncate font-normal text-sm text-secondary-foreground">
                      {splitNumberByStep(
                        (Number(tokenWithAmount.amount) || 0)?.toFixed(8)
                      )}{' '}
                    </div>
                  </div>
                </div>
              </div>
              {tokenWithAmount.amount ? (
                <div className="relative">
                  <div>
                    <div className="balance-value-usd truncate">
                      ≈ $
                      {splitNumberByStep(
                        (
                          Number(tokenWithAmount.amount) * token.price || 0
                        )?.toFixed(2)
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
        <div className="py-3">
          <Separator className="w-full" />
        </div>
        {token?.chain === 'dbk' ? (
          <div className="flex flex-col gap-1 bg-r-neutral-card-1 rounded-[8px]">
            <div className="flex items-center justify-between gap-[8px] px-[16px] py-[10px]">
              <div className="text-r-neutral-title1 text-[13px] font-medium leading-[16px]">
                {t('page.dashboard.tokenDetail.bridgeToEth')}
              </div>
              <DbkButton
                className="rounded-[6px] font-medium text-[13px] leading-[16px] py-[8px] px-[18px]"
                onClick={() => {
                  setVisible(false);
                  onClose?.();
                  history.push(
                    `/ecology/${DBK_CHAIN_ID}/bridge?activeTab=withdraw`
                  );
                }}
              >
                {t('page.dashboard.tokenDetail.bridge')}
              </DbkButton>
            </div>
          </div>
        ) : null}
        <TokenChainAndContract
          entityLoading={entityLoading}
          token={token}
          tokenEntity={tokenEntity}
          popupHeight={popupHeight}
        ></TokenChainAndContract>
        <div className="py-3">
          <Separator className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-primary-foreground text-base  pb-1 font-normal">
            Your activity
          </div>
          <HistoryList
            chainId={token.chain}
            tokenId={token.id}
            pageCount={10}
          />
        </div>
      </div>
      {/* {BottomBtn} */}
    </div>
  );
};

export default TokenDetail;
