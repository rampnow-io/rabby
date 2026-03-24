import React from 'react';
import { TBody, THeadCell, THeader, Table } from './Table';
import { TokenItem, Props as TokenItemProps } from '../TokenItem';
import { FixedSizeList as VirtualList } from 'react-window';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

export interface Props {
  list?: TokenItemProps['item'][];
  virtual?: {
    height: number;
    itemSize: number;
  };
  EmptyComponent?: React.ReactNode;
}

export const TokenTable: React.FC<Props> = ({
  list,
  virtual,
  EmptyComponent,
}) => {
  const history = useHistory();

  if (EmptyComponent && !list?.length) {
    return <>{EmptyComponent}</>;
  }

  return (
    <>
      <div className="h-full">
        <Table className="!w-full  ml-0 mr-0">
          <TBody className="flex flex-col gap-2">
            {list?.map((item) => (
              <TokenItem
                key={`${item.chain}-${item.id}`}
                item={item}
                onClick={() => {
                  const tokenId = item._tokenId || item.id;
                  history.push(
                    `/token-portfolio?chain=${encodeURIComponent(
                      item.chain
                    )}&tokenId=${encodeURIComponent(tokenId)}`
                  );
                }}
              />
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
};
