import React from 'react';
import { TBody, THeadCell, THeader, Table } from './Table';
import { TokenItem, Props as TokenItemProps } from '../TokenItem';
import { FixedSizeList as VirtualList } from 'react-window';
import { TokenDetailPopup } from '@/ui/views/Dashboard/components/TokenDetailPopup';
import { TokenItem as TokenItemType } from '@/background/service/openapi';
import { useTranslation } from 'react-i18next';

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
  const [selected, setSelected] = React.useState<TokenItemProps['item']>();
  const [visible, setVisible] = React.useState(false);
  const [token, setToken] = React.useState<TokenItemType>();

  React.useEffect(() => {
    setVisible(!!selected);

    if (selected) {
      setToken({
        ...selected,
        id: selected._tokenId,
      });
    } else {
      setToken(undefined);
    }
  }, [selected]);

  if (EmptyComponent && !list?.length) {
    return <>{EmptyComponent}</>;
  }

  return (
    <>
      <div className="h-full">
        <Table className="!w-full  ml-0 mr-0">
          <TBody className="flex flex-col gap-5 pb-5">
            {list?.map((item) => (
              <TokenItem
                key={`${item.chain}-${item.id}`}
                item={item}
                onClick={() => setSelected(item)}
              />
            ))}
          </TBody>
        </Table>
      </div>

      <TokenDetailPopup
        variant="add"
        token={token}
        visible={visible}
        onClose={() => setSelected(undefined)}
      />
    </>
  );
};
