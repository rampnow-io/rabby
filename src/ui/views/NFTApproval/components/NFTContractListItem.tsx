import { NFTApprovalContract } from '@/background/service/openapi';
import { connectStore, useRabbySelector } from '@/ui/store';
import { ellipsis } from '@/ui/utils/address';
import { getKRCategoryByType } from '@/utils/transaction';
import { Button } from 'antd';
import React from 'react';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { getChain } from '@/utils';
import { getAmountText } from '../utils';

interface NFTContractListItemProps {
  item: NFTApprovalContract;
  onDecline(item: any): void;
}

const NFTContractListItem = ({ item, onDecline }: NFTContractListItemProps) => {
  const currentAccount = useRabbySelector((s) => s.account.currentAccount);

  return (
    <div className="flex items-center px-[8px] pl-[12px] py-[10px] border border-transparent rounded-[6px] gap-[8px] overflow-hidden cursor-pointer hover:bg-r-blue-light1 hover:border-r-blue-default group">
      <div className="flex-1">
        <div className="text-[15px] font-medium text-r-neutral-title1 mb-[4px]">
          {item.contract_name || 'Unknown NFT'} (
          {getAmountText(item?.amount || 0)})
        </div>
        <div className="text-[13px] text-r-neutral-body">
          {ellipsis(item.contract_id)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[4px] ml-auto text-right">
        <div className="text-[15px] font-medium text-r-neutral-title1 text-right group-hover:hidden">
          {item.spender?.protocol?.name}
          {!item.spender?.protocol && (
            <span className="bg-rabby-neutral-line rounded-[2px] text-[12px] leading-[14px] text-r-neutral-foot px-[4px] py-[2px] font-normal">
              Unknown Contract
            </span>
          )}
        </div>
        <div className="text-[13px] text-r-neutral-body group-hover:hidden">
          {ellipsis(item.spender.id)}
        </div>
        <Button
          type="primary"
          danger
          ghost
          shape="round"
          size="small"
          className="hidden group-hover:block !bg-[rgba(236,81,81,0.1)] !border-[#ec5151] !rounded-[20px] !text-[#ec5151] !text-[12px] !leading-[14px] !font-normal !shadow-none before:!hidden"
          onClick={() => {
            matomoRequestEvent({
              category: 'Security',
              action: 'startDeclineNFTApproval',
              label: [
                getChain(item.chain)?.name,
                getKRCategoryByType(currentAccount?.type),
                currentAccount?.brandName,
              ].join('|'),
            });
            onDecline(item);
          }}
        >
          Decline
        </Button>
      </div>
    </div>
  );
};

export default connectStore()(NFTContractListItem);
