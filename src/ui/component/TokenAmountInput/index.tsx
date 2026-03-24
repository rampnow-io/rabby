import { useSearchTestnetToken } from '@/ui/hooks/useSearchTestnetToken';
import { useRabbySelector } from '@/ui/store';
import { useTokens } from '@/ui/utils/portfolio/token';
import { findChain } from '@/utils/chain';
import { DrawerProps, Modal, Skeleton } from 'antd';
import { TokenItem } from 'background/service/openapi';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import uniqBy from 'lodash/uniqBy';
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import useSearchToken from 'ui/hooks/useSearchToken';
import useSortToken from 'ui/hooks/useSortTokens';
import { formatUsdValue, useWallet } from 'ui/utils';
import { abstractTokenToTokenItem, getTokenSymbol } from 'ui/utils/token';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';
import TokenSelector, { TokenSelectorProps } from '../TokenSelector';
import TokenWithChain from '../TokenWithChain';
import { INPUT_NUMBER_RE, filterNumber } from '@/constant/regexp';
import { useTranslation } from 'react-i18next';
import { ReactComponent as RcIconWalletCC } from '@/ui/assets/swap/wallet-cc.svg';
import { ReactComponent as RcIconDownCC } from '@/ui/assets/dashboard/arrow-down-cc.svg';
import { ReactComponent as RcArrowDown } from './icons/arrow-down.svg';
import styled from 'styled-components';
import { RiskWarningTitle } from '../RiskWarningTitle';
import BigNumber from 'bignumber.js';
import { Input } from '@repo/ui/primitives';
import { useOpenClose } from '@repo/ui';

/* ---------------- styles ---------------- */

const Card = styled.div`
  background: #18181b0a;
  border-radius: 20px;
  padding: 4px;
`;

const SwapIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
`;

const ErrorText = styled.div`
  margin-top: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #ef4444;
