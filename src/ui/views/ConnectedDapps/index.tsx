import React from 'react';
import { useHistory } from 'react-router-dom';
import { HeaderNavPage } from '@/ui/component';
import { UIContainer } from '@/ui/provider';
import { Container, Content } from '@repo/ui';
import { RecentConnections } from '../Dashboard/components';

const ConnectedDappsPage = () => {
  const history = useHistory();

  const handleClose = () => {
    history.goBack();
  };

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
            Connected Dapps
          </div>
        </HeaderNavPage>
        <Content>
          <RecentConnections
            visible={true}
            onClose={handleClose}
            canBack={false}
          />
        </Content>
      </Container>
    </UIContainer>
  );
};

export default ConnectedDappsPage;
