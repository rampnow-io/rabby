import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { query2obj } from '@/ui/utils/url';
import clsx from 'clsx';
import { ReactComponent as RcIconChecked } from '@/ui/assets/new-user-import/check.svg';
import { ReactComponent as RcIconPen } from '@/ui/assets/new-user-import/pen.svg';
import { ReactComponent as RcIconConfirm } from '@/ui/assets/new-user-import/confirm-check.svg';
import { ReactComponent as RcIconExternalCC } from '@/ui/assets/new-user-import/external-cc.svg';

import { isSameAddress, useAlias, useWallet } from '@/ui/utils';
import { ellipsisAddress } from '@/ui/utils/address';
import { Account } from '@/background/service/preference';
import { useRabbyDispatch } from '@/ui/store';
import { useAsync, useClickAway } from 'react-use';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { BRAND_ALIAN_TYPE_TEXT, KEYRING_CLASS, KEYRING_TYPE } from '@/constant';
import { useDocumentVisibility, useRequest } from 'ahooks';
import { GnosisChainList } from './GnosisChainList';
import { findChain } from '@/utils/chain';
import { Chain } from '@/types/chain';
import styled from 'styled-components';
import { Button, Input } from '@repo/ui/primitives';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';

const AccountItem = ({ account }: { account: Account }) => {
  const [edit, setEdit] = useState(false);

  const [name, updateAlias] = useAlias(account!.address);

  const [localName, setLocalName] = useState(name || '');

  const ref = useRef<HTMLInputElement>(null);

  const [defaultName, setDefaultName] = useState(name || '');

  const wallet = useWallet();

  const updateRef = useRef(null);

  const update = React.useCallback(() => {
    updateAlias(localName.trim() ? localName : defaultName);
    setEdit(false);
  }, [updateAlias, localName, defaultName]);

  useClickAway(updateRef, () => {
    if (edit) {
      update();
    }
  });

  useLayoutEffect(() => {
    if (edit) {
      ref.current?.focus();
    }
  }, [edit]);

  useEffect(() => {
    wallet.uninstalledSyncStatus();
  }, []);

  if (!account) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex flex-col justify-center',
        'border border-solid border-rabby-neutral-line',
        'rounded-[8px] p-16 pt-8'
      )}
    >
      <div
        ref={updateRef}
        className="flex items-center text-[20px] font-medium"
      >
        {edit ? (
          <Input
            ref={ref}
            autoComplete="false"
            autoCorrect="false"
            className={clsx(
              'relative left-[-8px]',
              'w-[260px] h-[38px]',
              'border-none bg-r-neutral-card2 text-r-neutral-title-1',
              'p-8 rounded',
              'text-[20px] font-medium'
            )}
            value={localName}
            onChange={(e) => {
              setLocalName(e.target.value);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-[38px] ">
            <span className="max-w-[300px] truncate text-r-neutral-title1">
              {name}
            </span>
          </div>
        )}

        {edit ? (
          <>
            <RcIconConfirm
              className="w-20 h20 -ml-8px cursor-pointer"
              viewBox="0 0 20 20"
              onClick={() => {
                update();
              }}
            />
            <div
              className="flex-1 self-stretch"
              onClick={() => {
                update();
              }}
            />
          </>
        ) : (
          <RcIconPen
            className="w-[18px] h-[19px] cursor-pointer ml-6"
            viewBox="0 0 18 19"
            onClick={() => {
              setEdit(true);
              setLocalName(name || '');
              if (!defaultName) {
                setDefaultName(name || '');
              }
              ref.current?.focus();
            }}
          />
        )}
      </div>
      <div className="text-[15px] text-r-neutral-foot">
        {ellipsisAddress(account.address)}
      </div>
    </div>
  );
};

const ScrollBarDiv = styled.div`
  overflow-y: scroll;
  &::-webkit-scrollbar {
    background-color: transparent;
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 90px;
    background: var(--r-neutral-foot, #6a7587);
  }
`;

export const ImportOrCreatedSuccess = () => {
  const history = useHistory();
  const dispatch = useRabbyDispatch();
  const wallet = useWallet();

  const { store, setStore } = useNewUserGuideStore();

  const { t } = useTranslation();
  const { search } = useLocation();
  const { isCreated: created, hd, keyringId, brand } = React.useMemo(
    () => query2obj(search),
    [search]
  );

  const isCreated = React.useMemo(() => created === 'true', [created]);

  // Redirect to ready page if account was created
  useEffect(() => {
    if (isCreated) {
      history.push('/new-user/ready');
    }
  }, [isCreated, history]);

  const isSeedPhrase = React.useMemo(() => hd === KEYRING_CLASS.MNEMONIC, [hd]);

  const documentVisibility = useDocumentVisibility();

  const { value: accounts } = useAsync(async () => {
    if (documentVisibility === 'visible') {
      const accounts = await wallet.getAllVisibleAccountsArray();
      if (hd !== KEYRING_CLASS.MNEMONIC) {
        return accounts;
      }
      const addresses = await wallet.requestKeyring(
        KEYRING_TYPE.HdKeyring,
        'getAccounts',
        Number(keyringId) ?? null
      );
      if (!addresses.length) {
        return accounts;
      }
      return accounts.filter((account) =>
        addresses.some((addr) => isSameAddress(addr, account.address))
      );
    }
    return [];
  }, [documentVisibility, keyringId]);

  const { value: allAccounts } = useAsync(
    wallet.getAllVisibleAccountsArray,
    []
  );

  const isNewUserImport = React.useMemo(() => {
    return allAccounts?.length === 1;
  }, [!!allAccounts?.length]);

  const getStarted = React.useCallback(() => {
    if (isNewUserImport) {
      history.push({
        pathname: '/new-user/ready',
      });
    } else {
      window.close();
    }
  }, [isNewUserImport]);

  const closeConnect = React.useCallback(() => {
    if (store.clearKeyringId) {
      wallet.requestKeyring(hd, 'cleanUp', store.clearKeyringId, true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      closeConnect();
    });
    return () => {
      closeConnect();
    };
  }, []);

  const { data: chainList } = useRequest(
    async () => {
      const account = accounts?.[0];
      if (!account) {
        return;
      }
      if (account?.type === KEYRING_TYPE.GnosisKeyring) {
        const networks = await wallet.getGnosisNetworkIds(account.address);
        return networks
          .map((networkId) => {
            return findChain({
              networkId,
            }) as Chain;
          })
          .filter((item) => !!item);
      }
    },
    {
      refreshDeps: [accounts?.[0]],
    }
  );

  return (
    <UiProvider>
      <Container>
        <Content>
          <div className="flex flex-col gap-6">
            <div className="text-24 font-medium text-r-neutral-title1 text-center">
              {t(
                isCreated
                  ? 'page.newUserImport.successful.create'
                  : 'page.newUserImport.successful.import'
              )}
            </div>
            <div className="flex flex-col gap-4 pt-6 overflow-y-scroll max-h-[324px]">
              {accounts?.map((account) => {
                if (!account?.address) {
                  return null;
                }
                return <AccountItem key={account.address} account={account} />;
              })}
              <GnosisChainList chainList={chainList} className="mt-[-4px]" />
            </div>
          </div>
        </Content>
        <Action>
          <Button onClick={getStarted} className="w-full">
            {isNewUserImport
              ? t('page.newUserImport.successful.start')
              : t('global.Done')}
          </Button>
        </Action>
      </Container>
    </UiProvider>
  );
};
