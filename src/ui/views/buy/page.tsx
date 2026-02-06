import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import {
  Action,
  Container,
  Content,
  QuoteDetailsModal,
  showSnackbar,
  SnackbarType,
  useEventRef,
} from '@repo/ui';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@repo/ui/primitives';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { defaultValue, QuoteConfig } from './order-config';
import { useForm } from 'react-hook-form';
import {
  filteredSearchParams,
  getAsset,
  isPaymentModeAvailable,
  nullToUndefined,
  OrderType,
  PaymentMode,
  RouteType,
} from '@repo/utils';
import {
  buildQuoteCacheKey,
  fetchQuoteRequestData,
  getAssetConfigMap,
  getDefaultApiKey,
  getPaymentModes,
  getSrcAmount,
  parseOrderTypeConfig,
  validateSrcAmount,
} from './utils';
import AssetInput, { AssetValue } from './components/asset-input';
import {
  CryptoChainCode,
  CurrencyCode,
  getRampOrderQuote,
  getRampOrderQuoteConfig,
} from './client';
import PaymentModeSelector from './components/payment-selector';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';

const BuyPage = () => {
  const history = useHistory();
  const location = useLocation();
  const [noRoutesError, setNoRoutesError] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const [quoteConfig, setQuoteConfig] = useState<QuoteConfig>();
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0); // Use this counter to trigger the query after initial load and form changes
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<
    string | undefined
  >();
  const currentAccount = useCurrentAccount();
  const [showPaymentNotice, actionRef] = useEventRef<() => void>();
  const [queryState, setQueryState] = useState(defaultValue);

  const [showPaymentSelector, paymentSelectorRef] = useEventRef<() => void>();
  const prefill = searchParams.get('prefill') === 'true';
  const defaultPaymentMode = prefill
    ? searchParams.get('paymentMode') ?? undefined
    : undefined;

  const form = useForm({
    defaultValues: {
      ...defaultValue,
      srcAmount: '',
      walletUid: searchParams.get('walletUid') ?? currentAccount?.address,
      walletAddressTag: searchParams.get('walletAddressTag') ?? undefined,
    },
    mode: 'onChange',
  });

  const watchedValues = form.watch();

  // Trigger query only after the initial load and form changes
  const isQuoteEnabled =
    Object.keys(form.formState.errors).length === 0 && changeCount > 1;
  const orderType = watchedValues.orderType;
  const srcAsset = getAsset(watchedValues.srcChain, watchedValues.srcCurrency);
  const dstAsset = getAsset(watchedValues.dstChain, watchedValues.dstCurrency);
  const paymentAsset = orderType !== OrderType.SELL ? srcAsset : dstAsset;
  const quoteCacheRef = useRef<string>('');

  const orderTypeConfig = useMemo(
    () => parseOrderTypeConfig(quoteConfig, orderType),
    [quoteConfig, orderType]
  );

  const routeType: RouteType = useMemo(() => {
    if (orderTypeConfig.isDappRegion) {
      for (const config of orderTypeConfig.srcAssetConfig) {
        if (
          config.code === srcAsset &&
          config.routeTypes?.includes(RouteType.DAPP)
        ) {
          return RouteType.DAPP;
        }
      }
    }
    return RouteType.REGULAR;
  }, [orderTypeConfig, srcAsset]);

  const srcAssetConfigMap = useMemo(
    () => getAssetConfigMap(orderTypeConfig.srcAssetConfig, RouteType.REGULAR),
    [orderTypeConfig.srcAssetConfig]
  );

  const dstAssetConfigMap = useMemo(
    () => getAssetConfigMap(orderTypeConfig.dstAssetConfig, routeType),
    [orderTypeConfig.dstAssetConfig, routeType]
  );

  const walletUid = form.getValues('walletUid');

  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const body = useMemo(
    () => ({
      apiKey: watchedValues.apiKey,
      orderType: watchedValues.orderType,
      srcChain: watchedValues.srcChain,
      srcCurrency: watchedValues.srcCurrency,
      srcAmount: watchedValues.srcAmount,
      dstChain: watchedValues.dstChain,
      dstCurrency: watchedValues.dstCurrency,
      paymentMode: watchedValues.paymentMode,
    }),
    [
      watchedValues.apiKey,
      watchedValues.orderType,
      watchedValues.srcChain,
      watchedValues.srcCurrency,
      watchedValues.srcAmount,
      watchedValues.dstChain,
      watchedValues.dstCurrency,
      watchedValues.paymentMode,
    ]
  );

  // Fetch quote when enabled with debounce
  useEffect(() => {
    const fetchQuote = async () => {
      if (!isQuoteEnabled) return;

      try {
        setQuoteLoading(true);
        const resp = await getRampOrderQuote({ body });
        setQuote(resp);
      } catch (error) {
        console.error('Failed to fetch quote:', error);
        showSnackbar(SnackbarType.WARNING, 'Failed to fetch quote');
      } finally {
        setQuoteLoading(false);
      }
    };

    // Debounce to avoid excessive API calls (500ms delay)
    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(timer);
  }, [isQuoteEnabled, body]);

  const quoteData = isQuoteEnabled
    ? quote?.data?.data
    : quoteConfig?.initialQuote;

  const fetchQuoteConfig = async () => {
    try {
      setLoadingConfig(true);
      setConfigError(null);
      const apiKey = getDefaultApiKey();
      const query = { ...nullToUndefined(queryState), apiKey };

      const resp = await getRampOrderQuoteConfig({ query });

      if (resp.data?.code !== 0) {
        throw new Error(resp.data?.message || 'Failed to load quote config');
      }

      const quoteConfig = resp.data?.data;
      const initialQuote = quoteConfig?.initialQuote;

      if (!Number(initialQuote?.dstAmount)) {
        showSnackbar(SnackbarType.WARNING, 'No Routes Available');
        setNoRoutesError(true);
      }

      setQuoteConfig(quoteConfig);
      form.reset({ ...query, ...initialQuote });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to load quote config';
      setConfigError(errorMsg);
      // showSnackbar(SnackbarType.WARNING, errorMsg);
      console.error('fetchQuoteConfig error:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Fetch quote config
  useEffect(() => {
    fetchQuoteConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset form
  useEffect(() => {
    if (quoteConfig) {
      const currentKey = buildQuoteCacheKey({ ...body, walletUid });
      if (currentKey !== quoteCacheRef.current) {
        quoteCacheRef.current = currentKey;
        setQueryState({ ...form.getValues(), walletUid });
        setChangeCount(changeCount + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, quoteConfig, walletUid]);

  const onSrcAssetChange = useCallback(
    (value: Partial<AssetValue>) => {
      if (!quoteConfig) {
        return;
      }

      let { dstChain, dstCurrency } = form.getValues();
      if (!dstAssetConfigMap[dstAsset]?.code) {
        dstChain = Object.values(dstAssetConfigMap)[0]
          ?.chain as CryptoChainCode;
        dstCurrency = Object.values(dstAssetConfigMap)[0]
          ?.currency as CurrencyCode;
      }

      if (value.chain && value.currency) {
        const asset = getAsset(value.chain, value.currency);
        let paymentMode = form.getValues('paymentMode');
        if (orderType !== OrderType.SELL) {
          paymentMode = getPaymentModes(orderTypeConfig, asset)[0];
        }

        form.reset({
          ...form.getValues(),
          srcChain: value.chain,
          srcCurrency: value.currency,
          srcAmount: getSrcAmount(orderTypeConfig, value.currency, value.chain),
          dstChain,
          dstCurrency,
          paymentMode,
        });
      }

      if (value.amount) {
        form.setValue('srcAmount', value.amount);
        const error = validateSrcAmount(
          orderTypeConfig,
          value.amount,
          srcAsset,
          dstAsset,
          form.getValues('paymentMode')
        );
        error
          ? form.setError('srcAmount', error)
          : form.clearErrors('srcAmount');
      }
    },
    [
      quoteConfig,
      dstAssetConfigMap,
      dstAsset,
      orderType,
      orderTypeConfig,
      srcAsset,
      form,
    ]
  );

  const onPaymentModeChange = useCallback(
    (value: string) => {
      if (!isPaymentModeAvailable(value)) {
        showPaymentNotice();
        return;
      }

      form.setValue('paymentMode', value as PaymentMode);

      const error = validateSrcAmount(
        orderTypeConfig,
        form.getValues('srcAmount'),
        srcAsset,
        dstAsset,
        value as PaymentMode
      );
      error ? form.setError('srcAmount', error) : form.clearErrors('srcAmount');
    },
    [orderTypeConfig, srcAsset, dstAsset, showPaymentNotice, form]
  );

  const onDstAssetChange = useCallback(
    ({ chain, currency }: { chain?: string; currency?: string }) => {
      if (chain && currency) {
        form.setValue('dstChain', chain as CryptoChainCode);
        form.setValue('dstCurrency', currency as CurrencyCode);
        if (orderType === OrderType.SELL) {
          const asset = getAsset(chain, currency);
          const modes = getPaymentModes(orderTypeConfig, asset);
          form.setValue('paymentMode', modes[0]);
        }
      }
    },
    [form, orderType, orderTypeConfig]
  );

  const onSubmit = async (data: any) => {
    if (!selectedPaymentMode) {
      showPaymentSelector();
      return;
    }

    // Build URL with proper parameter order
    const params = new URLSearchParams();
    params.append('apiKey', getDefaultApiKey());
    params.append('orderType', data.orderType);
    params.append('srcAmount', data.srcAmount);
    params.append('srcCurrency', data.srcCurrency);
    params.append('srcChain', data.srcChain);
    params.append('dstCurrency', data.dstCurrency);
    params.append('dstChain', data.dstChain);
    params.append('paymentMode', data.paymentMode);
    params.append('orderType', data.orderType);
    params.append('walletAddress', currentAccount?.address || '');

    // Redirect to browser with query parameters
    const redirectUrl = `https://app.rampnow.io/order/quote?${params.toString()}`;
    window.open(redirectUrl, '_blank');
  };

  const paymentOptions = useMemo(
    () => getPaymentModes(orderTypeConfig, paymentAsset),
    [orderTypeConfig, paymentAsset]
  );
  return (
    <UIContainer>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            history.goBack();
          }}
        >
          <div className="text-primary-foreground text-xl font-normal">Buy</div>
        </HeaderNavPage>
        <Content>
          {loadingConfig ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-lg">Loading...</p>
              </div>
            </div>
          ) : configError ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-600 text-lg">Error: {configError}</p>
                <Button onClick={() => fetchQuoteConfig()} className="mt-4">
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col h-full"
              >
                <div className="flex flex-col bg-[#FAFAFA] min-h-[240px] max-h-[240px] border rounded-[18px] p-1">
                  <FormField
                    control={form.control}
                    name="srcAmount"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <AssetInput
                            assetTitle="Select Local Currency"
                            variant="source"
                            value={{
                              amount: watchedValues.srcAmount,
                              currency: watchedValues.srcCurrency,
                              chain: watchedValues.srcChain,
                            }}
                            error={form.formState.errors.srcAmount?.message?.toString()}
                            assetConfigMap={srcAssetConfigMap}
                            onChange={onSrcAssetChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <AssetInput
                    assetTitle="Select Cryptocurrency"
                    variant="destination"
                    readOnly
                    value={{
                      amount: quoteData?.dstAmount ?? '',
                      currency: watchedValues.dstCurrency,
                      chain: watchedValues.dstChain,
                    }}
                    assetConfigMap={dstAssetConfigMap}
                    onChange={onDstAssetChange}
                  />
                </div>

                <div className="flex flex-col mt-6 gap-3">
                  <FormField
                    control={form.control}
                    name="paymentMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PaymentModeSelector
                            options={paymentOptions}
                            disabled={paymentOptions.length === 0}
                            onChange={onPaymentModeChange}
                            onSelectedChange={setSelectedPaymentMode}
                            value={field.value}
                            actionRef={paymentSelectorRef}
                            defaultValue={defaultPaymentMode}
                            variant="list"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <QuoteDetailsModal quote={quoteData} />
                </div>
              </form>
            </Form>
          )}
        </Content>
        <Action>
          <Button onClick={() => form.handleSubmit(onSubmit)()}>
            Continue
          </Button>
        </Action>
      </Container>
    </UIContainer>
  );
};

export default BuyPage;
