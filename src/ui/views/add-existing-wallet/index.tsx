import { IconPrivateKey, IconSeedPhrase } from '@/ui/assets';
import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { icons } from '@/ui/utils';
import { Container, Content } from '@repo/ui';
import { Card } from '@repo/ui/primitives';
import React from 'react';
import { useHistory } from 'react-router-dom';

const AddExistingWallet = () => {
  const history = useHistory();

  const menuItems = [
    {
      key: 'import-mnemonic',
      title: 'Import Recovery Phrase',
      icon: <IconSeedPhrase />,
      desc:
        'Add a wallet group using your 12 or 24 word Secret Recovery Phrase',
      onClick: () => {
        history.push('/import/mnemonics');
      },
    },
    {
      key: 'import-private-key',
      title: 'Import Private Key',
      icon: <IconPrivateKey />,
      desc: 'Add a single wallet using your 64-character Private Key',
      onClick: () => {
        history.push('/import/key');
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
            Add Existing Wallet
          </div>
        </HeaderNavPage>
        <Content className="px-4">
          <div className="flex flex-col gap-5">
            {menuItems.map((item) => (
              <Card
                key={item.key}
                className="w-full rounded-[16px] cursor-pointer border-none bg-[#FAFAFA] p-4 flex gap-4 justify-between items-start"
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

export default AddExistingWallet;
