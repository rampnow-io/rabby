"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import React, { type Dispatch, Fragment, type SetStateAction } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../primitives/table"
import { DataTablePagination } from "./data-table-pagination"

interface Sorting {
  sort: string
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  getRowId?: (row: TData) => string
  pageCount?: number
  pagination?: PaginationState
  totalCount?: number
  setPagination?: Dispatch<SetStateAction<PaginationState>>
  sorting?: string
  setSorting?: Dispatch<SetStateAction<Sorting>>
  detailView?: (row: TData) => React.ReactNode
  expandedRowId?: string
  dataFilterModal?: React.ReactNode
  rowSelection?: {}
  onRowSelectionChange?: (updater: any) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  pageCount,
  pagination,
  setPagination,
  totalCount: count = 0,
  sorting,
  setSorting,
  detailView,
  expandedRowId,
  dataFilterModal,
  rowSelection = {},
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )

  const tableSorting: SortingState =
    sorting?.split(",").map((sortParam) => {
      const [id, order] = sortParam.split(":")
      return { id, desc: order === "desc" }
    }) ?? []

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: pagination ?? {
        pageIndex: 0,
        pageSize: Number.MAX_SAFE_INTEGER,
      },
      sorting: tableSorting,
    },
    enableRowSelection: true,
    pageCount: pageCount ? pageCount : undefined,
    manualPagination: Boolean(pagination),
    onPaginationChange: pagination ? setPagination : undefined,
    onRowSelectionChange,
    onSortingChange: (sort) => {
      const querySorting = (
        typeof sort === "function" ? sort(tableSorting) : sort
      )
        .map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`)
        .join(",")

      setSorting?.({ sort: querySorting })
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className='space-y-4'>
      <div className='rounded-2xl bg-white border'>
        {dataFilterModal ? <>{dataFilterModal}</> : null}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRowId === row.id && detailView ? (
                    <TableRow className='p-0'>
                      <TableCell
                        colSpan={columns.length}
                        className='bg-muted p-0'
                      >
                        {detailView(row.original)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {pagination ? (
          <DataTablePagination table={table} totalCount={count} />
        ) : null}
      </div>
    </div>
  )
}
