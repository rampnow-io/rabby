import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { formatPrice, useWallet } from '@/ui/utils';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  formatTokenDateCurve,
  use24hCurveData,
  useDateCurveData,
} from './hooks';
import { REAL_TIME_TAB_LIST, TabKey, TIME_TAB_LIST, TimeTab } from './TimeTab';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend,
  Filler,
} from 'chart.js';
import styled, { createGlobalStyle } from 'styled-components';
import { Skeleton } from 'antd';

const CurveWrapper = styled.div`
  width: 100%;
  height: 100%;
  z-index: 1;
  position: relative;
`;

const isRealTimeKey = (key: TabKey) => REAL_TIME_TAB_LIST.includes(key);

const DATE_FORMATTER = 'MMM DD, YYYY';

type TokenChartsProps = {
  token: TokenItem;
  className?: string;
};

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartJSTooltip,
  Legend,
  Filler
);

export const TokenCharts = ({ token: _token, className }: TokenChartsProps) => {
  const { t } = useTranslation();
  const [priceType, setPriceType] = useState<'price' | 'holding'>('price');
  const [activeKey, setActiveKey] = useState<TabKey>(TIME_TAB_LIST[0].key);
  const [ready, setReady] = useState(false);

  const currentAccount = useCurrentAccount();
  const wallet = useWallet();

  const { data: fetchedToken, loading: tokenLoading } = useRequest(
    async () => {
      if (!_token.chain || !_token.id) {
        return;
      }
      return wallet.openapi.getToken(
        currentAccount!.address,
        _token.chain,
        _token.id
      );
    },
    {
      refreshDeps: [_token.chain, _token.id, currentAccount?.address],
    }
  );

  const token = useMemo(() => fetchedToken || _token, [fetchedToken, _token]);

  const amountSum = useMemo(() => {
    return token?.amount || _token.amount || 0;
  }, [token]);

  const amount = useMemo(() => (priceType === 'holding' ? amountSum : 1), [
    priceType,
    amountSum,
  ]);

  const unHold = !tokenLoading && !amountSum;

  const { data: realTimeData, loading: curveLoading } = use24hCurveData({
    tokenId: _token.id,
    serverId: _token.chain,
    days: activeKey === '24h' ? 1 : 7,
    amount: 1, // Always use 1 for curve shape consistency
  });

  const { data: dateCurveData, loading: timeMachineLoading } = useDateCurveData(
    {
      tokenId: _token.id,
      serverId: _token.chain,
      ready: ready,
    }
  );

  const timeMachMapping = useMemo(() => {
    const result = {} as Record<
      Exclude<TabKey, '24h' | '1W'>,
      ReturnType<typeof formatTokenDateCurve>
    >;
    TIME_TAB_LIST.forEach((e) => {
      if (!isRealTimeKey(e.key) && dateCurveData) {
        result[e.key] = formatTokenDateCurve(
          e.value,
          dateCurveData as any,
          1 // Always use 1 for curve shape consistency
        );
      }
    });
    return result;
  }, [dateCurveData]);

  const data = useMemo(() => {
    if (isRealTimeKey(activeKey)) {
      return realTimeData;
    }
    return timeMachMapping[activeKey as keyof typeof timeMachMapping];
  }, [activeKey, realTimeData, timeMachMapping]);

  // Apply amount multiplier only for display values, not curve shape
  const displayData = useMemo(() => {
    if (!data) return data;
    return {
      ...data,
      list: data.list.map((item) => ({
        ...item,
        value: item.value * amount,
        netWorth: '$' + formatPrice(item.value * amount, 8),
        change:
          '$' +
          formatPrice(
            Math.abs(item.value * amount - data.list[0].value * amount),
            8
          ),
      })),
    };
  }, [data, amount]);

  const curveIsLoading = useMemo(() => {
    if (isRealTimeKey(activeKey)) {
      return curveLoading;
    }
    return timeMachineLoading;
  }, [activeKey, curveLoading, timeMachineLoading]);

  const { percent } = useMemo(() => {
    if (data?.list?.length) {
      const pre = data?.list?.[0]?.value;
      const now = data?.list?.[data?.list?.length - 1]?.value;
      let isLoss = now < pre;
      let currentPercent = '';
      if (activeKey === '24h') {
        isLoss = token?.price_24h_change
          ? Number(token.price_24h_change) < 0
          : false;
        currentPercent =
          Math.abs((token?.price_24h_change || 0) * 100).toFixed(2) + '%';
      } else {
        currentPercent =
          pre === 0
            ? now === 0
              ? '0%'
              : '100%'
            : Math.abs(((now - pre) / pre) * 100).toFixed(2) + '%';
      }
      return {
        percent: currentPercent,
      };
    }
    return {
      percent: '',
    };
  }, [activeKey, data?.list, token?.price_24h_change]);

  const currentInfo = useMemo(() => {
    const price =
      priceType === 'holding' ? token.price * amountSum : token.price;
    const oneDayIsLoss = token.price_24h_change
      ? Number(token.price_24h_change) < 0
      : false;
    return {
      date: dayjs().format(DATE_FORMATTER),
      netWorth: '$' + formatPrice(price || 0, 8),
      isLoss: activeKey === '24h' ? oneDayIsLoss : !!data?.isLoss,
      changePercent: percent,
    };
  }, [
    data?.isLoss,
    percent,
    token?.price,
    amountSum,
    priceType,
    activeKey,
    token?.price_24h_change,
  ]);

  const curveRef = useRef<HTMLDivElement>(null);
  const [curveHoverPoint, setHoverCurvePoint] = useState<
    typeof displayData['list'][number]
  >();

  const sampledDisplayList = useMemo(() => {
    const list = displayData?.list || [];
    const MAX_POINTS = 160;
    if (list.length <= MAX_POINTS) {
      return list;
    }

    const stride = Math.ceil(list.length / MAX_POINTS);
    return list.filter(
      (_, index) => index % stride === 0 || index === list.length - 1
    );
  }, [displayData?.list]);

  const handleHoverCurve = (event, elements) => {
    if (elements.length > 0) {
      const dataIndex = elements[0].index;
      setHoverCurvePoint(sampledDisplayList[dataIndex]);
    } else {
      setHoverCurvePoint(undefined);
    }
  };

  const onSelectActiveKey = useCallback((v: TabKey) => {
    setActiveKey(v);
    if (v !== '24h') {
      setReady(true);
    }
  }, []);

  const isEmpty = !data || !data.list?.length;

  const displayItem = useMemo(() => {
    return curveHoverPoint || currentInfo;
  }, [curveHoverPoint, currentInfo]);

  const divRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    if (!sampledDisplayList.length) return { labels: [], datasets: [] };
    return {
      labels: sampledDisplayList.map((item) =>
        getFormatDate(item.timestamp, activeKey)
      ),
      datasets: [
        {
          label: 'Price',
          data: sampledDisplayList.map((item) => item.value),
          borderColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) {
              return '#50BE3A';
            }
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            );
            gradient.addColorStop(0, '#50BE3A');
            gradient.addColorStop(1, '#B0D966');
            return gradient;
          },
          backgroundColor: '#ffffff',
          borderWidth: 2,
          fill: true,
          tension: 0,
          stepped: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    };
  }, [sampledDisplayList, activeKey]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
        },
      },
      onHover: handleHoverCurve,
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
    };
  }, [handleHoverCurve]);

  return (
    <div className="w-full">
      <div className={clsx('flex items-center gap-6  mb-1.6 mt-3')}>
        <div className="text-[24px] font-medium text-r-neutral-title1">
          {displayItem.netWorth}
        </div>
        <div
          className={clsx(
            'text-[15px] font-medium',
            displayItem?.isLoss ? 'text-r-red-default' : 'text-r-green-default'
          )}
        >
          {unHold || !data?.list.length ? '' : displayItem?.isLoss ? '-' : '+'}
          {displayItem.changePercent}
          {curveHoverPoint
            ? ` (${getFormatDate(curveHoverPoint.timestamp, activeKey)})`
            : ''}
        </div>
      </div>

      {/* ✅ Chart.js Line Chart Implementation */}
      <div className="h-[160px] w-full">
        <CurveWrapper ref={divRef}>
          {curveIsLoading ? (
            <Skeleton.Input
              active
              style={{ width: '100%', height: 160, marginLeft: 16 }}
            />
          ) : isEmpty ? null : (
            <Line data={chartData} options={chartOptions} />
          )}
        </CurveWrapper>
      </div>

      <div className="m-4 mt-1.5">
        <TimeTab activeKey={activeKey} onSelect={onSelectActiveKey} />
      </div>
    </div>
  );
};

function getFormatDate(value: number, activeKey: TabKey) {
  const date = new Date(value);
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (activeKey === '24h' || activeKey === '1W') {
    return `${MM} ${DD}, ${HH}:${mm}`;
  }
  return `${MM} ${DD}, ${YYYY}`;
}
