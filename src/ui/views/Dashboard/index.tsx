import clsx from 'clsx';
import React, { useEffect } from 'react';

import { useHistory } from 'react-router-dom';
import { connectStore, useRabbyDispatch } from 'ui/store';
import { useWallet } from 'ui/utils';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardPanel } from './components/DashboardPanel';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import Settings from './components/Settings';
import { Container, Content, useOpenClose } from '@repo/ui';
import { UIContainer } from '@/ui/provider';

const Dashboard = () => {
  const history = useHistory();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();
  const currentAccount = useCurrentAccount();

  const getCurrentAccount = async () => {
    const account = await dispatch.account.getCurrentAccountAsync();
    if (!account) {
      history.replace('/no-address');
      return;
    }
  };

  useEffect(() => {
    getCurrentAccount();
  }, []);

  useEffect(() => {
    if (currentAccount) {
      dispatch.gift.checkGiftEligibilityAsync({
        address: currentAccount.address,
        currentAccount,
      });
    }
  }, [currentAccount]);

  useEffect(() => {
    (async () => {
      await dispatch.addressManagement.getHilightedAddressesAsync();
      dispatch.accountToDisplay.getAllAccountsToDisplay();
      const pendingCount = await wallet.getPendingApprovalCount();
      const hasAnyAccountClaimedGift = await wallet.getHasAnyAccountClaimedGift();
      dispatch.gift.setField({ hasClaimedGift: hasAnyAccountClaimedGift });
    })();
  }, []);

  useEffect(() => {
    dispatch.appVersion.checkIfFirstLoginAsync();
  }, [dispatch]);

  const [isVisible, openModal, closeModal] = useOpenClose(false);

  return (
    <UIContainer>
      <Container className="bg-card-border">
        <Content className="px-0 py-0">
          <div className="flex h-full flex-col gap-3">
            <DashboardHeader onSettingClick={openModal} />
            <DashboardPanel />
          </div>
        </Content>
      </Container>
      <Settings visible={isVisible} onClose={closeModal} />
    </UIContainer>
  );
};

export default connectStore()(Dashboard);
