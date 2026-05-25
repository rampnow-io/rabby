import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content } from '@repo/ui';
import React from 'react';
import ChainSelectorModal from '@/ui/component/ChainSelector/Modal';
import { useHistory } from 'react-router-dom';
import { Loading3QuartersOutlined } from '@ant-design/icons';
import { ReactComponent as RcIconArrowRight } from 'ui/assets/dashboard/settings/icon-right-arrow.svg';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import IconUnknown from '@/ui/assets/token-default.svg';
import { useOpenClose } from '@repo/ui';
import { useRequest, useSetState } from 'ahooks';
import {
  Button,
  ButtonType,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@repo/ui/primitives';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/ui/utils';
import { CHAINS_ENUM, formatAmount } from '@debank/common';
import { findChain, getChainList } from '@/utils/chain';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useFindCustomToken,
  useOperateCustomToken,
} from '@/ui/hooks/useSearchToken';
import clsx from 'clsx';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { addUserToken } from '@/snippets/client';

const formSchema = z.object({
  address: z.string().min(1, 'Token address is required'),
});

type FormValues = z.infer<typeof formSchema>;

const AddToken = () => {
  const history = useHistory();
  const wallet = useWallet();
  const { t } = useTranslation();

  const [chainSelectorState, setChainSelectorState] = useSetState<{
    visible: boolean;
    chain: CHAINS_ENUM | null;
  }>({
    visible: false,
    chain: getChainList('mainnet')?.[0]?.enum || null,
  });

  const chain = findChain({ enum: chainSelectorState.chain });
  const [tokenId, setTokenId] = useState('');
  const [checked, setChecked] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
    },
  });

  const {
    tokenList,
    resetSearchResult,
    searchCustomToken,
  } = useFindCustomToken();

  const { runAsync: doSearch, loading: isSearchingToken, error } = useRequest(
    async () => {
      if (!chain?.id || !tokenId) return null;

      const currentAccount = await wallet.getCurrentAccount();
      setChecked(false);
      form.clearErrors('address');

      const lists = await searchCustomToken({
        address: currentAccount!.address,
        chainServerId: chain.serverId,
        q: tokenId,
      });

      if (!lists?.tokenList.length) {
        form.setError('address', {
          message: t('page.dashboard.assets.AddMainnetToken.notFound'),
        });
      } else {
        setChecked(true);
      }
    },
    { manual: true }
  );

  useEffect(() => {
    if (tokenId) doSearch();
  }, [chain?.serverId, tokenId]);

  const token = useMemo(() => tokenList?.[0], [tokenList]);

  const { addToken } = useOperateCustomToken();

  const { runAsync: runAddToken } = useRequest(
    async () => {
      if (!token || !chain?.id || !tokenId) return null;

      if (token.is_core) {
        throw new Error(
          t('page.dashboard.assets.AddMainnetToken.isBuiltInToken')
        );
      }

      const portofolioToken =
        (await addUserToken({
          body: {
            chain_id: chain.id.toString(),
            contract_address: tokenId,
            wallet_address: (await wallet.getCurrentAccount())?.address || '',
          },
        })) || null;

      return { token, portofolioToken };
    },
    { manual: true }
  );

  const handleConfirm = useCallback(async () => {
    try {
      if (!token || !chain?.id || !tokenId) {
        return;
      }
      const addedInfo = await runAddToken();
      if (addedInfo) {
        history.goBack();
      }
    } catch (e: any) {
      console.error('Failed to add token:', e);
    }
  }, [token, chain?.id, tokenId, runAddToken, history]);

  useEffect(() => {
    setChainSelectorState({
      visible: false,
      chain: getChainList('mainnet')?.[0]?.enum || null,
    });
    resetSearchResult();
    setTokenId('');
    setChecked(false);
    form.reset();
  }, [resetSearchResult]);

  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);
  const [showModal, openModal, closeModal] = useOpenClose(false);

  return (
    <UIContainer>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            if (history.length) {
              history.goBack();
            }
          }}
        >
          <div className="text-primary-foreground text-xl font-medium">
            Add Custom Token
          </div>
        </HeaderNavPage>
        <Content>
          <Form {...form}>
            <form className="space-y-4">
              <FormItem>
                <FormLabel>Network</FormLabel>
                <div
                  onClick={() => {
                    openModal();
                    setChainSelectorState({ visible: true });
                  }}
                  className={clsx(
                    'flex items-center justify-between gap-2 px-3 py-5 rounded-md cursor-pointer bg-[#FAFAFA]'
                  )}
                >
                  {chain && (
                    <div className="flex items-center gap-2">
                      <img src={chain.logo} className="w-6 h-6 rounded-full" />
                      <span className="text-base font-medium text-primary-foreground">
                        {chain.name}
                      </span>
                    </div>
                  )}
                  <ThemeIcon
                    src={RcIconArrowRight}
                    className="icon icon-arrow-right"
                  />
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={inputRef}
                        autoComplete="off"
                        onChange={(e) => {
                          field.onChange(e);
                          setTokenId(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSearchingToken && (
                <div className="flex items-center gap-2 text-sm">
                  <Loading3QuartersOutlined className="animate-spin" />
                  {t('page.dashboard.assets.AddMainnetToken.searching')}
                </div>
              )}

              {token && !error && (
                <div className="flex items-center gap-3 bg-r-neutral-card2 p-3 rounded-md">
                  <img
                    src={token.logo_url || IconUnknown}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>
                    {formatAmount(token.amount || 0)} {token.symbol}
                  </span>
                </div>
              )}
            </form>
          </Form>
        </Content>
        <Action className="gap-2">
          <Button onClick={handleConfirm}>{t('global.Confirm')}</Button>
        </Action>
      </Container>
      <ChainSelectorModal
        value={chainSelectorState.chain || CHAINS_ENUM.ETH}
        hideTestnetTab
        visible={showModal}
        showRPCStatus
        onCancel={() => {
          setChainSelectorState({ visible: false });
          closeModal();
        }}
        onChange={(value) => {
          setChainSelectorState({ visible: false, chain: value });
          closeModal();
        }}
      />
    </UIContainer>
  );
};

export default AddToken;
