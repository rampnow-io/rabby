import {
  TokenItem,
  TxDisplayItem,
  TxHistoryItem,
} from '@/background/service/openapi';
import { sinceTime, useWallet } from 'ui/utils';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import { getChain } from '@/utils';
import { numberWithCommasIsLtOne } from 'ui/utils';
import { TokenChange, TxId, TxInterAddressExplain } from '@/ui/component';
import { useTranslation } from 'react-i18next';
import { useAsync } from 'react-use';

import IconInputData from '../icons/input-data.svg';
import { useRabbySelector } from '@/ui/store';
import { Skeleton, Tooltip } from 'antd';
import { AddressType } from '@/ui/utils/address';
import { Chain } from '@debank/common';
import {
  useCheckAddressType,
  useParseContractAddress,
} from '@/ui/hooks/useParseAddress';
import { formatTxInputDataOnERC20 } from '@/ui/utils/transaction';
import { findChainByServerID } from '@/utils/chain';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';

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
      ['send', 'receive'].includes(data.cate_id) &&
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
  const isFailed = data.tx?.status === 0;
  const isScam = data.is_scam;

  const { addressType } = useCheckAddressType(data.tx?.to_addr, chainItem);

  const { t } = useTranslation();
  const account = useRabbySelector((state) => state.account.currentAccount);

  const cateName =
    data.cate_id && cateDict ? cateDict[data.cate_id]?.name : undefined;

  if (!chainItem) {
    return <div></div>;
  }

  return (
    <div
      className={clsx(
        'relative mb-[12px] rounded-[12px] bg-white px-[14px] py-[12px]',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        (isScam || isFailed) && 'opacity-70'
      )}
    >
      {/* ===== HEADER ===== */}
      <div className="flex items-start justify-between gap-[8px]">
        <div className="flex flex-col gap-[2px]">
          <div className="flex items-center gap-[6px]">
            <span className="text-[14px] font-medium text-r-neutral-title-1">
              {cateName || 'Transaction'}
            </span>

            {isFailed && (
              <span className="text-[11px] px-[6px] py-[1px] rounded-full bg-r-red-light text-r-red-default font-medium">
                {t('global.failed')}
              </span>
            )}

            {isScam && (
              <span className="text-[11px] px-[6px] py-[1px] rounded-full bg-r-neutral-line text-r-neutral-foot">
                {t('global.scamTx')}
              </span>
            )}
          </div>

          <div className="text-[12px] text-r-neutral-foot">
            {sinceTime(data.time_at)}
          </div>
        </div>

        <div className="flex items-center gap-[6px]">
          <TxId chain={data.chain} id={data.id} />
          {addressType === AddressType.EOA && !data.is_scam && (
            <ViewMessageTriggerForEoa
              userAddress={account?.address || ''}
              txInputData={data.tx?.message || ''}
              chainItem={chainItem}
              onViewInputData={onViewInputData}
            />
          )}
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="mt-[10px] flex flex-col gap-[8px]">
        <TxInterAddressExplain
          data={data}
          projectDict={projectDict}
          tokenDict={tokenDict}
          cateDict={cateDict}
        />

        <TokenChange data={data} tokenDict={tokenDict} />
      </div>

      {/* ===== FOOTER ===== */}
      {(data.tx?.eth_gas_fee || isFailed) && (
        <div className="mt-[10px] flex items-center justify-between text-[12px] text-r-neutral-foot border-t pt-[8px]">
          {data.tx?.eth_gas_fee ? (
            <span>
              {t('global.gas')}{' '}
              {numberWithCommasIsLtOne(data.tx.eth_gas_fee, 2)}{' '}
              {chainItem.nativeTokenSymbol}
              {' · $'}
              {numberWithCommasIsLtOne(data.tx.usd_gas_fee ?? 0, 2)}
            </span>
          ) : (
            <span />
          )}

          <span className="uppercase text-[11px]">{chainItem.name}</span>
        </div>
      )}
    </div>
  );
};
