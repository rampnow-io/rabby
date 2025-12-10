'use client';

import { Image } from '@repo/ui/primitives';
import { CurrencyConfigMap } from '@repo/utils';
import React from 'react';

interface CurrencyRouteProps {
  isDirectDeposit: boolean;
  srcCurrency?: string;
  dstCurrency?: string;
  routeCurrency?: string;
}

const renderIcon = (currency?: string) => {
  if (!currency || !CurrencyConfigMap[currency]?.image) {
    return null;
  }

  return (
    <Image
      src={CurrencyConfigMap[currency].image}
      width={20}
      height={20}
      alt={currency}
      className="h-[22px] w-[22px]"
    />
  );
};

const CurrencyRoute: React.FC<CurrencyRouteProps> = ({
  isDirectDeposit,
  srcCurrency,
  dstCurrency,
  routeCurrency,
}) => {
  return (
    <div className="flex items-center">
      {renderIcon(srcCurrency)}

      {isDirectDeposit ? (
        <>
          <Image
            src="/image/icon/general/chevrons-right.svg"
            width={20}
            height={20}
            alt="to"
            className="h-[18px] w-auto"
          />
          {renderIcon(dstCurrency)}
        </>
      ) : (
        <>
          <Image
            src="/image/icon/general/chevron-right.svg"
            width={20}
            height={20}
            alt="to"
            className="h-[18px] w-[18px]"
          />
          {renderIcon(routeCurrency)}
          <Image
            src="/image/icon/general/chevrons-right.svg"
            width={20}
            height={20}
            alt="to"
            className="h-[18px] w-auto"
          />
          {renderIcon(dstCurrency)}
        </>
      )}
    </div>
  );
};

export { CurrencyRoute };
