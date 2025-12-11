import { NFTApproval } from '@/background/service/openapi';
import { ellipsis } from '@/ui/utils/address';
import NFTAvatar from '@/ui/views/Dashboard/components/NFT/NFTAvatar';
import { Button } from 'antd';
import React from 'react';

interface NFTListItemProps {
  item: NFTApproval;
  onDecline(item: any): void;
}

const NFTListItem = ({ item, onDecline }: NFTListItemProps) => {
  return (
    <div className="flex items-center px-[8px] pl-[12px] py-[10px] border border-transparent rounded-[6px] gap-[8px] overflow-hidden cursor-pointer hover:bg-r-blue-light1 hover:border-r-blue-default group">
      <NFTAvatar
        className="w-[32px] h-[32px] rounded-[2px] flex-shrink-0 border-0"
        thumbnail
        type={item.content_type}
        content={item.content}
        chain={item.chain}
      ></NFTAvatar>
      <div className="flex-1">
        <div className="text-[13px] font-medium leading-[15px] text-r-neutral-title1 mb-[2px] truncate max-w-[200px]">
          {item.name || 'Unknown NFT'}
        </div>
        <div className="text-[12px] leading-[14px] text-r-neutral-foot truncate">
          {item.amount} NFT
        </div>
      </div>
      <div className="flex flex-col items-end gap-[4px] ml-auto text-right">
        <div className="text-[13px] font-medium leading-[15px] text-r-neutral-title1 text-right group-hover:hidden">
          {item.spender?.protocol?.name}
          {!item.spender?.protocol && (
            <span className="bg-rabby-neutral-line rounded-[2px] text-[12px] leading-[14px] text-r-neutral-foot px-[4px] py-[2px] font-normal">
              Unknown Contract
            </span>
          )}
        </div>
        <div className="text-[12px] leading-[14px] text-r-neutral-foot group-hover:hidden truncate">
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
            onDecline(item);
          }}
        >
          Decline
        </Button>
      </div>
    </div>
  );
};

export default NFTListItem;
