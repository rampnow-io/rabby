import React from 'react';
import styled from 'styled-components';
import { ReactComponent as IconBackCC } from '@/ui/assets/back-with-line-cc.svg';
import { ReactComponent as IconDotCC } from '@/ui/assets/new-user-import/dot-cc.svg';
import clsx from 'clsx';
import { useThemeMode } from '@/ui/hooks/usePreference';

const StyedBg = styled.div<{
  isDarkTheme: boolean;
}>`
  background-image: url('https://cdn.rampnow.io/image/background/default.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: ${(props) => (props.isDarkTheme ? '#1A412C' : '#1A412C')};
  overflow-x: auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledCard = styled.div`
  width: 458px;
  min-height: 583px;
  border-radius: 16px;
  background-color: var(--r-neutral-bg1, #fff);
  padding: 0px 10px 20px;
  overflow-y: auto;
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--r-neutral-title1, #192945);
    text-align: center;
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    position: relative;
    min-height: 20px;
    .back-icon {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: var(--r-neutral-body, #3e495e);
      border-radius: 8px;
      padding: 6px;
    }
    .back-icon:hover {
      background: var(--r-neutral-card2, #f2f4f7);
    }
  }

  input.ant-input::placeholder {
    color: var(--r-neutral-foot, #6a7587);
  }

  button.ant-btn.ant-btn-primary.ant-btn-loading {
    border-color: #5a6acc;
    background: #5a6acc;
  }
`;

const Step = ({ step }: { step: 1 | 2 }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <IconDotCC className="text-rabby-blue-default" viewBox="0 0 8 8" />
      <div
        className={clsx(
          'w-[16px] h-[1px]',
          step === 2 ? 'bg-rabby-blue-default' : 'bg-rabby-blue-light2'
        )}
      />
      <IconDotCC
        className={clsx(
          step === 2 ? 'text-rabby-blue-default' : 'text-rabby-blue-light2'
        )}
        viewBox="0 0 8 8"
      />
    </div>
  );
};

export const Card = ({
  title,
  step,
  children,
  onBack,
  className,
  headerClassName,
  headerBlock,
  cardStyle,
}: React.PropsWithChildren<{
  title?: React.ReactNode;
  step?: 1 | 2;
  onBack?: () => void;
  className?: string;
  headerClassName?: string;
  headerBlock?: boolean;
  cardStyle?: React.CSSProperties;
}>) => {
  const { isDarkTheme } = useThemeMode();

  return (
    <StyedBg isDarkTheme={isDarkTheme}>
      <img
        src="https://cdn.rampnow.io/image/icon/general/logo-green.svg"
        alt="long-arrow"
        className="hide-on-mobile fixed left-10 top-8 z-10 m-4"
      />
      <StyledCard className={className} style={cardStyle}>
        <div
          className={clsx(
            headerBlock ? 'block' : !onBack && !title && !step && 'hidden',
            'header',
            headerClassName,
            step || title || onBack ? 'mt-5' : undefined
          )}
        >
          {!!onBack && (
            <div className="back-icon" onClick={onBack}>
              <IconBackCC
                className="w-5 h-5 text-r-neutral-body"
                viewBox="0 0 20 20"
              />
            </div>
          )}
          {!!title && <div>{title}</div>}
          {!!step && <Step step={step} />}
        </div>
        {children}
      </StyledCard>
    </StyedBg>
  );
};
