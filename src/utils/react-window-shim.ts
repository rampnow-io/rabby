/**
 * React Window compatibility shim for React 19
 * Re-exports from react-window and provides areEqual utility
 */

// Import from the actual package (not the alias) using relative node_modules path
import type * as ReactWindowTypes from '../../node_modules/react-window/dist/react-window';
import {
  List as ReactWindowList,
  Grid as ReactWindowGrid,
  getScrollbarSize as reactWindowGetScrollbarSize,
} from '../../node_modules/react-window/dist/react-window';

// Re-export components with aliases
export const FixedSizeList = ReactWindowList;
export const VariableSizeList = ReactWindowList;
export const FixedSizeGrid = ReactWindowGrid;
export const VariableSizeGrid = ReactWindowGrid;
export const List = ReactWindowList;
export const Grid = ReactWindowGrid;
export const getScrollbarSize = reactWindowGetScrollbarSize;

// Export areEqual utility - shallow comparison for React.memo
export const areEqual = <P extends object>(prevProps: P, nextProps: P): boolean => {
  const prevKeys = Object.keys(prevProps) as Array<keyof P>;
  const nextKeys = Object.keys(nextProps) as Array<keyof P>;

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

// Re-export types from the actual package
export type ListProps = ReactWindowTypes.ListProps<any, any>;
export type GridProps = ReactWindowTypes.GridProps<any, any>;
export type ListImperativeAPI = ReactWindowTypes.ListImperativeAPI;
export type GridImperativeAPI = ReactWindowTypes.GridImperativeAPI;
export type ListItemComponentProps = ReactWindowTypes.RowComponentProps<any>;
export type CellComponentProps = ReactWindowTypes.CellComponentProps<any>;

// Add backward compatible type aliases
export type ListOnScrollProps = {
  scrollDirection: 'forward' | 'backward';
  scrollOffset: number;
  scrollUpdateWasRequested: boolean;
};

export type ListOnItemsRenderedProps = {
  overscanStartIndex: number;
  overscanStopIndex: number;
  visibleStartIndex: number;
  visibleStopIndex: number;
};

export type GridOnScrollProps = {
  horizontalScrollDirection: 'forward' | 'backward';
  scrollLeft: number;
  scrollTop: number;
  scrollUpdateWasRequested: boolean;
  verticalScrollDirection: 'forward' | 'backward';
};

export type GridOnItemsRenderedProps = {
  overscanColumnStartIndex: number;
  overscanColumnStopIndex: number;
  overscanRowStartIndex: number;
  overscanRowStopIndex: number;
  visibleColumnStartIndex: number;
  visibleColumnStopIndex: number;
  visibleRowStartIndex: number;
  visibleRowStopIndex: number;
};
