import { TokenItem } from '@/background/service/openapi';
import { Account, Token } from '@/background/service/preference';
import { HeaderNavPage } from '@/ui/component';
import TokenDetail from '@/ui/views/Dashboard/components/TokenDetailPopup/TokenDetail';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { UIContainer } from '@/ui/provider';
import { useRabbyDispatch } from '@/ui/store';
import { getUiType, isSameAddress, useWallet } from '@/ui/utils';
import { DisplayedToken } from '@/ui/utils/portfolio/project';
import { AbstractPortfolioToken } from '@/ui/utils/portfolio/types';
import { Container, Content } from '@repo/ui';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const isDesktop = getUiType().isDesktop;

const TokenPortfolioPage = () => {
  const history = useHistory();
  const location = useLocation();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();
  const currentAccount = useCurrentAccount();

  const [token, setToken] = React.useState<TokenItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdded, setIsAdded] = React.useState(false);

  const { chain, tokenId } = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      chain: params.get('chain') || '',
      tokenId: params.get('tokenId') || '',
    };
  }, [location.search]);

  const handleBack = React.useCallback(() => {
    if (history.length > 1) {
      history.goBack();
      return;
    }
    history.replace('/dashboard');
  }, [history]);

  React.useEffect(() => {
    const load = async () => {
      if (!currentAccount?.address || !chain || !tokenId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const detail = await wallet.openapi.getToken(
          currentAccount.address,
          chain,
          tokenId
        );
        if (detail) {
          setToken(detail);
        }
      } catch (e) {
        console.error('load token portfolio detail failed', e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [wallet, currentAccount?.address, chain, tokenId]);

  const checkIsAdded = React.useCallback(async () => {
    if (!token) return;

    let list: Token[] = [];
    if (token.is_core) {
      list = await wallet.getBlockedToken();
    } else {
      list = await wallet.getCustomizedToken();
    }

    const exists = list.some(
      (item) =>
        isSameAddress(item.address, token.id) && item.chain === token.chain
    );
    setIsAdded(exists);
  }, [wallet, token]);

  React.useEffect(() => {
    checkIsAdded();
  }, [checkIsAdded]);

  const handleAddToken = React.useCallback(
    (tokenWithAmount: TokenItem) => {
      if (!tokenWithAmount) return;

      if (tokenWithAmount.is_core) {
        dispatch.account.addBlockedToken(
          new DisplayedToken(tokenWithAmount) as AbstractPortfolioToken
        );
      } else {
        dispatch.account.addCustomizeToken(
          new DisplayedToken(tokenWithAmount) as AbstractPortfolioToken
        );
      }
      setIsAdded(true);
    },
    [dispatch]
  );

  const handleRemoveToken = React.useCallback(
    (tokenWithAmount: TokenItem) => {
      if (!tokenWithAmount) return;

      if (tokenWithAmount.is_core) {
        dispatch.account.removeBlockedToken(
          new DisplayedToken(tokenWithAmount) as AbstractPortfolioToken
        );
      } else {
        dispatch.account.removeCustomizeToken(
          new DisplayedToken(tokenWithAmount) as AbstractPortfolioToken
        );
      }
      setIsAdded(false);
    },
    [dispatch]
  );

  return (
    <UIContainer>
      <Container>
        <HeaderNavPage handleBack={handleBack}>
          <div className="text-primary-foreground text-xl font-normal">
            Token
          </div>
        </HeaderNavPage>

        <Content className="!px-4">
          {isLoading ? (
            <div className="py-24 text-center text-r-neutral-foot text-13">
              Loading token details...
            </div>
          ) : token ? (
            <TokenDetail
              token={token}
              addToken={handleAddToken}
              removeToken={handleRemoveToken}
              variant="add"
              isAdded={isAdded}
              popupHeight={isDesktop ? 540 : 500}
              onClose={handleBack}
              account={currentAccount as Account}
            />
          ) : (
            <div className="py-24 text-center text-r-neutral-foot text-13">
              Token not found.
            </div>
          )}
        </Content>
      </Container>
    </UIContainer>
  );
};

export default TokenPortfolioPage;
