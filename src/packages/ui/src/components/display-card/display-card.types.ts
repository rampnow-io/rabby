import type React from 'react';

export type CardRow = React.ReactNode | string;

export interface DisplayCardProps {
  rows: CardRow[][];
  heading?: string;
}
