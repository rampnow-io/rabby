import React from 'react';
import { Bridge } from '../Bridge';
import Swap from '../Swap';
import { UIContainer } from '@/ui/provider';
import { Action, Container, Content } from '@repo/ui';
import { HeaderNavPage } from '@/ui/component';
import { useHistory } from 'react-router-dom';
import { Button } from '@repo/ui/primitives';

const SwapAndBridge = () => {
  const history = useHistory();
  const handleBack = () => {
    if (history.length) {
      history.goBack();
    }
  };
  return (
    <UIContainer>
      <Container>
        <HeaderNavPage handleBack={handleBack}>
          <div className="text-primary-foreground text-xl font-normal">
            Swap & Bridge
          </div>
        </HeaderNavPage>
        <Content></Content>
        <Action>
          <Button>Review</Button>
        </Action>
      </Container>
    </UIContainer>
  );
};

export default SwapAndBridge;
