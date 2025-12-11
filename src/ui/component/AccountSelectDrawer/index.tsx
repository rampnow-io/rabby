import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Button, DrawerProps } from 'antd';
import BN from 'bignumber.js';
import { useTranslation } from 'react-i18next';
import FieldCheckbox from 'ui/component/FieldCheckbox';
import AddressViewer from 'ui/component/AddressViewer';
import { Account } from 'background/service/preference';
import { pickKeyringThemeIcon } from '@/utils/account';
import { useWallet, isSameAddress, formatTokenAmount } from 'ui/utils';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { KEYRING_TYPE, WALLET_BRAND_CONTENT, CHAINS } from 'consts';
import { CommonSignal } from '../ConnectStatus/CommonSignal';
import { useWalletConnectIcon } from '../WalletConnect/useWalletConnectIcon';
import { findChain } from '@/utils/chain';
import { ReactComponent as RcIconEmpty } from '@/ui/assets/empty-cc.svg';
import clsx from 'clsx';
import { sortBy } from 'lodash';
import { cn } from '@repo/utils/string';

interface AccountSelectDrawerProps {
  onChange(account: Account): void;
  onCancel(): void;
  title: string;
  visible: boolean;
  isLoading?: boolean;
  networkId: string;
  owners?: string[];
  getContainer?: DrawerProps['getContainer'];
}

interface AccountItemProps {
  account: Account;
  checked: boolean;
  onSelect(account: Account): void;
  networkId: string;
}

export const AccountItem = ({
  account,
  onSelect,
  checked,
  networkId,
}: AccountItemProps) => {
  const [alianName, setAlianName] = useState('');
  const [nativeTokenBalance, setNativeTokenBalance] = useState<null | string>(
    null
  );
  const [nativeTokenSymbol, setNativeTokenSymbol] = useState('ETH');
  const wallet = useWallet();

  const init = async (networkId) => {
    const name = (await wallet.getAlianName(account.address))!;

    const chain = findChain({
      id: +networkId,
    });
    if (!chain) {
      return;
    }
    setNativeTokenSymbol(chain.nativeTokenSymbol);
    setAlianName(name);
  };

  const fetchNativeTokenBalance = async () => {
    const chain = findChain({
      id: +networkId,
    });
    if (!chain) {
      return;
    }
    const balanceInWei = await wallet.requestETHRpc<any>(
      {
        method: 'eth_getBalance',
        params: [account.address, 'latest'],
      },
      chain.serverId,
      account
    );
    setNativeTokenBalance(new BN(balanceInWei).div(1e18).toFixed());
  };

  useEffect(() => {
    if (checked && nativeTokenBalance === null) {
      fetchNativeTokenBalance();
    }
  }, [checked]);

  useEffect(() => {
    init(networkId);
  }, [networkId]);

  const brandIcon = useWalletConnectIcon(account);

  const { isDarkTheme } = useThemeMode();

  const addressTypeIcon = useMemo(() => {
    const brandName = account.brandName;
    return (
      brandIcon ||
      pickKeyringThemeIcon(brandName as any, {
        needLightVersion: isDarkTheme,
      }) ||
      WALLET_BRAND_CONTENT?.[brandName]?.image
    );
  }, [account, brandIcon, isDarkTheme]);

  return (
    <FieldCheckbox
      className="flex items-center gap-3 p-3 rounded-md hover:bg-r-neutral-card-2 cursor-pointer"
      showCheckbox={!!account.type}
      onChange={(checked) => checked && onSelect(account)}
      checked={checked}
    >
      <div className="icon-keyring relative w-[28px] h-[28px]">
        <img width={24} height={24} src={addressTypeIcon} />
        <CommonSignal
          type={account.type}
          brandName={account.brandName}
          address={account.address}
          className="absolute bottom-[2px] right-0"
        />
      </div>
      <div className="flex w-full justify-between items-center">
        <div>
          <p className="text-[15px] font-medium text-r-neutral-title1 mb-[4px]">
            {alianName}
          </p>

          <AddressViewer address={account.address} showArrow={false} />
        </div>

        <div className="text-xs text-r-neutral-body pr-3 flex items-center">
          {nativeTokenBalance !== null &&
            `${formatTokenAmount(nativeTokenBalance)} ${nativeTokenSymbol}`}
        </div>
      </div>
    </FieldCheckbox>
  );
};

