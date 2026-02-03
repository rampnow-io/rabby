import BottomFloatingSheet from '@/ui/component/BottomFloatingPopup';
import { sinceTime } from '@/ui/utils';
import React from 'react';
import { getTokenSymbol } from '@/ui/utils/token';
import { Button, ButtonType, TooltipView } from '@repo/ui/primitives';
import { ActivityReceived, ActivitySent } from '@/ui/assets';
import { getChain } from '@/utils';
import { Chain } from '@debank/common';
import { numberWithCommasIsLtOne } from 'ui/utils';
import { ellipsis } from '@/ui/utils/address';
import { Ellipsis } from 'lucide-react';
import IconUnknown from 'ui/assets/token-default.svg';
import {
  TxDisplayItem,
  TxHistoryItem,
  TokenItem,
} from '@/background/service/openapi';
import { findChainByServerID } from '@/utils/chain';
import { truncate } from '@repo/utils';

interface Props {
  visible: boolean;
  onClose: () => void;
  data: TxDisplayItem | TxHistoryItem;
  chainItem: Chain;
  tokenDict?: Record<string, TokenItem>;
  cateDict?: Record<string, { name: string }>;
  projectDict?: Record<string, { name: string }>;
}

const ViewModal = ({
  visible,
  onClose,
  data,
  chainItem,
  tokenDict = {},
  cateDict = {},
  projectDict = {},
}: Props) => {
  const tokens = tokenDict;
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
  const counterpartyLabel = counterparty ? ellipsis(counterparty) : '-';
  const cateName =
    data.cate_id && cateDict ? cateDict[data.cate_id]?.name : undefined;

  return (
    <BottomFloatingSheet hideCloseButton open={visible} onClose={onClose}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-r-neutral-line">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-10 h-10 mr-[12px]">
              {cateName?.toLowerCase() === 'authorize' ? (
                <div />
              ) : isReceive ? (
                <ActivityReceived className="absolute w-4 h-4 right-[30px] bottom-[25px] rounded-full" />
              ) : (
                <ActivitySent className="absolute w-4 h-4 right-[30px] bottom-[25px] rounded-full" />
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
            <div>
              <div className="text-[16px] font-semibold text-r-neutral-title-1">
                {cateName || (isReceive ? 'Received' : 'Sent')}
              </div>
              <div className="text-[13px] text-r-neutral-body">
                {sinceTime(data.time_at)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 h-6 w-6 ml-2 rounded-full flex items-center justify-center"
          >
            <Ellipsis className="text-primary-foreground" size={12} />
          </button>
        </div>

        {/* Amount Section */}
        <div className="flex flex-col items-center gap-3 mb-4">
          {cateName?.toLowerCase() === 'authorize' ? (
            <>
              <div className="text-[32px] font-semibold text-primary-foreground">
                {tokenSymbol}
              </div>
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-r-blue-light-1 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <TooltipView
                  className="px-2"
                  content={`${amountText} ${tokenSymbol}`}
                >
                  <p className="text-primary-foreground text-[26px] font-medium">
                    {amountText} {truncate(tokenSymbol, [5, 1])}
                  </p>
                </TooltipView>
              </div>
              <div className="flex items-center gap-[10px] text-[16px] text-r-neutral-body">
                <div className="relative">
                  <img
                    src={tokenLogo}
                    alt={tokenSymbol || 'token'}
                    className="w-5 h-5 rounded-full"
                  />
                  <img
                    src={chainItem?.logo || IconUnknown}
                    alt={chainItem?.name || 'chain'}
                    className="absolute w-3 h-3 right-[-7px] bottom-[-2px] rounded-full border border-white bg-white"
                  />
                </div>
                <span className="-mt-1">
                  {mainChange?.price && mainChange?.amount
                    ? `$${numberWithCommasIsLtOne(
                        mainChange.amount * mainChange.price,
                        2
                      )}`
                    : ''}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Transaction Details - Only show for non-authorize transactions */}
        {cateName?.toLowerCase() !== 'authorize' && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-r-neutral-title-1">
                From
              </span>
              <span className="text-[14px] text-r-neutral-body">
                {data.tx?.from_addr ? ellipsis(data.tx.from_addr) : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-r-neutral-title-1">
                To
              </span>
              <span className="text-[14px] text-r-neutral-body">
                {counterpartyLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-r-neutral-title-1">
                Transaction
              </span>
              <span className="text-[14px] text-r-neutral-body">
                {ellipsis(data.id)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-r-neutral-title-1">
                Network
              </span>
              <span className="text-[14px] text-r-neutral-body">
                {chainItem?.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-r-neutral-title-1">
                Network cost
              </span>
              <span className="text-[14px] text-r-neutral-body">
                {data.tx?.eth_gas_fee
                  ? `${numberWithCommasIsLtOne(data.tx.eth_gas_fee, 7)} ${
                      chainItem?.nativeTokenSymbol
                    }`
                  : data.tx?.usd_gas_fee
                  ? `$${numberWithCommasIsLtOne(data.tx.usd_gas_fee, 2)}`
                  : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-r-neutral-title-1">
                Confirmed at
              </span>
              <span className="text-[14px] text-r-neutral-body">
                {sinceTime(data.time_at)}
              </span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <Button
          onClick={onClose}
          buttonType={ButtonType.SECONDARY}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </BottomFloatingSheet>
  );
};

export default ViewModal;
