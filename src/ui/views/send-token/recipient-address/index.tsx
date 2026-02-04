import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@repo/ui/primitives';
import styled from 'styled-components';
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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background-color: var(--r-neutral-bg-2, #ffffff);
`;

const ToSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--r-neutral-bg-1, #f5f5f5);
  border-radius: 8px;
  border: 1px solid var(--r-neutral-line, rgba(0, 0, 0, 0.1));
`;

const ToLabel = styled.label`
  font-size: 14px;
  color: var(--r-neutral-body, #999999);
  min-width: 40px;
  font-weight: 500;
`;

const AddressInput = styled(Input)`
  flex: 1;
  font-size: 14px;
  font-family: monospace;

  &::placeholder {
    color: var(--r-neutral-foot, #cccccc);
  }
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--r-neutral-body, #999999);
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
`;

const AddressItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddressItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--r-neutral-bg-1, #f5f5f5);
  border-radius: 8px;
  border: 1px solid var(--r-neutral-line, rgba(0, 0, 0, 0.1));
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--r-blue-default, #7084ff);
    background-color: var(--r-blue-light-1, #eef1ff);
  }
`;

const AvatarCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background-color: var(--r-neutral-line, rgba(0, 0, 0, 0.1));
`;

const AddressItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const AddressItemName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--r-neutral-title-1, #000000);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AddressItemText = styled.div`
  font-size: 12px;
  color: var(--r-neutral-body, #999999);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

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
const MOCK_RECENT_ADDRESSES: Array<{ address: string; emoji: string }> = [
  {
    address: '0xC48D7FD0dE04e4cvB2c5...8468a9B76C50F',
    emoji: '😂',
  },
];

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
      setError('Invalid Ethereum address');
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
        return {
          address: account.address,
          name: contact?.name || account.alias || account.brandName || 'Wallet',
          emoji: '👓', // Default wallet emoji - can be customized per wallet type
          type: account.type,
        };
      })
      .slice(0, 2); // Show first 2 wallets
  }, [accountsList, contactsByAddr]);

  const handleAddressClick = (address: string) => {
    onChange(address);
  };

  return (
    <Container>
      {/* To Address Input Section */}
      <ToSection>
        <ToLabel>To</ToLabel>
        <AddressInput
          placeholder="0x7fdF0d0e4cvB2c.....8468a9B76C50F"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '0',
          }}
        />
      </ToSection>

      {error && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--r-red-default, #ff0000)',
            paddingLeft: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Recent Recipients Section - only show when input is empty */}
      {value === '' && MOCK_RECENT_ADDRESSES.length > 0 && (
        <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <SectionTitle>Recents</SectionTitle>
          <AddressItemsList>
            {MOCK_RECENT_ADDRESSES.map((item, idx) => (
              <AddressItem
                key={idx}
                onClick={() => handleAddressClick(item.address)}
              >
                <AvatarCircle>{item.emoji}</AvatarCircle>
                <AddressItemContent>
                  <AddressItemText>{item.address}</AddressItemText>
                </AddressItemContent>
              </AddressItem>
            ))}
          </AddressItemsList>
        </div>
      )}

      {/* Your Wallets Section */}
      {value === '' && walletsList.length > 0 && (
        <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <SectionTitle>Your wallets</SectionTitle>
          <AddressItemsList>
            {walletsList.map((wallet, idx) => (
              <AddressItem
                key={wallet.address}
                onClick={() => handleAddressClick(wallet.address)}
              >
                <AvatarCircle>{wallet.emoji}</AvatarCircle>
                <AddressItemContent>
                  <AddressItemName>{wallet.name}</AddressItemName>
                  <AddressItemText>
                    {formatAddress(wallet.address)}
                  </AddressItemText>
                </AddressItemContent>
              </AddressItem>
            ))}
          </AddressItemsList>
        </div>
      )}

      {isValid && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--r-green-light-1, #f0f9f7)',
            border: '1px solid var(--r-green-default, #2dd4bf)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--r-green-default, #2dd4bf)',
          }}
        >
          ✓ Valid address
        </div>
      )}
    </Container>
  );
};

export default RecipientAddress;
