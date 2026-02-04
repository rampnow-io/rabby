"use client"


import { Input, Skeleton } from "@repo/ui/primitives"
import {
  cn,
  CurrencyConfigMap,
  formatCurrency,
  type AssetConfig,
} from "@repo/utils"

import React, { useEffect, useState } from "react"
import { CryptoChainCode, CurrencyCode } from "../client"
import { AssetSelector } from "@repo/ui"

export interface AssetValue {
  amount: string
  currency: CurrencyCode
  chain: CryptoChainCode
}

interface AssetInputProps {
  assetTitle: string
  value: AssetValue
  error?: string
  debounceDelay?: number
  onChange?: (params: Partial<AssetValue>) => void
  amountPlaceholder?: string
  assetConfigMap: Record<string, AssetConfig>
  readOnly?: boolean
  variant?: "source" | "destination"
}

const variantStyle = {
  source: "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] h-[122px] ",
  destination: "h-full",
}

const AssetInput: React.FC<AssetInputProps> = ({
  assetTitle,
  amountPlaceholder = "",
  error,
  value,
  onChange,
  assetConfigMap,
  debounceDelay = 750,
  readOnly = false,
  variant,
}) => {
  const [localAmount, setLocalAmount] = useState(() => value.amount)

  useEffect(() => {
    setLocalAmount(
      formatCurrency(value.amount, value.currency, { noSymbol: true }),
    )
  }, [value.amount, value.currency])

  const { symbol, defaultDenominations } = CurrencyConfigMap[value.currency]

  useEffect(() => {
    onChange?.({ amount: localAmount })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAmount])

  return (
    <label
      className={cn(
        "mt-px flex flex-col gap-1.5 items-start rounded-xl p-[18px] w-full",
        variantStyle[variant ?? "source"],
      )}
    >
      <div className='flex w-full gap-x-4'>
        <div className='shrink grow'>
          {!value.amount ? (
            <Skeleton
              className='!h-[56px] w-full rounded-xl'
              style={{ backgroundColor: "#EBEBEB" }}
            />
          ) : (
            <>
              <div className='flex flex-col gap-1'>
                <div className='flex gap-2 items-start'>
                  <p className='text-lg pt-2 font-normal text-[#A1A1AA]'>
                    {symbol}
                  </p>
                  <Input
                    value={localAmount}
                    onChange={(e) => setLocalAmount(e.target.value)}
                    placeholder={amountPlaceholder}
                    readOnly={readOnly}
                    className={"border-none p-0 outline-none"}
                    subClassName='text-[35px] text-primary-foreground font-semibold bg-inherit'
                  />
                </div>

                {error ? (
                  <p className='text-red-600 text-[10px]'>{error}</p>
                ) : null}
              </div>
            </>
          )}
        </div>
        <AssetSelector
          className='shrink-0 grow-0 pt-1'
          title={assetTitle}
          selectedCurrency={value.currency}
          selectedChain={value.chain}
          assetConfigMap={assetConfigMap}
          onSelect={(asset) => onChange?.(asset as any)}
        />
      </div>
      <div className='flex gap-1.5'>
        {!error &&
          variant === "source" &&
          value.amount &&
          defaultDenominations?.map((data, index) => {
            return (
              <div
                key={index}
                onClick={() => setLocalAmount(data)}
                className='bg-chip cursor-pointer text-sm border-inherit rounded-3xl px-3 py-0.5'
              >
                {symbol}
                {data}
              </div>
            )
          })}
      </div>
    </label>
  )
}

export default React.memo(AssetInput)
