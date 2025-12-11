import {
  NFTApproval,
  NFTApprovalContract,
  NFTApprovalResponse,
} from '@/background/service/openapi';
import { Input, InputRef } from 'antd';
import { debounce } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import IconSearch from 'ui/assets/search.svg';
import { Empty, Popup } from 'ui/component';
import NFTContractListItem from './NFTContractListItem';
import NFTListItem from './NFTListItem';

interface PopupSearchProps {
  visible: boolean;
  data?: NFTApprovalResponse | null;
  onClose?(): void;
  onDecline(p: { token?: NFTApproval; contract?: NFTApprovalContract }): void;
}

const PopupSearch = ({
  data,
  visible,
  onClose,
  onDecline,
}: PopupSearchProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<InputRef>(null);

  const filterData = useMemo(() => {
    if (!query) {
      return {
        total: 0,
        tokens: [],
        contracts: [],
      };
    }
    const q = query.toLowerCase().trim();
    return {
      total: '0',
      contracts: data?.contracts.filter((item) => {
        return (
          [item.contract_name, item.spender.protocol?.name].some(
            (str) => str && str.toLowerCase().indexOf(q) !== -1
          ) ||
          [item.contract_id, item.spender.id].some(
            (str) => str && str.toLowerCase() === q
          )
        );
      }),
      tokens: data?.tokens.filter((item) => {
        return (
          [(item.contract_name, item.spender.protocol?.name)].some(
            (str) => str && str.toLowerCase().indexOf(q) !== -1
          ) ||
          [item.id, item.spender.id].some(
            (str) => str && str.toLowerCase() === q
          )
        );
      }),
    } as NFTApprovalResponse;
  }, [data, query]);

  const handleInputChange = useMemo(
    () =>
      debounce((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
      }, 500),
    [setQuery]
  );
  useEffect(() => {
    if (!visible) {
      setQuery('');
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      });
    }
  }, [visible]);

  return (
    <Popup
      visible={visible}
      onClose={onClose}
      title="Search"
      height={580}
      closable
      className="[&_.ant-drawer-body]:pt-0"
    >
      {visible && (
        <>
          <header className="sticky top-0 pt-[12px] pb-[20px] bg-white z-[1]">
            <Input
              size="large"
              prefix={<img src={IconSearch} />}
              placeholder={t('Search Contracts  / NFTs')}
              onChange={handleInputChange}
              autoFocus
              ref={inputRef}
              className="!px-[12px] !py-[12px] !rounded-[6px] !border !border-rabby-neutral-line !bg-rabby-neutral-bg transition-colors hover:!border-r-blue-default focus:!border-r-blue-default focus:!bg-r-blue-light1 [&_.ant-input]:!rounded-0 [&_.ant-input]:!bg-transparent [&.ant-input-affix-wrapper::before]:h-[16px]"
            />
          </header>
          {!!filterData?.contracts.length && (
            <div className="bg-white border border-rabby-neutral-line rounded-[6px] mb-[20px]">
              <div className="bg-[#e5e9ef] rounded-t-[6px] flex justify-between px-[12px] py-[12px]">
                <div className="font-normal text-[12px] leading-[14px] text-r-neutral-foot">{t('NFT Contracts')}</div>
                <div className="font-normal text-[12px] leading-[14px] text-r-neutral-foot">{t('Approved to')}</div>
              </div>
              <div className="p-[16px] space-y-[12px]">
                {filterData?.contracts.map((item) => (
                  <NFTContractListItem
                    item={item}
                    key={item.contract_id}
                    onDecline={(item) => onDecline({ contract: item })}
                  ></NFTContractListItem>
                ))}
              </div>
            </div>
          )}
          {!!filterData?.tokens.length && (
            <div className="bg-white border border-rabby-neutral-line rounded-[6px] mb-[20px]">
              <div className="bg-[#e5e9ef] rounded-t-[6px] flex justify-between px-[12px] py-[12px]">
                <div className="font-normal text-[12px] leading-[14px] text-r-neutral-foot">{t('NFTs')}</div>
                <div className="font-normal text-[12px] leading-[14px] text-r-neutral-foot">{t('Approved to')}</div>
              </div>
              <div className="p-[16px] space-y-[12px]">
                {filterData?.tokens.map((item) => (
                  <NFTListItem
                    item={item}
                    key={item.id}
                    onDecline={(item) => onDecline({ token: item })}
                  ></NFTListItem>
                ))}
              </div>
            </div>
          )}

          {!(filterData?.contracts.length || filterData?.tokens.length) && (
            <Empty className="pt-[80px]">{t('No Results')}</Empty>
          )}
        </>
      )}
    </Popup>
  );
};

export default PopupSearch;
