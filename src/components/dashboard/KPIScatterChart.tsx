'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { MONTH_LABELS, STATUS_COLORS, formatCurrencyFull } from '@/lib/utils';
import type { OpportunityStatus } from '@/types';

interface DataPoint {
  month: number;
  value: number;
  status: OpportunityStatus;
  clientName: string;
}

interface KPIScatterChartProps {
  data: DataPoint[];
  averageValue: number;
}

function CustomDot(props: { cx?: number; cy?: number; payload?: DataPoint }) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const color = STATUS_COLORS[payload.status] ?? '#555';
  const isOrder = payload.status === 'Order';
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isOrder ? 5 : 3.5}
      fill={color}
      style={isOrder ? { filter: 'drop-shadow(0 0 6px #DFFF00aa)' } : undefined}
      opacity={0.85}
    />
  );
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DataPoint;

  const STATUS_VI: Record<OpportunityStatus, string> = {
    Lead: 'Tiềm năng',
    Proposal: 'Đề xuất',
    Forecast: 'Dự báo',
    Order: 'Đơn hàng',
  };

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white">{d.clientName}</p>
      <p className="text-[#DFFF00]">{formatCurrencyFull(d.value)}</p>
      <p className="text-[#555]">{STATUS_VI[d.status]} · {MONTH_LABELS[d.month]}</p>
    </div>
  );
}

export default function KPIScatterChart({ data, averageValue }: KPIScatterChartProps) {
  const xTicks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1a1a1a" strokeDasharray="0" vertical={false} />
          <XAxis
            type="number"
            dataKey="month"
            domain={[-0.5, 11.5]}
            ticks={xTicks}
            tickFormatter={(v) => MONTH_LABELS[v as number] ?? ''}
            tick={{ fill: '#555', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="value"
            domain={[0, 320000]}
            ticks={[0, 50000, 100000, 150000, 200000, 250000, 300000]}
            tickFormatter={(v) => `${v / 1000}k`}
            tick={{ fill: '#555', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <ReferenceLine
            y={averageValue}
            stroke="#DFFF00"
            strokeOpacity={0.5}
            strokeWidth={1}
            strokeDasharray="6 4"
          />
          <Scatter
            data={data}
            shape={(props: unknown) => <CustomDot {...(props as { cx?: number; cy?: number; payload?: DataPoint })} />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
