import { get, last } from 'lodash';
import React, { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoTokenIcon1 from '@/ui/assets/no-tokens-icon-1.svg';
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
import { Button } from '@repo/ui/primitives';

const PAGE_COUNT = 10;

export const HistoryList = ({
  isFilterScam = false,
  chainId,
  tokenId,
  pageCount = 100,
}: {
  isFilterScam?: boolean;
  chainId?: string;
  tokenId?: string;
  pageCount?: number;
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

    // const res = isFilterScam
    //   ? await getAllTxHistory({ id: address })
    //   : await wallet.openapi.listTxHisotry({
    //       id: address,
    //       chain_id: chainId,
    //       token_id: tokenId,
    //       start_time: startTime,
    //       page_count: pageCount,
    //     });

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
        isFilterScam ? true : !d?.last || (d?.list?.length || 0) < pageCount,
    }
  );

  const chainList = data?.list?.filter((item) => {
    if (!chainId) return true;
    return item.chain === chainId;
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
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <div className="flex items-center justify-center gap-2">
            <img
              src={NoTokenIcon1}
              alt="No tokens icon 1"
              className="w-full h-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-primary-foreground text-center">
              No transactions found on this wallet.
            </h3>
            <p className="text-14 text-secondary-foreground text-center">
              Buy your first crypto with Rampnow
            </p>
          </div>

          <Button
            className="w-full"
            onClick={() =>
              window.open('https://app.rampnow.io/order/quote', '_blank')
            }
          >
            Buy
          </Button>
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
