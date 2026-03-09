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
  value: string;
  onChange: (value: string) => void;
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
    'cursor-pointer rounded-[12px] px-2 py-3 h-[44px] flex py-3 px-2 items-center gap-3 border border-[rgba(24,24,27,0.06)] bg-[rgba(24,24,27,0.02)]',
  avatar:
    'w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0',
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
    className={`bg-white  cursor-pointer rounded-[12px] px-2 py-3 h-[44px] hover:bg-gray-100 border-none flex items-center gap-2 shadow-none `}
    onClick={() => onSelect(item.address, item.alias || item.address)}
  >
    <div
      className={`${CARD_STYLES.avatar} ${getColorFromAddress(item.address)}`}
    >
      👤
    </div>
    <p className="text-sm h-full flex items-center font-normal text-secondary-foreground">
      {item.alias || truncate(item.address, [13, 13])}
    </p>
  </Card>
));

AccountItem.displayName = 'AccountItem';

// Main Component
const ToAddress = ({ value, onChange }: Pros) => {
  const [inputValue, setInputValue] = useState('');
  const [isShowInput, setIsShowInput] = useState(true);
  const wallet = useWallet();

  const isValidAddr = useMemo(() => isValidAddress(inputValue), [inputValue]);

  // Consolidated effect: handle syncing from prop value and controlling input visibility
  useEffect(() => {
    // Only update inputValue if it actually changed to avoid unnecessary re-renders
    if (value !== inputValue) {
      setInputValue(value);
    }

    // Control input visibility based on the prop value, not local state
    // Show input if: no value OR invalid address
    // Hide input if: valid address
    if (value && isValidAddress(value)) {
      setIsShowInput(false);
    } else if (!value || !isValidAddress(value)) {
      setIsShowInput(true);
    }
  }, [value]);

  const handleAddressResolution = useCallback(
    async (addressInput: string) => {
      if (isValidAddress(addressInput)) {
        onChange(addressInput);
      } else if (addressInput) {
        try {
          const result = await wallet.openapi.getEnsAddressByName(addressInput);
          onChange(result?.addr ? result.addr : '');
        } catch {
          onChange('');
        }
      } else {
        onChange('');
      }
    },
    [wallet, onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.trim();
      setInputValue(newValue);
      handleAddressResolution(newValue);
    },
    [handleAddressResolution]
  );

  const handleSelectAccount = useCallback(
    (accountAddress: string, displayValue: string) => {
      onChange(accountAddress);
      setInputValue(displayValue);
      setIsShowInput(false);
    },
    [onChange]
  );

  const { whitelist } = useRabbySelector((s) => ({
    whitelist: s.whitelist.whitelist,
  }));

  const { accountsList } = useRabbySelector((s) => ({
    accountsList: s.accountToDisplay.accountsList,
  }));

  const currentAccountAddress = useRabbySelector(
    (s) => s.account.currentAccount?.address
  );

  const sortedAccounts = useMemo(() => {
    const whitelistSet = new Set(whitelist.map((item) => item.toLowerCase()));
    const groupAccounts = groupBy(accountsList, (item) =>
      item.address.toLowerCase()
    );

    const myImportedAccounts: RenderAccount[] = [];
    const otherAccounts: RenderAccount[] = [];

    Object.values(groupAccounts).forEach((item) => {
      const result = findAccountByPriority(item);

      if (
        currentAccountAddress &&
        result.address.toLowerCase() === currentAccountAddress.toLowerCase()
      ) {
        return;
      }

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
  }, [accountsList, whitelist, currentAccountAddress]);
  return (
    <div className="flex flex-col gap-3">
      {isShowInput && (
        <div className="flex items-center gap-3 px-2 bg-r-neutral-bg-1 rounded-lg border border-r-neutral-line">
          <label className="text-14 flex items-center text-secondary-foreground justify-center font-medium min-w-8">
            To
          </label>
          <div className="w-px !h-10 bg-r-neutral-line" />
          <Input
            placeholder="Wallet Address"
            value={inputValue}
            sizeVariant={InputSize.SM}
            onChange={handleInputChange}
            className="flex-1 text-14 border-0 outline-0 bg-transparent p-0"
          />
        </div>
      )}

      {isValidAddr && (
        <Card
          onClick={() => setIsShowInput(!isShowInput)}
          className={`${CARD_STYLES.selected} `}
        >
          <div className={`${CARD_STYLES.avatar} bg-[#BBF7D0] text-[17.455px]`}>
            🕶️
          </div>
          <p className="text-sm h-full flex items-center font-normal text-[#252830]">
            {truncate(inputValue, [13, 13])}
          </p>
        </Card>
      )}

      {isShowInput && !isValidAddr && sortedAccounts.length > 0 && (
        <div className="flex flex-col gap-4 px-2">
          <div className="text-sm font-normal text-secondary-foreground mb-2">
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

export default ToAddress;
