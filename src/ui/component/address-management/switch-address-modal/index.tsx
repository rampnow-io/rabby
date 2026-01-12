import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BottomFloatingSheet from '../../BottomFloatingPopup';
import { IDisplayedAccountWithBalance } from '@/ui/models/accountToDisplay';
import { useAccounts } from '@/ui/hooks/useAccounts';
import { useHistory, useLocation } from 'react-router-dom';
import { useRabbyDispatch } from '@/ui/store';
import { obj2query } from '@/ui/utils/url';
import useDebounceValue from '@/ui/hooks/useDebounceValue';
import { X } from 'lucide-react';
import { useRequest } from 'ahooks';
import AddressCard from './address-card/address-card';
import { Button, ButtonType } from '@repo/ui/primitives';
import AddWalletModal from '../add-wallet';

interface Props {
  visible: boolean;
  closeAndReject: () => void;
}

const SwitchAddressModal = ({ visible, closeAndReject: onClose }: Props) => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useRabbyDispatch();
  const [addWalletVisible, setAddWalletVisible] = useState(false);

  const enableSwitch = location.pathname === '/switch-address';

  const {
    sortedAccountsList,
    addressSortStore,
    highlightedAddresses,
    fetchAllAccounts,
    loadingAccounts,
    allSortedAccountList,
  } = useAccounts();

  const { loading: isUpdatingBalance } = useRequest(
    () => dispatch.accountToDisplay.updateAllBalance(),
    { manual: true }
  );

  const [searchKeyword, setSearchKeyword] = React.useState(
    addressSortStore?.search || ''
  );
  const debouncedSearchKeyword = useDebounceValue(searchKeyword, 250);

  useEffect(() => {
    fetchAllAccounts();
  }, [fetchAllAccounts]);

  useEffect(() => {
    dispatch.preference.setAddressSortStoreValue({
      key: 'search',
      value: searchKeyword,
    });
  }, [searchKeyword, dispatch.preference]);

  const matchAccount = useCallback(
    (acc: IDisplayedAccountWithBalance, kw: string) => {
      const lower = acc.address.toLowerCase();
      const alias = acc.alianName?.toLowerCase() ?? '';
      return lower.includes(kw) || alias.includes(kw);
    },
    []
  );

  const filteredAccounts = useMemo(() => {
    const base = allSortedAccountList;
    if (!debouncedSearchKeyword) return base;

    const kw = debouncedSearchKeyword.toLowerCase();
    return base.filter((a) => matchAccount(a, kw));
  }, [allSortedAccountList, debouncedSearchKeyword, matchAccount]);

  const switchAccount = async (acc: IDisplayedAccountWithBalance) => {
    await dispatch.account.changeAccountAsync(acc);
    onClose();
  };

  const handleAddNewAddress = () => {
    onClose();
    setAddWalletVisible(true);
  };

  return (
    <>
      <BottomFloatingSheet
        contentClassName="px-4 pt-4 pb-4"
        hideCloseButton
        open={visible}
        onClose={onClose}
      >
        <div className="h-full flex flex-col">
          <div className="pt-5 pb-3 flex justify-between items-center">
            <div className="text-xl font-medium">Accounts</div>
            <X
              size={22}
              onClick={onClose}
              className="cursor-pointer text-gray-500 hover:text-gray-700"
            />
          </div>

          <div className="flex-1 overflow-y-auto pb-[120px]">
            {filteredAccounts.map((acc) => (
              <div key={acc.address} className="mb-3">
                <AddressCard
                  balance={acc.balance}
                  address={acc.address}
                  type={acc.type}
                  brandName={acc.brandName}
                  alias={acc.alianName}
                  isUpdatingBalance={isUpdatingBalance}
                  enableSwitch={enableSwitch}
                  isCurrentAccount
                  onSwitchCurrentAccount={() => switchAccount(acc)}
                  onClick={() =>
                    history.push(
                      `/settings/address-detail?${obj2query({
                        address: acc.address,
                        type: acc.type,
                        brandName: acc.brandName,
                        byImport: String(acc.byImport ?? ''),
                      })}`
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-white  py-4 ">
            <Button
              buttonType={ButtonType.SECONDARY}
              onClick={handleAddNewAddress}
              className="w-full"
            >
              Add New Wallet
            </Button>
          </div>
        </div>
      </BottomFloatingSheet>
      <AddWalletModal
        visible={addWalletVisible}
        onClose={() => setAddWalletVisible(false)}
      />
    </>
  );
};

export default SwitchAddressModal;
