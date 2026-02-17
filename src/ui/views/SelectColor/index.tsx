import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { Button } from '@repo/ui/primitives';
import { HeaderNavPage } from '@/ui/component';
import { UiProvider } from '@/ui/component/NewUserImport';
import { Action, Container, Content } from '@repo/ui';
import AccountColorPicker from '@/ui/component/AccountColorPicker';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import SectionHeader from '@/ui/component/section-header/section-header';

const SELECTED_COLOR_KEY = 'rabby_selected_account_color';

const ColorPickerWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
`;

interface SelectColorProps {
  onColorSelected?: (color: string) => void;
  nextPath?: string;
}

const SelectColor: React.FC<SelectColorProps> = ({
  onColorSelected,
  nextPath = '/new-user/ready',
}) => {
  const history = useHistory();
  const dispatch = useRabbyDispatch();
  const selectedColor = useRabbySelector((s) => s.newUserGuide.accountColor);

  // Load color from localStorage on mount
  useEffect(() => {
    const savedColor = localStorage.getItem(SELECTED_COLOR_KEY);
    if (savedColor && !selectedColor) {
      dispatch.newUserGuide.setState({ accountColor: savedColor });
    }
  }, []);

  const handleColorChange = (color: string) => {
    // Color comes already normalized from AccountColorPicker
    // Color is already uppercase from palette
    dispatch.newUserGuide.setState({ accountColor: color });
    // Save to localStorage for persistence
    localStorage.setItem(SELECTED_COLOR_KEY, color);
    onColorSelected?.(color);
  };

  const handleContinue = () => {
    history.push(nextPath);
  };

  return (
    <UiProvider>
      <Container>
        <HeaderNavPage />
        <SectionHeader
          className="text-center"
          title="Choose your account color"
          description="Pick a color to personalize your wallet account."
        />
        <Content className="px-[55px]">
          <AccountColorPicker
            value={selectedColor}
            onChange={handleColorChange}
          />
        </Content>
        <Action>
          <Button onClick={handleContinue}>Create wallet</Button>
        </Action>
      </Container>
    </UiProvider>
  );
};

export default SelectColor;
