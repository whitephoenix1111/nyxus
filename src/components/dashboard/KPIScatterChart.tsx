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

// ── Custom Dot ─────────────────────────────────────────────────
function CustomDot(props: { cx?: number; cy?: number; payload?: DataPoint }) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const color = STATUS_COLORS[payload.status] ?? '#555';
  const isOrder = payload.status === 'Won';
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

// ── Custom Tooltip ─────────────────────────────────────────────
interface RechartsTooltipPayload {
  payload: DataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: RechartsTooltipPayload[];
}

const STATUS_VI: Record<OpportunityStatus, string> = {
  Lead: 'Tiềm năng',
  Qualified: 'Đủ điều kiện',
  Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng',
  Won: 'Chốt đơn',
  Lost: 'Thất bại',
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        {d.clientName}
      </p>
      <p className="text-[#DFFF00]" style={{ fontFamily: 'var(--font-mono)' }}>
        {formatCurrencyFull(d.value)}
      </p>
      <p className="text-[#555]" style={{ fontFamily: 'var(--font-body)' }}>
        {STATUS_VI[d.status]} · {MONTH_LABELS[d.month]}
      </p>
    </div>
  );
}

function renderTooltip(props: unknown) {
  const p = props as { active?: boolean; payload?: unknown };
  return (
    <CustomTooltip
      active={p.active}
      payload={p.payload as unknown as RechartsTooltipPayload[]}
    />
  );
}

// Làm tròn lên bội số gần nhất của `step`
function ceilTo(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

// Tính domain + ticks Y-axis động từ data
function buildYAxis(data: DataPoint[]): { domain: [number, number]; ticks: number[] } {
  if (data.length === 0) {
    return { domain: [0, 100_000], ticks: [0, 25_000, 50_000, 75_000, 100_000] };
  }
  const maxVal  = Math.max(...data.map((d) => d.value));
  const step    = maxVal > 500_000 ? 100_000 : maxVal > 200_000 ? 50_000 : maxVal > 50_000 ? 25_000 : 10_000;
  const ceiling = ceilTo(maxVal * 1.15, step); // 15% headroom
  const ticks: number[] = [];
  for (let v = 0; v <= ceiling; v += step) ticks.push(v);
  return { domain: [0, ceiling], ticks };
}

// ── Chart ──────────────────────────────────────────────────────
export default function KPIScatterChart({ data, averageValue }: KPIScatterChartProps) {
  const xTicks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const { domain, ticks } = buildYAxis(data);

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
            domain={domain}
            ticks={ticks}
            tickFormatter={(v) => {
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
              return `${v}`;
            }}
            tick={{ fill: '#555', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={renderTooltip} cursor={false} />
          <ReferenceLine
            y={averageValue}
            stroke="#DFFF00"
            strokeOpacity={0.5}
            strokeWidth={1}
            strokeDasharray="6 4"
          />
          <Scatter
            data={data}
            shape={(props: unknown) => (
              <CustomDot {...(props as { cx?: number; cy?: number; payload?: DataPoint })} />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
