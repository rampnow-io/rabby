import { Card, Input, InputSize, Separator } from '@repo/ui/primitives';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useWallet } from 'ui/utils';
import { useRabbySelector } from '@/ui/store';
import { isValidAddress } from '@ethereumjs/util';
import { groupBy } from 'lodash';
import { truncate } from '@repo/utils';
import { filterMyAccounts, findAccountByPriority } from '@/utils/account';
import type { Account } from '@/background/service/preference';

interface Pros {
  address: string;
  setAddress: (address: string) => void;
}

type RenderAccount = Account & {
  _inWhitelist: boolean;
  _isFirstOtherAccount?: boolean;
  alias?: string;
};

// Constants
const COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-cyan-500',
];

const CARD_STYLES = {
  selected:
    'cursor-pointer rounded-[12px] px-2 py-3 border border-[rgba(24,24,27,0.06)] bg-[rgba(24,24,27,0.02)]',
  avatar: 'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
};

// Utility Functions
const getColorFromAddress = (addr: string): string => {
  const hash = addr
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

// Sub-component for rendering an account item
interface AccountItemProps {
  item: RenderAccount;
  onSelect: (address: string, display: string) => void;
}

const AccountItem = React.memo(({ item, onSelect }: AccountItemProps) => (
  <Card
    className={`${CARD_STYLES.selected} flex items-center gap-2`}
    onClick={() => onSelect(item.address, item.alias || item.address)}
  >
    <div
      className={`${CARD_STYLES.avatar} ${getColorFromAddress(item.address)}`}
    >
      👤
    </div>
    <p>{item.alias || truncate(item.address, [8, 8])}</p>
  </Card>
));

AccountItem.displayName = 'AccountItem';

// Main Component
const DNSAddressInput = ({ address, setAddress }: Pros) => {
  const [value, setValue] = useState('');
  const [isShowInput, setIsShowInput] = useState(true);
  const wallet = useWallet();

  const isValidAddr = useMemo(() => isValidAddress(address), [address]);
  console.log(isValidAddr, 'isValidAddr');
  // Auto-hide input when a valid address is selected, show it when address becomes invalid
  useEffect(() => {
    if (isValidAddr) {
      setIsShowInput(false);
    }
  }, [isValidAddr]);

  const handleAddressResolution = useCallback(
    async (inputValue: string) => {
      if (isValidAddress(inputValue)) {
        setAddress(inputValue);
      } else if (inputValue) {
        try {
          const result = await wallet.openapi.getEnsAddressByName(inputValue);
          setAddress(result?.addr ? result.addr : '');
        } catch {
          setAddress('');
        }
      } else {
        setAddress('');
      }
    },
    [wallet, setAddress]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.trim();
      setValue(newValue);
      handleAddressResolution(newValue);
    },
    [handleAddressResolution]
  );

  const handleSelectAccount = useCallback(
    (accountAddress: string, displayValue: string) => {
      setAddress(accountAddress);
      setValue(displayValue);
      setIsShowInput(false);
    },
    [setAddress]
  );

  const { whitelist } = useRabbySelector((s) => ({
    whitelist: s.whitelist.whitelist,
  }));

  const { accountsList } = useRabbySelector((s) => ({
    accountsList: s.accountToDisplay.accountsList,
  }));

  const sortedAccounts = useMemo(() => {
    const whitelistSet = new Set(whitelist.map((item) => item.toLowerCase()));
    const groupAccounts = groupBy(accountsList, (item) =>
      item.address.toLowerCase()
    );

    const myImportedAccounts: RenderAccount[] = [];
    const otherAccounts: RenderAccount[] = [];

    Object.values(groupAccounts).forEach((item) => {
      const result = findAccountByPriority(item);
      const value: RenderAccount = {
        ...result,
        _inWhitelist: whitelistSet.has(result.address.toLowerCase()),
      };

      const { isMyImported, isGnosis } = filterMyAccounts(value);
      const targetList =
        isMyImported || isGnosis ? myImportedAccounts : otherAccounts;

      if (!isMyImported && !targetList.length) {
        value._isFirstOtherAccount = true;
      }

      if ((targetList[0]?.balance || 0) >= (value.balance || 0)) {
        targetList.push(value);
      } else {
        targetList.unshift(value);
      }
    });

    return myImportedAccounts.concat(otherAccounts);
  }, [accountsList, whitelist]);
  console.log(isShowInput, 'isShowInput');
  return (
    <div className="flex flex-col gap-3">
      {isShowInput && (
        <div className="flex items-center gap-3 px-2 bg-r-neutral-bg-1 rounded-lg border border-r-neutral-line">
          <label className="text-14 flex items-center text-secondary-foreground justify-center font-medium min-w-8">
            To
          </label>
          <Separator orientation="vertical" />
          <Input
            placeholder="Wallet Address / ENS"
            value={value}
            sizeVariant={InputSize.SM}
            onChange={handleInputChange}
            className="flex-1 text-14 border-0 outline-0 bg-transparent p-0"
          />
        </div>
      )}

      {isValidAddr && (
        <Card
          onClick={() => setIsShowInput(!isShowInput)}
          className={`${CARD_STYLES.selected}`}
        >
          <div className="flex gap-2">
            <div className={`${CARD_STYLES.avatar} bg-green-500`}>🕶️</div>
            <p>{truncate(address, [8, 8])}</p>
          </div>
        </Card>
      )}

      {isShowInput && !isValidAddr && sortedAccounts.length > 0 && (
        <div className="flex flex-col gap-4 px-2">
          <div className="text-sm font-normal text-secondary-foreground mb-4">
            Your wallets
          </div>
          {sortedAccounts.map((item) => (
            <AccountItem
              key={`${item.address}-${item.type}`}
              item={item}
              onSelect={handleSelectAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DNSAddressInput;
