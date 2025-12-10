import {
  CryptoAsset,
  CryptoAssetConfigMap,
  formatCurrency,
  getAsset,
  paymentProviderConfig,
} from '@repo/utils';
import { Info, X } from 'lucide-react';
import { useOpenClose } from '../../hooks';
import { Button, Skeleton } from '../../primitives';
import BottomDrawer from '../bottom-drawer';
import { CurrencyRoute } from './currency-route';

interface Quote {
  srcCurrency: string;
  srcChain: string;
  dstCurrency: string;
  dstChain: string;
  srcAmount: string;
  dstAmount: string;
  paymentProviderId: number;
  feeDetails?: Array<{
    type: string;
    fee: string;
    currency: string;
  }>;
}

interface QuoteProps {
  quote?: Quote;
  defaultOpen?: boolean;
}

const feeTypeMap: Record<string, string> = {
  network: 'Network Fee',
};

const QuoteDetailsModal = ({ quote }: QuoteProps) => {
  const [isVisible, openModal, closeModal] = useOpenClose(false);

  const dstAsset = getAsset(quote?.dstChain, quote?.dstCurrency) as CryptoAsset;
  const providerConfig = paymentProviderConfig[quote?.paymentProviderId ?? 0];
  const routeCurrency =
    CryptoAssetConfigMap[providerConfig?.liquidityAsset]?.currency;
  const isDirectDeposit =
    providerConfig?.liquidityAsset === dstAsset ||
    !providerConfig?.liquidityAsset;

  const cell = {
    label: 'py-2 text-left text-sm font-normal text-gray-600',
    value: 'py-2 text-right text-sm font-medium text-primary-foreground',
  };

  return (
    <>
      <div className="w-full">
        {quote ? (
          <div className="flex grow items-center justify-end">
            <div className="flex items-center gap-2 text-nowrap">
              <p className="text-sm font-medium leading-[12px] text-primary-foreground">
                {formatCurrency(quote.dstAmount, quote.dstCurrency)}
                <span className="mx-2 font-normal">~</span>
                {formatCurrency(quote.srcAmount, quote?.srcCurrency)}
              </p>

              <Info
                onClick={openModal}
                className="cursor-pointer text-foreground"
                size={16}
              />
            </div>
          </div>
        ) : (
          <Skeleton className="h-10" />
        )}
      </div>

      {isVisible && (
        <BottomDrawer variant="semi" close={closeModal}>
          <div className="flex flex-col h-full min-h-[100px] gap-4 p-6">
            <div className="flex items-start justify-between">
              <div className="text-primary-foreground text-lg font-medium">
                Your Order
              </div>
              <X className="cursor-pointer" size={24} onClick={closeModal} />
            </div>

            <div className="flex flex-1 flex-col overflow-auto">
              {quote ? (
                <table className="min-w-full max-w-full text-xs font-light text-primary-foreground">
                  <tbody>
                    <tr>
                      <td className={cell.label}>1 {quote.dstCurrency}</td>
                      <td className={cell.value}>
                        ≈{' '}
                        {formatCurrency(
                          Number(quote.srcAmount) / Number(quote.dstAmount),

                          quote.srcCurrency
                        )}
                      </td>
                    </tr>

                    {quote.feeDetails?.map((data: any, index: number) => {
                      if (!feeTypeMap[data.type]) {
                        return null;
                      }

                      return (
                        <tr key={index}>
                          <td className={cell.label}>
                            {feeTypeMap[data.type]}
                          </td>
                          <td className={cell.value}>
                            {formatCurrency(data.fee, data.currency)}
                          </td>
                        </tr>
                      );
                    })}

                    <tr>
                      <td className={cell.label}>Route</td>
                      <td className={cell.value}>
                        <div className="flex items-center justify-end">
                          <CurrencyRoute
                            isDirectDeposit={isDirectDeposit}
                            srcCurrency={quote?.srcCurrency}
                            dstCurrency={quote?.dstCurrency}
                            routeCurrency={routeCurrency}
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <Skeleton className="h-20" />
              )}
            </div>

            <div className="mt-auto">
              <Button className="w-full" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        </BottomDrawer>
      )}
    </>
  );
};

export { QuoteDetailsModal };
