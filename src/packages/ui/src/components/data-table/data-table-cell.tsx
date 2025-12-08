import React from "react"

interface CellTextProps {
  text: React.ReactNode
  subtext?: React.ReactNode
  icon?: React.ReactNode
}

export function CellText(data: CellTextProps) {
  return (
    <div className='inline-block'>
      <div className='flex items-center space-x-2 align-middle'>
        {data.icon}
        <div>
          <div className='text-left text-[14px] font-medium'>{data.text}</div>
          <div className='flex items-center space-x-1 text-[12px] font-medium text-gray-500'>
            {data.subtext}
          </div>
        </div>
      </div>
    </div>
  )
}
