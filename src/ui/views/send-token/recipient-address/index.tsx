import React, { useState, useEffect, useMemo } from 'react';
import { Input, InputSize, Separator } from '@repo/ui/primitives';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { isSameAddress } from '@/ui/utils';

interface RecipientAddressProps {
  value: string;
  onChange: (address: string) => void;
  onNext: () => void;
  isValid: boolean;
}

interface Account {
  address: string;
  brandName?: string;
  type?: string;
  alias?: string;
  name?: string;
}

// Validation helper
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Address formatter - shows first 8 and last 4 chars with ellipsis
const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
};

// Mock avatar emojis for recent addresses

const RecipientAddress: React.FC<RecipientAddressProps> = ({
  value,
  onChange,
  onNext,
  isValid,
}) => {
  const [error, setError] = useState<string>('');
  const dispatch = useRabbyDispatch();

  const { accountsList, contactsByAddr } = useRabbySelector((state) => {
    return {
      accountsList: state.accountToDisplay.accountsList || [],
      contactsByAddr: state.contactBook.contactsByAddr || {},
    };
  });

  // Initialize data on mount
  useEffect(() => {
    dispatch.accountToDisplay.getAllAccountsToDisplay();
    dispatch.contactBook.getContactBookAsync();
  }, [dispatch]);

  // Validate address
  useEffect(() => {
    if (value && !isValidAddress(value)) {
      setError('Invalid  address');
    } else {
      setError('');
    }
  }, [value]);

  // Process wallet list - get all accounts for "Your wallets"
  const walletsList = useMemo(() => {
    return (accountsList as Account[])
      .filter((account) => account?.address)
      .map((account) => {
        const contact = contactsByAddr[account.address.toLowerCase()];
        const walletName =
          contact?.name || account.alias || account.brandName || 'Wallet';
        return {
          address: account.address,
          name: walletName,
          firstLetter: walletName.charAt(0).toUpperCase(),
          type: account.type,
        };
      })
      .slice(0, 2); // Show first 2 wallets
  }, [accountsList, contactsByAddr]);

  const handleAddressClick = (address: string) => {
    onChange(address);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value && isValidAddress(value)) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* To Address Input Section */}
      <div
        className={`flex items-center gap-3 px-2 bg-r-neutral-bg-1 rounded-lg border ${
          error ? 'border-r-red-default' : 'border-r-neutral-line'
        }`}
      >
        <label className="text-14 flex items-center text-secondary-foreground justify-center font-medium min-w-8">
          To
        </label>
        <Separator orientation="vertical" />
        <Input
          placeholder="Wallet Address (0x...)"
          value={value}
          sizeVariant={InputSize.SM}
          onChange={(e) => onChange(e.target.value.trim())}
          onKeyDown={handleKeyDown}
          className="flex-1 text-14 border-0 outline-0 bg-transparent p-0"
        />
      </div>

      {error && <div className="text-12 text-r-red-default pl-4">{error}</div>}

      {value === '' && walletsList.length > 0 && (
        <div className="flex flex-col gap-4 px-2">
          <div className="text-sm font-normal text-secondary-foreground mb-4">
            Your wallets
          </div>
          <div className="flex flex-col gap-4">
            {walletsList.map((wallet, idx) => (
              <div
                key={wallet.address}
                className="flex items-center gap-3   rounded-lg  cursor-pointer transition-all duration-200  "
                onClick={() => handleAddressClick(wallet.address)}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-18 flex-shrink-0 bg-r-neutral-line">
                  {wallet.firstLetter}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="text-base font-medium text-primary-foreground truncate">
                    {wallet.name}
                  </div>
                  <div className="text-sm text-secondary-foreground  truncate">
                    {formatAddress(wallet.address)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientAddress;
