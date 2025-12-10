import React, {
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useState,
  useLayoutEffect,
} from 'react';
import { ConfigProvider, Empty, Table } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnGroupType, ColumnType } from 'antd/lib/table';

import classNames from 'classnames';
import clsx from 'clsx';
import ResizeObserver from 'rc-resize-observer';
import { VariableSizeGrid as VGrid, areEqual } from 'react-window';

import { ROW_HEIGHT, SCROLLBAR_WIDTH } from '../constant';
import { ReactComponent as RcIconNoMatchCC } from '../icons/no-match-cc.svg';
import { SorterResult } from 'antd/lib/table/interface';
import { useTranslation } from 'react-i18next';

const DEFAULT_SCROLL = { y: 300, x: '100vw' };

function TableBodyEmpty({
  isLoading,
  loadingText = 'Loading...',
  emptyText = 'No Match',
}: {
  isLoading?: boolean;
  loadingText?: string;
  emptyText?: string;
}) {
  return (
    <Empty
      className="am-virtual-table-empty"
      image={
        <RcIconNoMatchCC className="w-[52px] h-[52px] text-r-neutral-body" />
      }
      description={isLoading ? loadingText : emptyText}
    />
  );
}

function TableHeadCell({
  children,
  ...props
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th
      {...props}
      className={classNames('am-virtual-table-head-cell', props.className)}
    >
      {children}
    </th>
  );
}

export type IVGridContextualPayload<RecordType> = {
  columnIndex: number;
  rowIndex: number;
  record: RecordType;
};

type IVGridItemDataType<RecordType> = {
  columns: (ColumnGroupType<RecordType> | ColumnType<RecordType>)[];
  rowList: readonly RecordType[];
  sortingKey?: SorterResult<RecordType>['columnKey'];
  hoveredRowIndex?: number | null;
  onClickRow?: HandleClickTableRow<RecordType>;
  onMouseEnterCell?: (
    ctx: IVGridContextualPayload<RecordType> & {
      event: React.MouseEvent<HTMLDivElement>;
    }
  ) => void;
  getCellClassName?: (
    ctx: IVGridContextualPayload<RecordType>
  ) => string | undefined;
};

export type HandleClickTableRow<T> = (ctx: {
  event: React.MouseEvent;
  record: T;
  rowIndex: number;
  columnIndex: number;
  columnKey: ColumnType<T>['key'];
}) => any;

/**
 * Minimal instance interface for VariableSizeGrid methods we call.
 */
interface VariableSizeGridHandle {
  resetAfterIndices?: (params?: {
    columnIndex?: number;
    rowIndex?: number;
    shouldForceUpdate?: boolean;
  }) => void;
  scrollTo?: (params?: { scrollLeft?: number; scrollTop?: number }) => void;
  state?: { scrollLeft?: number } | any;
}

const TableCellProto = <RecordType extends object = any>(props: any) => {
  const { columnIndex, rowIndex, style, data } = props;

  const {
    rowList,
    columns,
    getCellClassName,
    onClickRow,
    hoveredRowIndex,
    onMouseEnterCell,
    sortingKey,
  } = data as IVGridItemDataType<RecordType> & {
    onClickRow?: HandleClickTableRow<RecordType>;
    hoveredRowIndex?: number | null;
    onMouseEnterCell?: any;
    sortingKey?: any;
  };

  const record = rowList[rowIndex];
  const columnConfig = columns[columnIndex] as ColumnType<RecordType>;

  const cellClassName = getCellClassName?.({
    columnIndex,
    rowIndex,
    record,
  });

  let cellValue: any = null;
  let cellNode: React.ReactNode = null;

  if (columnConfig.dataIndex) {
    cellValue = (record as any)[columnConfig.dataIndex as string];
    cellNode = cellValue;
  }

  if (typeof columnConfig.render === 'function') {
    const rendered = columnConfig.render(cellValue, record, rowIndex);
    cellNode =
      rendered && typeof rendered === 'object' && 'props' in rendered
        ? (rendered as any).props.children
        : rendered || null;
  }

  return (
    <div
      className={classNames(
        'am-virtual-table-cell',
        (columnConfig as any).className,
        cellClassName,
        {
          'is-hovered-row-cell': hoveredRowIndex === rowIndex,
          'is-sorting-cell': columnConfig.key === sortingKey,
        }
      )}
      style={style}
      onClick={(event) =>
        onClickRow?.({
          event,
          record,
          rowIndex,
          columnIndex,
          columnKey: columnConfig.key,
        })
      }
      onMouseEnter={
        !onMouseEnterCell
          ? undefined
          : (event) =>
              onMouseEnterCell({
                event,
                rowIndex,
                columnIndex,
                record,
              })
      }
    >
      <div className="am-virtual-table-cell-inner">{cellNode}</div>
    </div>
  );
};

