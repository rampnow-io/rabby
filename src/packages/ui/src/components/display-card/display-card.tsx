"use client"

import { type DisplayCardProps } from "./display-card.types"

const colClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
}

export function DisplayCard({ rows, heading }: DisplayCardProps) {
  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0)

  return (
    <div className='flex h-full flex-shrink flex-grow gap-4'>
      <div className='flex flex-col w-full overflow-hidden rounded-2xl border bg-white p-6 shadow-sm'>
        {heading ? (
          <h3 className='mb-6 text-sm font-semibold'>
            {heading.toUpperCase()}
          </h3>
        ) : null}

        <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 overflow-auto'>
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`grid ${colClasses[colCount]} items-center py-2`}
            >
              {row.map((col, colIndex) => (
                <span key={colIndex} className=''>
                  {col}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
