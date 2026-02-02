import { IconLedger, IconTrezor } from '@/ui/assets';
import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content } from '@repo/ui';
import { Card } from '@repo/ui/primitives';
import { title } from 'process';
import React from 'react';

const HardwareWalletList = () => {
  const List = [
    {
      title: 'Ledger',
      icon: <IconLedger />,
      desc: 'Supports Ledger Nano S, Nano S Plus, Nano X, and Stax devices.',
    },
    {
      title: 'Trezor',
      icon: <IconTrezor />,
      desc: 'Supports Model one or Model T device.',
    },
  ];

  return (
    <UIContainer>
      <Container>
        <HeaderNavPage
          handleBack={() => {
            if (history.length) {
              history.back();
            }
          }}
        >
          <div className="text-primary-foreground text-xl font-normal">
            Connect a hardware wallet
          </div>
        </HeaderNavPage>
        <Content>
          <div className="flex flex-col gap-4 mt-4">
            {List.map((item) => (
              <Card
                key={item.title}
                className="w-full rounded-lg cursor-pointer bg-[#FAFAFA] p-4  gap-4 "
              >
                <div className="flex flex-col gap-4">
                  {/* Replace with actual icon component */}
                  <div>{item.icon}</div>

                  <div className="flex flex-col">
                    <span className="text-primary-foreground  text-[14px]">
                      {item.desc}
                    </span>
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

export default HardwareWalletList;
