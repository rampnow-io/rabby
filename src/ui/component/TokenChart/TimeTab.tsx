import clsx from 'clsx';
import dayjs from 'dayjs';
import React from 'react';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export type TabKey = typeof TIME_TAB_LIST[number]['key'];

export const TIME_TAB_LIST = [
  {
    label: '1D',
    key: '24h' as const,
    value: [0, dayjs()],
  },
  {
    label: '1W',
    key: '1W' as const,
    value: [dayjs().add(-7, 'd'), dayjs()],
  },
  {
    label: '1M',
    key: '1M' as const,
    value: [dayjs().add(-1, 'month'), dayjs()],
  },
  {
    label: '1Y',
    key: '1Y' as const,
    value: [dayjs().add(-1, 'year'), dayjs()],
  },
].map((item) => {
  const v0 = item.value[0];
  const v1 = item.value[1];

  return {
    ...item,
    value: [
      typeof v0 === 'number' ? v0 : v0.utcOffset(0).startOf('day').unix(),
      typeof v1 === 'number' ? v1 : v1.utcOffset(0).startOf('day').unix(),
    ],
  };
});

export const REAL_TIME_TAB_LIST: TabKey[] = ['24h', '1W'];

export const TimeTab = ({
  activeKey,
  onSelect,
}: {
  activeKey: TabKey;
  onSelect: (key: TabKey) => void;
}) => {
  return (
    <div className="flex items-center justify-between">
      {TIME_TAB_LIST.map((e) => (
        <div
          key={e.key}
          onClick={() => {
            onSelect(e.key);
          }}
          className={clsx(
            'flex items-center justify-center h-8 w-8 cursor-pointer',
            'text-sm font-normal token-detail-time-tab',
            activeKey === e.key && 'bg-primary rounded-full',
            activeKey === e.key
              ? 'text-primary-foreground'
              : 'text-secondary-foreground hover:text-primary-foreground'
          )}
        >
          {e.label}
        </div>
      ))}
    </div>
  );
};
