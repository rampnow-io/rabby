import { get, last } from 'lodash';
import React, { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAccount } from '@/ui/store-hooks';
import { useInfiniteScroll } from 'ahooks';
import { Empty, Modal } from 'ui/component';
import { sleep, useWallet } from 'ui/utils';

import { HistoryItem, HistoryItemActionContext } from './HistoryItem';
import { Loading } from './Loading';
import { CHAINS } from '@/constant';
import {
  TxHistoryItem,
  TxHistoryResult,
} from '@rabby-wallet/rabby-api/dist/types';
import { getTxnHistory } from '@/snippets/client';
import { getMainnetChainList } from '@/utils/chain';

const PAGE_COUNT = 10;

export const HistoryList = ({
  isFilterScam = false,
  selectedChainId,
}: {
  isFilterScam?: boolean;
  selectedChainId?: string | null;
}) => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [account] = useAccount();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [
    focusingHistoryItem,
    setFocusingHistoryItem,
  ] = useState<HistoryItemActionContext | null>(null);

  const listTxHistory = async (
    address: string,
    startTime: number,
    pageCount: number
  ) => {
    const allSupportedChains = getMainnetChainList().map(
      (chain) => chain.serverId
    );

    const tokenHistory = await getTxnHistory({
      body: {
        address: address,
        chains: allSupportedChains,
        page_size: pageCount,
        to_timestamp: startTime,
      },
    });

    return (tokenHistory.data?.data
      ?.history_list as unknown) as TxHistoryResult;
  };

  const fetchData = async (startTime = 0) => {
    const { address } = account!;
    if (startTime) await sleep(500);

    const res = await listTxHistory(address, startTime, 100);
    if (!res) {
      return { list: [] };
    }

    const { project_dict, cate_dict, history_list } = res;

    const list = history_list
      .map((item) => ({
        ...item,
        projectDict: project_dict,
        cateDict: cate_dict,
        tokenDict: 'token_dict' in res ? res.token_dict : undefined,
        tokenUUIDDict:
          'token_uuid_dict' in res ? res.token_uuid_dict : undefined,
      }))
      .sort((a, b) => b.time_at - a.time_at);

    return {
      list,
      last: last(list)?.time_at,
    };
  };

  const { data, loading, loadingMore } = useInfiniteScroll(
    (d) => fetchData(d?.last),
    {
      target: scrollRef,
      isNoMore: (d) =>
        isFilterScam ? true : !d?.last || (d?.list?.length || 0) < PAGE_COUNT,
    }
  );

  const chainList = data?.list?.filter((item) => {
    if (!selectedChainId) return true;
    return item.chain === selectedChainId;
  });

  const isEmpty = !loading && (chainList?.length || 0) === 0;

  return (
    <div className="h-full relative">
      {/* View Input Modal */}
      <Modal
        visible={!!focusingHistoryItem}
        title={t('page.transactions.modalViewMessage.title')}
        onCancel={() => setFocusingHistoryItem(null)}
        maxHeight="360px"
      >
        <div className="text-14">{focusingHistoryItem?.parsedInputData}</div>
      </Modal>

      {/* Loading */}
      {loading && (
        <div className={isFilterScam ? 'pt-[20px]' : ''}>
          {isFilterScam && (
            <div className="fixed top-[55px] left-0 right-0 z-[100] text-center text-[12px]">
              {t('page.transactions.filterScam.loading')}
            </div>
          )}
          <Loading count={4} active />
        </div>
      )}

      {/* Empty */}
      {isEmpty && (
        <div className="h-full w-full flex justify-center items-center text-primary-foreground font-medium">
          <span>No transactions found on this wallet.</span>
        </div>
      )}

      {/* List */}
      {!loading && !isEmpty && (
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain"
        >
          {chainList?.map((item) => {
            const isFailed = item.tx?.status === 0;

            // if (isFailed) {
            //   return null;
            // }

            return (
              <div key={item.id} className="flex flex-col gap-4">
                <HistoryItem
                  data={item}
                  projectDict={item.projectDict}
                  cateDict={item.cateDict}
                  tokenDict={item.tokenDict || item.tokenUUIDDict || {}}
                  onViewInputData={setFocusingHistoryItem}
                />
              </div>
            );
          })}

          {loadingMore && <Loading count={2} active />}
        </div>
      )}
    </div>
  );
};