const TableCellRenderer = React.memo(TableCellProto, areEqual);
const Cell = (props: any) => <TableCellRenderer {...props} />;

export function VirtualTable<RecordType extends object>({
  markHoverRow,
  vGridRef,
  onClickRow,
  getRowHeight,
  getTotalHeight,
  getCellKey,
  getCellClassName,
  showScrollbar = true,
  emptyText = 'No Data',
  sortedInfo,
  overlayClassName,
  isDesktop,
  ...props
}: TableProps<RecordType> & {
  markHoverRow?: boolean;
  vGridRef?: React.RefObject<VariableSizeGridHandle | null>;
  onClickRow?: HandleClickTableRow<RecordType>;
  getTotalHeight?: (rows: readonly RecordType[]) => number;
  getRowHeight?: (
    row: RecordType,
    idx: number,
    rows: readonly RecordType[]
  ) => number | void;
  getCellKey?: (params: IVGridContextualPayload<RecordType>) => string | number;
  getCellClassName?: IVGridItemDataType<RecordType>['getCellClassName'];
  showScrollbar?: boolean;
  emptyText?: string;
  sortedInfo?: SorterResult<RecordType>;
  overlayClassName?: string;
  isDesktop?: boolean;
}) {
  const { columns, scroll = { ...DEFAULT_SCROLL } } = props;

  const [tableWidth, setTableWidth] = useState(0);

  const widthColumnCount = useMemo(
    () => (columns || []).filter((c) => !c.width).length,
    [columns]
  );

  const mergedColumns = useMemo(() => {
    return (columns || []).map((column) => {
      if (column.width && isDesktop) {
        return {
          ...column,
          width: (Number(column.width) / 1160) * tableWidth,
        };
      }

      return column.width
        ? column
        : {
            ...column,
            width: Math.floor(tableWidth / Math.max(1, widthColumnCount)),
          };
    });
  }, [columns, tableWidth, widthColumnCount, isDesktop]);

  const localGridRef = useRef<VariableSizeGridHandle | null>(null);
  const gridRef =
    (vGridRef as React.RefObject<VariableSizeGridHandle | null>) ||
    localGridRef;

  const [connectObject] = useState<any>(() => {
    const obj: any = {};
    Object.defineProperty(obj, 'scrollLeft', {
      get: () => {
        return (gridRef.current as any)?.state?.scrollLeft ?? 0;
      },
      set: (scrollLeft: number) => {
        (gridRef.current as any)?.scrollTo?.({ scrollLeft });
      },
    });
    return obj;
  });

  const resetVirtualGrid = useCallback(() => {
    (gridRef.current as any)?.resetAfterIndices?.({
      columnIndex: 0,
      rowIndex: 0,
      shouldForceUpdate: true,
    });
  }, []);

  useEffect(() => {
    resetVirtualGrid();
  }, [tableWidth, resetVirtualGrid]);

  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  const isLoading = useMemo(() => {
    return typeof props.loading === 'object'
      ? (props.loading as any)?.spinning
      : props.loading;
  }, [props.loading]);

  const totalHeight = useMemo(() => {
    return (
      getTotalHeight?.(props.dataSource || []) ||
      (props.dataSource?.length ?? 0) * ROW_HEIGHT
    );
  }, [getTotalHeight, props.dataSource]);

  const { t } = useTranslation();

  const renderVirtualList = (
    rowList: readonly RecordType[],
    { ref, onScroll }: any
  ) => {
    ref.current = connectObject;

    if (!rowList.length) {
      return (
        <TableBodyEmpty
          isLoading={isLoading}
          loadingText={t(
            'page.approvals.component.table.bodyEmpty.loadingText'
          )}
          emptyText={emptyText}
        />
      );
    }

    // cast VGrid to any to allow passing ref and children props without JSX typing errors
    const VGridAny: any = VGrid;

    return (
      <VGridAny
        ref={gridRef}
        columnCount={mergedColumns.length}
        rowCount={rowList.length}
        width={tableWidth}
        height={isDesktop ? Math.min(totalHeight, 556) : (scroll!.y as number)}
        itemData={{
          columns: mergedColumns,
          rowList,
          sortingKey: sortedInfo?.columnKey,
          onClickRow,
          hoveredRowIndex,
          onMouseEnterCell: markHoverRow
            ? (ctx: any) => setHoveredRowIndex(ctx.rowIndex)
            : undefined,
          getCellClassName,
        }}
        columnWidth={(index: number) => {
          const { width } = mergedColumns[index];
          if (!showScrollbar) return width as number;

          return totalHeight > (scroll!.y! as number) &&
            index === mergedColumns.length - 1
            ? (width as number) - SCROLLBAR_WIDTH - 1
            : (width as number);
        }}
        rowHeight={(rowIndex: number) =>
          (getRowHeight?.(rowList[rowIndex], rowIndex, rowList) as number) ??
          ROW_HEIGHT
        }
        itemKey={(params: any) => {
          const key = getCellKey?.({
            rowIndex: params.rowIndex,
            columnIndex: params.columnIndex,
            record: params.data.rowList[params.rowIndex],
          });
          return key ?? `${params.rowIndex}-${params.columnIndex}`;
        }}
        onScroll={(e: any) => {
          onScroll({
            scrollLeft: (e.target as HTMLDivElement).scrollLeft,
          });
        }}
        className={clsx(
          'am-virtual-grid',
          isDesktop && 'is-desktop',
          markHoverRow && 'am-virtual-grid__supported-hover-row'
        )}
        // pass cell renderer as children — cast to any to avoid typing mismatch
        children={Cell as any}
      />
    );
  };

  const renderTableBody = useCallback(
    (...args: Parameters<typeof renderVirtualList>) => {
      if (!markHoverRow) return renderVirtualList(...args);

      return (
        <div
          className="am-table-vgrid-wrapper"
          onMouseLeave={() => setHoveredRowIndex(null)}
        >
          {renderVirtualList(...args)}
        </div>
      );
    },
    [markHoverRow]
  );

  const renderEmpty = useCallback(
    () => <TableBodyEmpty isLoading={isLoading} />,
    [isLoading]
  );

  const onResize = useRef(true);

  useLayoutEffect(() => {
    if (isDesktop) {
      const resize = () => {
        onResize.current = true;
      };
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  }, [isDesktop]);

  return (
    <ConfigProvider renderEmpty={renderEmpty}>
      <ResizeObserver
        onResize={({ width }) => {
          setTableWidth((prev) => {
            if (isDesktop) {
              if (prev && !onResize.current) return prev;
              onResize.current = false;
            }
            return width;
          });
        }}
      >
        <Table<RecordType>
          key={isDesktop ? tableWidth : undefined}
          {...props}
          className={clsx(
            'am-virtual-table',
            isDesktop && 'is-desktop',
            overlayClassName,
            props.className
          )}
          columns={mergedColumns}
          pagination={false}
          showHeader={!!props?.dataSource?.length}
          components={{
            header: { cell: TableHeadCell },
            body: markHoverRow ? renderTableBody : renderVirtualList,
          }}
        />
      </ResizeObserver>
    </ConfigProvider>
  );
}
