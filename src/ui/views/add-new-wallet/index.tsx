import { IconConnectHardware, IconCreate, IconImport } from '@/ui/assets';
import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { Container, Content } from '@repo/ui';
import { Card } from '@repo/ui/primitives';
import React from 'react';
import { useHistory } from 'react-router-dom';

const AddWallet = () => {
  const history = useHistory();

  const menuItems = [
    {
      key: 'create-wallet',
      title: 'Create a new wallet',
      icon: <IconCreate />,
      desc: 'Create a new seed phrase for a new wallet',
      onClick: () => {
        history.push('/mnemonics/create');
      },
    },
    {
      key: 'import-wallet',
      title: 'Import wallet',
      icon: <IconImport />,
      desc: 'Import an existing wallet using a seed phrase or private key',
      onClick: () => {
        history.push('/add-existing-wallet');
      },
    },
    {
      key: 'connect-hardware-wallet',
      title: 'Connect you hardware wallet',
      icon: <IconConnectHardware />,
      desc: 'Add accounts from your hardware wallet',
      onClick: () => {
        history.push('/hardware-wallet-list');
      },
    },
  ];
  return (
    <UIContainer>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            if (history.length) {
              history.goBack();
            }
          }}
        >
          <div className="text-primary-foreground text-xl font-normal">
            Add Wallet
          </div>
        </HeaderNavPage>
        <Content className="px-4">
          <div className="flex flex-col gap-5">
            {menuItems.map((item) => (
              <Card
                key={item.key}
                className="w-full p-4 rounded-[20px]  cursor-pointer border-none bg-[#FAFAFA]  flex gap-4 justify-between items-start"
              >
                <div className="gap-4 flex items-start" onClick={item.onClick}>
                  <div className="bg-[#c3f53c] h-11 w-11 rounded-[50%] flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-base font-normal text-primary-foreground">
                      {item.title}
                    </div>
                    <div className="text-sm font-normal text-secondary-foreground">
                      {item.desc}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Content>
      </Container>
    </UIContainer>
  );
};

export default AddWallet;
