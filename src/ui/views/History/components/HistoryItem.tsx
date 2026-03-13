import {
  TokenItem,
  TxDisplayItem,
  TxHistoryItem,
} from '@/background/service/openapi';
import { sinceTime, useWallet } from 'ui/utils';
import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { getChain } from '@/utils';
import { numberWithCommasIsLtOne } from 'ui/utils';
// compact item does not use these heavy sub-components
import { useTranslation } from 'react-i18next';
import { useAsync } from 'react-use';

import IconInputData from '../icons/input-data.svg';
import { Skeleton, Tooltip } from 'antd';
import { Chain } from '@debank/common';
import { useParseContractAddress } from '@/ui/hooks/useParseAddress';
import { formatTxInputDataOnERC20 } from '@/ui/utils/transaction';
import { findChainByServerID } from '@/utils/chain';
import IconUnknown from 'ui/assets/token-default.svg';
import { ellipsis } from '@/ui/utils/address';
import { getTokenSymbol } from '@/ui/utils/token';
import { ActivityReceived, ActivitySent } from '@/ui/assets';
import { TooltipView } from '@repo/ui/primitives';
import { Console } from 'console';
import ViewModal from './view-modal';

export type HistoryItemActionContext = {
  parsedInputData: string;
};

type ViewMessageTriggerProps = {
  userAddress: string;
  /**
   * @description tx input data, hex format or utf8 format
   */
  txInputData: string | null;
  chainItem: Chain;
  onViewInputData?: (ctx: HistoryItemActionContext) => void;
  isTestnet?: boolean;
};

