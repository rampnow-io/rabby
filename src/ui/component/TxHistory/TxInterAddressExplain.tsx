import { TxDisplayItem, TxHistoryItem } from '@/background/service/openapi';
import React from 'react';
import { NameAndAddress } from '..';
import { getTokenSymbol } from 'ui/utils/token';
import { TxAvatar } from './TxAvatar';
import { useTranslation } from 'react-i18next';

type TxInterAddressExplainProps = {
  data: TxDisplayItem | TxHistoryItem;
} & Pick<TxDisplayItem, 'cateDict' | 'projectDict' | 'tokenDict'>;

export const TxInterAddressExplain = ({
  data,
  projectDict,
  tokenDict,
  cateDict,
}: TxInterAddressExplainProps) => {
  const isCancel = data.cate_id === 'cancel';
  const isApprove = data.cate_id === 'approve';
  const project = data.project_id ? projectDict[data.project_id] : null;
  const { t } = useTranslation();

  const projectName = (
    <span>
      {project?.name ? (
        project.name
      ) : data.other_addr ? (
        <NameAndAddress address={data.other_addr} copyIcon={!data.is_scam} />
      ) : (
        ''
      )}
    </span>
  );

  let interAddressExplain;

  if (isCancel) {
    interAddressExplain = (
      <div className="text-[15px] font-medium text-r-neutral-title1 mb-[4px]">
        {t('page.transactions.explain.cancel')}
      </div>
    );
  } else if (isApprove) {
    const tokenId = data.token_approve?.token_id || '';
    const tokenUUID = `${data.chain}_token:${tokenId}`;

    const approveToken = tokenDict[tokenId] || tokenDict[tokenUUID];

    const amount = data.token_approve?.value || 0;

    // todo: translate
    interAddressExplain = (
      <div className="tx-explain-title">
        Approve {amount < 1e9 ? amount.toFixed(4) : 'infinite'}{' '}
        {`${getTokenSymbol(approveToken)} for `}
        {projectName}
      </div>
    );
  } else {
    interAddressExplain = (
      <>
        <div className="text-[15px] font-medium text-r-neutral-title1 mb-[4px]">
          {cateDict[data.cate_id || '']?.name ??
            (data.tx?.name || t('page.transactions.explain.unknown'))}
        </div>
        <div className="text-[13px] text-r-neutral-body">{projectName}</div>
      </>
    );
  }

  return (
    <div className="ui tx-explain">
      <TxAvatar
        src={projectDict[data.project_id as string]?.logo_url}
        cateId={data.cate_id}
        className="w-[28px] h-[28px] rounded-full mr-[12px] flex-shrink-0"
      ></TxAvatar>
      <div className="flex-1">{interAddressExplain}</div>
    </div>
  );
};
