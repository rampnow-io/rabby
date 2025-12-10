export const labelView = (value: string): React.ReactNode => (
  <div className="text-xs font-medium uppercase text-gray-500">{value}</div>
);

export const valueView = (value?: string): React.ReactNode => (
  <div className="text-sm text-gray-900">{value ?? ''}</div>
);