const AccountSelectDrawer = ({
  onChange,
  title,
  onCancel,
  visible,
  isLoading = false,
  networkId,
  owners,
  getContainer,
}: AccountSelectDrawerProps) => {
  const [checkedAccount, setCheckedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { t } = useTranslation();
  const wallet = useWallet();

  const init = async () => {
    const visibleAccounts: Account[] = await wallet.getAllVisibleAccountsArray();
    const result = sortBy(
      visibleAccounts.filter(
        (account) => account.type !== KEYRING_TYPE.GnosisKeyring
      ),
      (account) => {
        return owners?.find((address) =>
          isSameAddress(address, account.address)
        )
          ? -1
          : 1;
      },
      (account) => {
        if (account.type === KEYRING_TYPE.HdKeyring) {
          return 1;
        }
        if (account.type === KEYRING_TYPE.SimpleKeyring) {
          return 2;
        }
        return account.type === KEYRING_TYPE.WatchAddressKeyring ? 10 : 3;
      }
    );
    setAccounts(result);
  };

  const handleSelectAccount = (account: Account) => {
    setCheckedAccount(account);
  };

  useEffect(() => {
    init();
  }, [owners]);

  return (
    <Drawer
      height="60%"
      visible={visible}
      placement="bottom"
      maskClosable
      onClose={onCancel}
      getContainer={getContainer}
      className={cn(
        'account-select is-support-darkmode',
        '[&_.ant-drawer-content-wrapper]:rounded-t-[16px]',
        '[&_.ant-drawer-content-wrapper]:overflow-hidden',
        '[&_.ant-drawer-close]:hidden',
        '[&_.ant-drawer-body]:flex',
        '[&_.ant-drawer-body]:flex-col'
      )}
    >
      <div className="text-[20px] font-medium text-r-neutral-title1 mb-4 px-5 pt-5">
        {title}
      </div>

      <div className="flex-1 overflow-auto px-5 list">
        {accounts.map((account) => (
          <AccountItem
            key={`${account.type}-${account.address}`}
            account={account}
            onSelect={handleSelectAccount}
            networkId={networkId}
            checked={
              checkedAccount
                ? isSameAddress(account.address, checkedAccount.address) &&
                  checkedAccount.brandName === account.brandName
                : false
            }
          />
        ))}

        {!accounts.length && (
          <div className="flex flex-col items-center justify-center h-full text-r-neutral-foot">
            <div className="w-8 h-8 mb-4">
              <RcIconEmpty />
            </div>
            <div className="text-[14px] leading-[24px]">
              No available address
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-r-neutral-bg-1 border-t border-rabby-neutral-line flex gap-4">
        <Button
          onClick={onCancel}
          type="ghost"
          className={clsx(
            'text-r-blue-default border-blue-light',
            'hover:bg-[#8697FF1A] active:bg-[#0000001A]',
            'disabled:bg-transparent disabled:opacity-40 disabled:hover:bg-transparent',
            'before:content-none'
          )}
        >
          {t('component.AccountSelectDrawer.btn.cancel')}
        </Button>

        <Button
          type="primary"
          onClick={() => checkedAccount && onChange(checkedAccount)}
          disabled={!checkedAccount}
          loading={isLoading}
        >
          {t('component.AccountSelectDrawer.btn.proceed')}
        </Button>
      </div>
    </Drawer>
  );
};

export default AccountSelectDrawer;
