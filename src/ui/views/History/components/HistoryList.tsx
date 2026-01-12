import { last } from 'lodash';
import React, { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAccount } from '@/ui/store-hooks';
import { useInfiniteScroll } from 'ahooks';
import { Empty, Modal } from 'ui/component';
import { sleep, useWallet } from 'ui/utils';

import { HistoryItem, HistoryItemActionContext } from './HistoryItem';
import { Loading } from './Loading';

const PAGE_COUNT = 10;

export const HistoryList = ({
  isFilterScam = false,
}: {
  isFilterScam?: boolean;
}) => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [account] = useAccount();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [
    focusingHistoryItem,
    setFocusingHistoryItem,
  ] = useState<HistoryItemActionContext | null>(null);

  const getAllTxHistory = async (
    params: Parameters<typeof wallet.openapi.getAllTxHistory>[0]
  ) => {
    const res = await wallet.openapi.getAllTxHistory(params);
    if (res.history_list) {
      res.history_list = res.history_list.filter((item) => !item.is_scam);
    }
    return res;
  };

  const fetchData = async (startTime = 0) => {
    const { address } = account!;
    if (startTime) await sleep(500);

    const apiLevel = await wallet.getAPIConfig([], 'ApiLevel', false);
    if (apiLevel >= 1) {
      return { list: [] };
    }

    const res = isFilterScam
      ? await getAllTxHistory({ id: address })
      : await wallet.openapi.listTxHisotry({
          id: address,
          start_time: startTime,
          page_count: PAGE_COUNT,
        });

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

  const isEmpty = !loading && (data?.list?.length || 0) === 0;

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
        <Empty
          title={t('page.transactions.empty.title')}
          desc={
            <span>
              <Trans i18nKey="page.transactions.empty.desc" t={t}>
                No transactions found on{' '}
                <Link to="/settings/chain-list" className="underline">
                  supported chains
                </Link>
              </Trans>
            </span>
          }
          className="pt-[108px]"
        />
      )}

      {!loading && !isEmpty && (
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain"
        >
          {data?.list?.map((item) => {
            const isFailed = item.tx?.status === 0;

            if (isFailed) {
              return null;
            }

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
