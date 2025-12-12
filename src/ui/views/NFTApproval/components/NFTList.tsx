import { NFTApproval } from '@/background/service/openapi';
import { Empty } from '@/ui/component';
import { connectStore, useRabbySelector } from '@/ui/store';
import { getKRCategoryByType } from '@/utils/transaction';
import React from 'react';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { useTranslation } from 'react-i18next';
import IconSearch from 'ui/assets/search.svg';
import { getChain } from '@/utils';
import { Loading } from './Loading';
import NFTListItem from './NFTListItem';

interface ApprovalCardProps {
  data?: NFTApproval[];
  loading?: boolean;
  onSearch(): void;
  onDecline(item: NFTApproval): void;
}

const NFTList = ({ data, loading, onSearch, onDecline }: ApprovalCardProps) => {
  const { t } = useTranslation();
  const currentAccount = useRabbySelector((s) => s.account.currentAccount);

  return (
    <div className="rounded-[6px] bg-white">
      <div
        className="border border-transparent border-b-rabby-neutral-line px-[12px] py-[10px] flex items-center gap-[8px] cursor-pointer hover:border-r-blue-default hover:rounded-[6px]"
        onClick={onSearch}
      >
        <img src={IconSearch} alt="" />
        <div className="text-[13px] leading-[15px] text-r-neutral-foot opacity-40">
          {t('Search Contracts  / NFTs')}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="px-[12px] py-[12px] text-[12px] leading-[14px] text-r-neutral-foot">
          {t('NFTs')}
        </div>
        <div className="px-[12px] py-[12px] text-[12px] leading-[14px] text-r-neutral-foot">
          {t('Approved to')}
        </div>
      </div>
      <div className="h-[295px] overflow-auto">
        {loading && <Loading />}
        {!loading && (!data || data.length <= 0) && (
          <Empty className="pt-[80px]">{t('No Approvals')}</Empty>
        )}
        {!loading &&
          data?.map((item) => (
            <NFTListItem
              item={item}
              onDecline={(item) => {
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
              key={item.id}
            ></NFTListItem>
          ))}
      </div>
    </div>
  );
};

export default connectStore()(NFTList);
