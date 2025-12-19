import IconUnknown from '@/ui/assets/token-default.svg';
import ChainSelectorModal from '@/ui/component/ChainSelector/Modal';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { formatAmount, useWallet } from '@/ui/utils';
import { findChain, getChainList } from '@/utils/chain';
import { CHAINS_ENUM } from '@debank/common';
import { useRequest, useSetState } from 'ahooks';
import { Spin, message } from 'antd';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Loading3QuartersOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { useThemeMode } from '@/ui/hooks/usePreference';
import {
  useOperateCustomToken,
  useFindCustomToken,
} from '@/ui/hooks/useSearchToken';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';
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
import { BottomDrawer, useOpenClose } from '@repo/ui';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  address: z.string().min(1, 'Token address is required'),
});

type FormValues = z.infer<typeof formSchema>;

const Wraper = styled.div`
  min-height: 500px;
  padding: 20px;
`;

const Footer = styled.div`
  height: 84px;
  border-top: 0.5px solid var(--r-neutral-line, rgba(255, 255, 255, 0.1));
  background: var(--r-neutral-card-1, rgba(255, 255, 255, 0.06));
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
`;

interface Props {
  isVisible?: boolean;
  onClose?(): void;
  onConfirm?: (
    addedInfo: {
      token: TokenItem;
      portofolioToken?: AbstractPortfolioToken | null;
    } | null
  ) => void;
}

export const AddCustomTokenPopup = ({
  isVisible,
  onClose,
  onConfirm,
}: Props) => {
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

      const portofolioToken = (await addToken(token)) || null;

      return { token, portofolioToken };
    },
    { manual: true }
  );

  const handleConfirm = useCallback(async () => {
    try {
      const addedInfo = await runAddToken();
      onConfirm?.(addedInfo);
    } catch (e: any) {
      message.error(e?.message);
    }
  }, [runAddToken, onConfirm]);

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

  if (!isVisible) {
    return null;
  }

  const [showModal, openModal, closeModal] = useOpenClose(false);

  return (
    <>
      <BottomDrawer variant="semi" rootSelector="body" close={onClose}>
        <Wraper>
          <Form {...form}>
            <form className="space-y-4">
              <FormItem>
                <FormLabel>Chain</FormLabel>
                <div
                  onClick={() => {
                    openModal();
                    setChainSelectorState({ visible: true });
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 rounded-md cursor-pointer',
                    'bg-r-neutral-card2 hover:border-rabby-blue-default'
                  )}
                >
                  {chain && (
                    <>
                      <img src={chain.logo} className="w-6 h-6 rounded-full" />
                      <span>{chain.name}</span>
                    </>
                  )}
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('page.dashboard.assets.AddMainnetToken.tokenAddress')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={inputRef}
                        autoComplete="off"
                        placeholder={t(
                          'page.dashboard.assets.AddMainnetToken.tokenAddressPlaceholder'
                        )}
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

          <Footer>
            <Button
              buttonType={ButtonType.GHOST}
              className="w-[172px]"
              onClick={onClose}
            >
              {t('global.Cancel')}
            </Button>
            <Button className="w-[172px]" onClick={handleConfirm}>
              {t('global.Confirm')}
            </Button>
          </Footer>
        </Wraper>
      </BottomDrawer>

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
    </>
  );
};