`;

/* ---------------- props ---------------- */

interface TokenAmountInputProps {
  token: TokenItem | null;
  value?: string;
  isLoading?: boolean;
  initLoading?: boolean;
  onChange?(amount: string): void;
  onTokenChange(token: TokenItem): void;
  chainId?: string;
  amountFocus?: boolean;
  excludeTokens?: TokenItem['id'][];
  className?: string;
  type?: TokenSelectorProps['type'];
  insufficientError?: boolean;
  placeholder?: string;
  getContainer?: DrawerProps['getContainer'];
  balanceNumText?: string;
  handleClickMaxButton?: () => void;
  disableItemCheck?: (
    token: TokenItem
  ) => {
    disable: boolean;
    cexId?: string;
    reason: string;
    shortReason: string;
  };
}

const TokenAmountInput = ({
  token,
  value,
  onChange,
  onTokenChange,
  chainId,
  amountFocus,
  excludeTokens = [],
  className,
  type = 'default',
  placeholder,
  getContainer,
  balanceNumText,
  handleClickMaxButton,
  insufficientError,
  isLoading,
  initLoading,
  disableItemCheck,
}: TokenAmountInputProps) => {
  const [updateNonce, setUpdateNonce] = useState(0);
  const [isVisible, openModal, closeModal] = useOpenClose(false);

  const currentAccount = useRabbySelector(
    (state) => state.account.currentAccount
  );
  const wallet = useWallet();
  const { t } = useTranslation();

  const [keyword, setKeyword] = useState('');
  const [chainServerId, setChainServerId] = useState(chainId);
  const [localAmount, setLocalAmount] = useState(value ?? '0');

  const chainItem = useMemo(() => findChain({ serverId: chainServerId }), [
    chainServerId,
  ]);

  const isTestnet = chainItem?.isTestnet;

  useEffect(() => {
    if (value) {
      setLocalAmount(value);
    }
  }, [value]);

  const handleCurrentTokenChange = (token: TokenItem) => {
    onChange?.('');
    onTokenChange(token);
    closeModal();
    setChainServerId(token.chain);
  };

  const handleSelectToken = () => {
    openModal();
  };
  const shouldLoadTokens = useMemo(() => {
    return isVisible;
  }, [isVisible]);
  const { tokens: allTokens, isLoading: isLoadingAllTokens } = useTokens(
    currentAccount?.address,
    undefined,
    shouldLoadTokens,
    updateNonce,
    chainServerId
  );

  const allDisplayTokens = useMemo(() => {
    const abstractTokens = (allTokens as unknown) as AbstractPortfolioToken[];
    return abstractTokens.map(abstractTokenToTokenItem);
  }, [allTokens]);

  const { list: searchedTokenByQuery } = useSearchToken(
    currentAccount?.address,
    keyword,
    chainServerId,
    true
  );

  const searchedDisplayTokens = useMemo(() => {
    // Convert searched tokens from AbstractPortfolioToken to TokenItem
    // This ensures token.id contains the actual contract address from _tokenId
    // instead of the concatenated id+chain value
    return searchedTokenByQuery.map(abstractTokenToTokenItem);
  }, [searchedTokenByQuery]);

  const availableToken = useMemo(() => {
    return uniqBy(
      (keyword ? searchedDisplayTokens : allDisplayTokens).filter(
        (e) => !excludeTokens.includes(e.id)
      ),
      (t) => `${t.chain}-${t.id}`
    );
  }, [keyword, searchedDisplayTokens, allDisplayTokens, excludeTokens]);

  const displayTokenList = useSortToken(availableToken);

  const useValue = useMemo(() => {
    if (token && value) {
      return formatUsdValue(
        new BigNumber(value).multipliedBy(token.price || 0).toString()
      );
    }
    return '$0.00';
  }, [token?.price, value]);

  return (
    <>
      <Card className={className}>
        <div className="flex items-center justify-between bg-[#F7F7F8] rounded-xl px-3 py-3 cursor-pointer">
          {initLoading ? (
            <Skeleton.Input active />
          ) : (
            <div
              className="flex items-center gap-2"
              onClick={handleSelectToken}
            >
              {!!token && (
                <TokenWithChain width="35px" height="35px" token={token} />
              )}
              <div className="flex flex-col">
                <span className="text-base font-medium text-primary-foreground">
                  {token
                    ? getTokenSymbol(token)
                    : t('page.sendToken.selectToken')}
                </span>
                <span className="text-xs font-medium text-secondary-foreground">
                  {balanceNumText}
                </span>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {token && token.amount > 0 && (
              <div
                className="px-3 py-1 bg-white border border-r-neutral-line rounded-full text-[8px] font-normal text-primary-foreground cursor-pointer hover:bg-r-neutral-bg-1 transition-colors duration-200 flex items-center gap-1"
                onClick={(e) => {
                  handleClickMaxButton?.();
                }}
              >
                {t('page.sendToken.max')}
              </div>
            )}
            <ChevronDown onClick={handleSelectToken} />
          </div>
        </div>
        <div className="bg-white rounded-[20px]">
          <div className="flex flex-col items-center p-4">
            <div className="flex justify-center items-center  gap-1 ">
              <Input
                value={localAmount}
                autoFocus
                onChange={(e) => {
                  const next = e.target.value;
                  if (!INPUT_NUMBER_RE.test(next)) return;
                  const filtered = filterNumber(next);
                  setLocalAmount(filtered);
                  onChange?.(filtered);
                }}
                className={'border-none p-0 outline-none w-[120px]'}
                subClassName="text-[35px] text-center text-primary-foreground font-semibold bg-inherit"
              />

              <span className="text-[10px] !mt-3 text-secondary-foreground font-medium">
                {token ? getTokenSymbol(token) : ''}
              </span>
            </div>

            <SwapIcon>
              <RcIconDownCC width={12} height={12} />
            </SwapIcon>
            {!insufficientError && (
              <span className="text-sm font-medium text-r-neutral-title1">
                {useValue}
              </span>
            )}
            {insufficientError && token && (
              <ErrorText>Not enough {getTokenSymbol(token)}</ErrorText>
            )}
          </div>
        </div>
      </Card>

      <TokenSelector
        list={displayTokenList}
        visible={isVisible}
        onConfirm={handleCurrentTokenChange}
        onCancel={closeModal}
        onSearch={useCallback((ctx) => setKeyword(ctx.keyword), [])}
        isLoading={isLoadingAllTokens}
        type={type}
        placeholder={placeholder}
        chainId={chainServerId}
      />
    </>
  );
};

export default TokenAmountInput;