function ViewMessageTriggerForEoa({
  userAddress,
  txInputData,
  chainItem,
  onViewInputData,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & ViewMessageTriggerProps) {
  const { t } = useTranslation();

  const utf8Data = useMemo(() => {
    if (!txInputData) return null;

    return formatTxInputDataOnERC20(txInputData).utf8Data;
  }, [txInputData]);

  if (!utf8Data) return null;

  return (
    <Tooltip
      overlayClassName="rectangle [&_.ant-tooltip-inner]:px-[6px] [&_.ant-tooltip-inner]:py-[8px] [&_.ant-tooltip-inner]:bg-r-neutral-title1 text-r-neutral-title-2 text-[12px]"
      placement="topLeft"
      arrowPointAtCenter
      // The transaction includes a message
      title={t('page.transactions.txHistory.tipInputData')}
    >
      <span
        {...props}
        className="cursor-pointer bg-r-blue-light-1 w-14 h-14 ml-[8px] flex items-center justify-center padding-2 rounded-[2px]"
        onClick={() => {
          if (!utf8Data) return;

          onViewInputData?.({
            parsedInputData: utf8Data,
          });
        }}
      >
        <img src={IconInputData} className="w-[100%] h-[100%] block" />
      </span>
    </Tooltip>
  );
}

function ViewMessageTriggerForContract({
  contractAddress,
  userAddress,
  txInputData,
  chainItem,
  onViewInputData,
  isTestnet,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  contractAddress: string;
} & ViewMessageTriggerProps) {
  const {
    explain,
    isLoadingExplain,
    loadingExplainError,
    contractCallPlainText,
  } = useParseContractAddress(
    {
      contractAddress,
      chain: chainItem,
      inputDataHex: txInputData
        ? formatTxInputDataOnERC20(txInputData).hexData
        : null,
      userAddress,
    },
    {
      isTestnet,
    }
  );

  const { t } = useTranslation();

  return (
    <>
      {isLoadingExplain && (
        <Skeleton.Button active className="ml-[8px] w-14 h-14 inline-block" />
      )}
      {!isLoadingExplain && explain?.abi && (
        <Tooltip
          overlayClassName="rectangle [&_.ant-tooltip-inner]:px-[6px] [&_.ant-tooltip-inner]:py-[8px] [&_.ant-tooltip-inner]:bg-r-neutral-title1 text-r-neutral-title-2 text-[12px]"
          placement="topLeft"
          arrowPointAtCenter
          // The transaction includes a message
          title={
            loadingExplainError
              ? t('page.transactions.txHistory.parseInputDataError')
              : t('page.transactions.txHistory.tipInputData')
          }
        >
          <span
            {...props}
            className="cursor-pointer bg-r-blue-light-1 w-14 h-14 ml-[8px] flex items-center justify-center padding-2 rounded-[2px]"
            onClick={() => {
              if (loadingExplainError) return;

              onViewInputData?.({
                parsedInputData: contractCallPlainText,
              });
            }}
          >
            <img src={IconInputData} className="w-[40px] h-[40px] block" />
          </span>
        </Tooltip>
      )}
    </>
  );
}

function isTokenItemNative(tokenItem?: TokenItem | null) {
  if (!tokenItem) return false;

  const chainItem = findChainByServerID(tokenItem.chain);
  return !!chainItem?.nativeTokenSymbol;
}

/**
 * @description parse tx from client, request remote info(server & chain api)
 */
function useClientParseTx({
  chainItem,
  data,
  tokenDict,
}: {
  chainItem: Chain | null;
  data: TxDisplayItem | TxHistoryItem;
  tokenDict: Record<string, TokenItem>;
}) {
  const wallet = useWallet();

  const [txInputData, setTxInputData] = React.useState<string | null>(null);
  const isTxNeedInputData = useMemo(() => {
    return (
      !data.is_scam &&
      !!chainItem?.nativeTokenSymbol &&
      data.cate_id &&
      ['send', 'receive', 'bridge', 'swap'].includes(data.cate_id) &&
      ((!data.receives.length && !data.receives.length) ||
        data.receives?.filter((v) => {
          const tokenId = v.token_id;
          const tokenUUID = `${data.chain}_token:${tokenId}`;
          return isTokenItemNative(
            tokenDict[v.token_id] || tokenDict[tokenUUID]
          );
        }).length === 1 ||
        data.sends?.filter((v) => {
          const tokenId = v.token_id;
          const tokenUUID = `${data.chain}_token:${tokenId}`;
          return isTokenItemNative(
            tokenDict[v.token_id] || tokenDict[tokenUUID]
          );
        }).length === 1)
    );
  }, [data, chainItem?.nativeTokenSymbol, tokenDict]);

  useAsync(async () => {
    if (!isTxNeedInputData || !chainItem) {
      setTxInputData(null);
      return;
    }

    try {
      const hashDetail = await wallet.requestETHRpc<any>(
        {
          method: 'eth_getTransactionByHash',
          params: [data.id],
        },
        chainItem.serverId
      );

      if (hashDetail?.input?.length > '0x0'.length) {
        setTxInputData(hashDetail?.input);
      } else {
        setTxInputData(null);
      }
    } catch (err) {
      setTxInputData(null);
    }
  }, [isTxNeedInputData, data.id, chainItem?.serverId]);
}

type HistoryItemProps = {
  data: TxDisplayItem | TxHistoryItem;
  onViewInputData?: (ctx: HistoryItemActionContext) => void;
  isTestnet?: boolean;
} & Pick<TxDisplayItem, 'cateDict' | 'projectDict' | 'tokenDict'>;

export const HistoryItem = ({
  data,
  cateDict,
  projectDict,
  tokenDict,
  onViewInputData,
  isTestnet,
}: HistoryItemProps) => {
  const chainItem = getChain(data.chain);
  // const isFailed = data.tx?.status === 0;
  // const isScam = data.is_scam;
  const [isViewModal, setIsViewModal] = useState(false);
  const { t } = useTranslation();

  const cateName =
    data.cate_id && cateDict ? cateDict[data.cate_id]?.name : undefined;

  if (!chainItem) {
    return <div></div>;
  }
  // console.log('History Item Rendered:', data);
  const tokens = tokenDict || {};
  const mainChange =
    (data.receives && data.receives[0]) || (data.sends && data.sends[0]);
  const isReceive = !!(data.receives && data.receives[0]);
  const tokenId = mainChange?.token_id;
  const tokenUUID = tokenId ? `${data.chain}_token:${tokenId}` : undefined;
  const token = tokenId
    ? tokens[tokenId] || (tokenUUID ? tokens[tokenUUID] : undefined)
    : undefined;
  const tokenLogo = token?.logo_url || chainItem.logo || IconUnknown;
  const tokenSymbol = token
    ? getTokenSymbol(token)
    : chainItem.nativeTokenSymbol;
  const amountText = mainChange
    ? numberWithCommasIsLtOne(mainChange.amount, 2)
    : '';
  const counterparty = isReceive ? data.tx?.from_addr : data.tx?.to_addr;
  const counterpartyLabel = counterparty ? ellipsis(counterparty) : '';

  return (
    <>
      <div
        className={clsx(
          'relative',
          'cursor-pointer flex items-center justify-between px-4',
          'rounded-[16px] border border-transparent bg-[#FAFAFA] hover:bg-[#F4F4F4] h-[60px] mt-4'
        )}
        onClick={() => setIsViewModal(true)}
      >
        <div className="flex items-center">
          <div className="relative w-10 h-10 mr-[12px]">
            {cateName?.toLowerCase() !== 'authorize' && (
              <>
                {isReceive ? (
                  <ActivityReceived className="absolute w-4 h-4 right-[30px] bottom-[25px] rounded-full" />
                ) : (
                  <ActivitySent className="absolute w-4 h-4 right-[30px] bottom-[25px] rounded-full" />
                )}
              </>
            )}

            <img
              src={tokenLogo}
              alt={tokenSymbol || 'token'}
              className="w-10 h-10 rounded-full object-cover"
            />
            <TooltipView content={chainItem?.name}>
              <img
                src={chainItem?.logo || IconUnknown}
                alt={chainItem?.name || 'chain'}
                className="absolute w-4 h-4 right-[-4px] bottom-[-4px] rounded-full border-2 border-white bg-white"
              />
            </TooltipView>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[6px]">
              <span className="text-[14px] font-medium text-r-neutral-title-1">
                {cateName || (isReceive ? 'Received' : 'Sent')}
              </span>
              {/* {isFailed && (
                <span className="text-[11px] px-[6px] py-[1px] rounded-full bg-r-red-light text-r-red-default font-medium">
                  {t('global.failed')}
                </span>
              )} */}
            </div>
            <div className="text-[13px] max-w-[170px] text-secondary-foreground truncate">
              {amountText && tokenSymbol
                ? `${amountText} ${tokenSymbol} ${
                    isReceive ? 'from' : 'to'
                  } ${counterpartyLabel}`
                : undefined}
            </div>
          </div>
        </div>
        <div className="ml-[12px] text-[12px] text-primary-foreground whitespace-nowrap">
          {(() => {
            const now = Date.now() / 1000;
            const diffSeconds = now - data.time_at;

            if (diffSeconds < 60) {
              return `${Math.round(diffSeconds)}s`;
            } else if (diffSeconds < 3600) {
              return `${Math.round(diffSeconds / 60)}m`;
            } else if (diffSeconds < 86400) {
              return `${Math.round(diffSeconds / 3600)}h`;
            } else {
              const date = new Date(data.time_at * 1000);
              const month = date.toLocaleString('en-US', { month: 'short' });
              const day = date.getDate();
              return `${month} ${day}`;
            }
          })()}
        </div>
      </div>
      <ViewModal
        chainItem={chainItem}
        visible={isViewModal}
        onClose={() => setIsViewModal(false)}
        data={data}
        tokenDict={tokenDict}
        cateDict={cateDict}
        projectDict={projectDict}
      />
    </>
  );
};
