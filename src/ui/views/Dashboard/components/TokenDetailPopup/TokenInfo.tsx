import React, { useCallback } from 'react';
import { ReactComponent as RcIconHelp } from 'ui/assets/tokenDetail/IconHelp.svg';
import { ReactComponent as IconCopy } from 'ui/assets/tokenDetail/IconCopy.svg';
import IconBridged from 'ui/assets/tokenDetail/IconBridged.svg';
import IconNative from 'ui/assets/tokenDetail/IconNative.svg';
import IconNoFind from 'ui/assets/tokenDetail/IconNoFind.svg';
// import { ellipsisAddress } from '@/utils/address';
import { findChain, findChainByServerID } from '@/utils/chain';
import { useMemoizedFn } from 'ahooks';
import { ReactComponent as IconArrowRight } from 'ui/assets/tokenDetail/IconBack.svg';
import { Popup } from '@/ui/component';
import { PopupProps } from '@/ui/component/Popup';
import IconUnknown from 'ui/assets/token-default.svg';
import { ReactComponent as RcIconExternal } from 'ui/assets/tokenDetail/IconJump.svg';
import { useTranslation } from 'react-i18next';
// import { formatUsdValueKMB } from '@/screens/Home/utils/price';
import { Copy, TokenWithChain } from 'ui/component';
import { getUITypeName, openInTab } from '@/ui/utils';
import { getAddressScanLink, getChain } from '@/utils';
import ChainIcon from '../NFT/ChainIcon';
import { ellipsis, ellipsisAddress } from '@/ui/utils/address';
import { formatUsdValueKMB } from './utils';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import {
  TokenEntityDetail,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { getTokenSymbol } from '@/ui/utils/token';
import { getUiType } from '@/ui/utils';
import { TokenDetailPopup } from '.';
import styled from 'styled-components';
import { Skeleton, Tooltip } from 'antd';
import clsx from 'clsx';
import { copyAddress } from '@/ui/utils/clipboard';
import { usePopupContainer } from '@/ui/hooks/usePopupContainer';
import { useLocation } from 'react-router-dom';
import { CopyField } from '@repo/ui';

const isDesktop = getUiType().isDesktop;
const Divide = styled.div`
  height: 1px;
  height: 0.5px;
  background-color: var(--r-neutral-card2, #f2f4f7);
  display: flex;
  flex: 1;
`;
const BridgeOrNative = ({
  token,
  tokenEntity,
}: {
  token: TokenItem;
  tokenEntity?: TokenEntityDetail;
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = React.useState(false);

  const isBridgeDomain =
    tokenEntity?.bridge_ids && tokenEntity.bridge_ids.length > 0;
  const isVerified = tokenEntity?.is_domain_verified;

  return tokenEntity ? (
    <>
      <div className="flex flex-col gap-3 bg-r-neutral-card-1 rounded-[8px]  py-12">
        {tokenEntity?.domain_id ? (
          <>
            {isVerified && (
              <>
                <div className="flex flex-row gap-2 justify-center items-center px-16  w-full ">
                  <Divide className="bg-r-neutral-line" />
                  {isBridgeDomain ? (
                    <div className="text-r-neutral-foot text-12 flex flex-row">
                      <img src={IconBridged} className="w-14 mr-4" />
                      {t('page.dashboard.tokenDetail.BridgeIssue')}
                    </div>
                  ) : (
                    <div className="text-r-neutral-foot text-12 flex flex-row">
                      <img src={IconNative} className="w-14 mr-4" />
                      {t('page.dashboard.tokenDetail.OriginIssue')}
                    </div>
                  )}
                  <Divide className="bg-r-neutral-line" />
                </div>
              </>
            )}
            <div className="flex flex-row items-center justify-between w-full px-16">
              <div className="text-r-neutral-body text-13 font-normal">
                {isBridgeDomain
                  ? t('page.dashboard.tokenDetail.BridgeProvider')
                  : t('page.dashboard.tokenDetail.IssuerWebsite')}
              </div>
              <div
                onClick={() => {
                  openInTab(`https://${tokenEntity?.domain_id}`);
                }}
                className="
              text-r-neutral-title-1 text-13 font-medium
              flex flex-row items-center gap-6 cursor-pointer 
              border border-transparent 
              bg-r-neutral-card-2
              hover:bg-blue-light hover:bg-opacity-[0.1] hover:border-rabby-blue-default
              rounded-[6px] px-12 py-6"
              >
                <span className="text-r-neutral-title-1 text-13 font-medium truncate max-w-[170px]  overflow-ellipsis whitespace-nowrap">
                  {tokenEntity?.domain_id}
                </span>
                <ThemeIcon
                  src={RcIconExternal}
                  className="w-14 text-r-neutral-foot"
                />
              </div>
            </div>
            {isBridgeDomain && tokenEntity.origin_token && (
              <div className="flex flex-row items-center justify-between w-full px-16">
                <div className="text-r-neutral-body text-13 font-normal">
                  {t('page.dashboard.tokenDetail.OriginalToken')}
                </div>

                <div
                  className="
              text-r-neutral-title-1 text-13 font-medium
              flex flex-row items-center gap-6 cursor-pointer 
              border border-transparent 
              bg-r-neutral-card-2
              hover:bg-blue-light hover:bg-opacity-[0.1] hover:border-rabby-blue-default
              rounded-[6px] px-12 py-6"
                  onClick={() => {
                    setVisible(true);
                  }}
                >
                  <TokenWithChain
                    token={tokenEntity.origin_token}
                    hideChainIcon={true}
                    hideConer
                    width="16px"
                    height="16px"
                  ></TokenWithChain>
                  {getTokenSymbol(tokenEntity.origin_token)}
                  <ThemeIcon
                    src={RcIconExternal}
                    className="w-14 text-r-neutral-foot"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-r-neutral-foot text-13 flex flex-row items-center justify-center w-full">
            <img src={IconNoFind} className="w-14 mr-4" />
            {t('page.dashboard.tokenDetail.noIssuer')}
          </div>
        )}
      </div>

      {tokenEntity?.origin_token && (
        <TokenDetailPopup
          variant="add"
          token={tokenEntity?.origin_token}
          visible={visible}
          onClose={() => setVisible(false)}
        />
      )}
    </>
  ) : null;
};

const ChainAndName = ({
  token,
  tokenEntity,
}: {
  token: TokenItem;
  tokenEntity?: TokenEntityDetail;
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = React.useState(false);

  const isShowAddress = /^0x.{40}$/.test(token.id);

  const handleClickLink = (token: TokenItem) => {
    const serverId = token.chain;
    const chain = findChain({
      serverId: serverId,
    });
    if (!chain) return;
    const link = getAddressScanLink(chain.scanLink, token.id);
    const needClose = getUITypeName() !== 'notification';
    openInTab(link, needClose);
  };

  const chain = findChain({
    serverId: token.chain,
  });

  return (
    <div className="flex flex-col gap-1">
      <div className="text-base text-primary-foreground pb-1 font-light">
        Token details
      </div>
      <div className="flex flex-col gap-1.5 bg-r-neutral-card-1 rounded-[8px]">
        <div className="flex flex-row justify-between w-full  ">
          <span className="text-primary-foreground text-[13px] font-light">
            Token
          </span>

          <div className="flex flex-row items-center gap-1.5">
            <img src={token?.logo_url} className="w-[16px] h-[16px]" />
            <span className="text-secondary-foreground text-[13px] font-light">
              {token.name || ''}
            </span>
          </div>
        </div>
        <div className="flex flex-row justify-between w-full  ">
          <span className="text-primary-foreground text-[13px] font-light">
            Network
          </span>
          <div className="flex flex-row items-center gap-1.5">
            <img src={chain?.logo} className="w-[16px] h-[16px]" />
            <span className="text-secondary-foreground text-[13px] font-light">
              {getChain(token?.chain)?.name}
            </span>
          </div>
        </div>
        {isShowAddress && (
          <div className="flex flex-row justify-between w-full ">
            <span className="text-primary-foreground text-[13px] font-light">
              {t('page.dashboard.tokenDetail.ContractAddress')}
            </span>
            <div className="flex flex-row items-center gap-1.5">
              <CopyField
                value={token.id}
                group={[4, 4]}
                className="text-[16px] text-primary-foreground font-medium"
              />
              {/* <Copy
              data={token.id}
              variant="address"
              className="w-14 cursor-pointer text-primary-foreground font-medium"
            /> */}
            </div>
          </div>
        )}
        <div className="flex flex-row justify-between w-full ">
          <div className="flex flex-row items-center gap-1">
            <span className="text-primary-foreground text-[13px] font-light">
              {'FDV'}
            </span>
            <div className="relative">
              <TooltipWithMagnetArrow
                className="rectangle w-[max-content]"
                title={t('page.dashboard.tokenDetail.fdvTips')}
              >
                <ThemeIcon
                  src={RcIconHelp}
                  className="w-[14px] text-primary-foreground"
                ></ThemeIcon>
              </TooltipWithMagnetArrow>
            </div>
          </div>
          <span className="text-secondary-foreground text-[13px] font-light">
            {tokenEntity?.fdv ? formatUsdValueKMB(tokenEntity.fdv) : '-'}
          </span>
        </div>
        {tokenEntity?.origin_token && (
          <TokenDetailPopup
            variant="add"
            token={tokenEntity?.origin_token}
            visible={visible}
            onClose={() => setVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

const ListSiteAndCex = ({
  siteArr,
  title,
  noSiteString,
  popupHeight,
}: {
  popupHeight: number;
  title: string;
  noSiteString: string;
  siteArr?:
    | TokenEntityDetail['listed_sites']
    | TokenEntityDetail['cex_list']
    | undefined;
}) => {
  const { getContainer: fromModalContainer } = usePopupContainer();
  const location = useLocation();
  const action = new URLSearchParams(location.search).get('action');
  const isInDesktopActionModal =
    isDesktop &&
    (action === 'send' || action === 'swap' || action === 'bridge');
  const isInSendModal =
    new URLSearchParams(location.search).get('action') === 'send';
  const getContainer = isInDesktopActionModal
    ? isInSendModal
      ? '.js-rabby-popup-container'
      : '.js-rabby-desktop-swap-container'
    : fromModalContainer;
  const { t } = useTranslation();
  const [detailVisible, setDetailVisible] = React.useState(false);

  if (!siteArr?.length) {
    return (
      <div className="flex flex-col gap-3 bg-r-neutral-card-1 rounded-[8px]  py-12">
        <div className="text-r-neutral-foot text-[13px] flex flex-row items-center justify-center w-full">
          <img src={IconNoFind} className="w-14 mr-4" />
          {noSiteString}
        </div>
      </div>
    );
  }

  return (
    <>
      <Popup
        visible={detailVisible}
        maskClosable
        closable={true}
        onClose={() => setDetailVisible(false)}
        placement="bottom"
        getContainer={getContainer}
        height={popupHeight}
        push={false}
        className="token-detail-popup"
        title={
          <div className="text-r-neutral-title-1 text-20 font-medium">
            {/* <ThemeIcon
              src={RcIconBackNew}
              className={clsx('icon icon-back absolute left-0 cursor-pointer')}
              onClick={() => setDetailVisible(false)}
            /> */}
            {title}
          </div>
        }
        destroyOnClose
      >
        <div className="flex flex-1 flex-col py-[12px] px-1 gap-3 overflow-y-auto">
          {siteArr?.map((item, index) => (
            <div
              key={index}
              className="w-full flex flex-row items-center justify-between px-4 py-4 
              rounded-[6px]
              border border-transparent 
              bg-r-neutral-card-1
              hover:bg-blue-light hover:bg-opacity-[0.1] hover:border-rabby-blue-default
              cursor-pointer"
              onClick={() => {
                openInTab(item.url || item.site_url);
              }}
            >
              <div className="flex flex-row gap-6 text-r-neutral-title-1 text-15">
                <img
                  key={index}
                  src={item.logo_url}
                  className="w-[20px] h-[20px] rounded-full"
                ></img>
                {item.name}
              </div>
              <ThemeIcon
                src={RcIconExternal}
                className="w-[14px] text-r-neutral-foot"
              />
            </div>
          ))}
        </div>
      </Popup>
    </>
  );
};

const TokenChainAndContract = ({
  token,
  tokenEntity,
  popupHeight,
  entityLoading,
}: {
  token: TokenItem;
  popupHeight: number;
  entityLoading: boolean;
  tokenEntity?: TokenEntityDetail;
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <ChainAndName token={token} tokenEntity={tokenEntity} />
    </div>
  );
};

export default TokenChainAndContract;
