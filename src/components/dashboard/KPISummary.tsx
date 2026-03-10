'use client';

import { formatCurrencyFull } from '@/lib/utils';

interface KPISummaryProps {
  totalSales: number;
  openQuotes: number;
  opportunities: number;
}

function MiniTrend({ value, color = '#DFFF00' }: { value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <svg width="40" height="16" viewBox="0 0 40 16">
        <polyline
          points="0,12 10,8 20,10 30,4 40,6"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-medium" style={{ color }}>{value}</span>
    </div>
  );
}

export default function KPISummary({ totalSales, openQuotes, opportunities }: KPISummaryProps) {
  return (
    <div className="flex flex-col gap-9 pl-4 border-l border-[#1a1a1a] min-w-[160px]">
      <div>
        <p className="text-2xl font-bold text-[#DFFF00] tabular-nums">
          {formatCurrencyFull(totalSales)}
        </p>
        <p className="text-xs text-[#555] mt-0.5">Tổng doanh thu</p>
        <MiniTrend value="+1.2%" />
      </div>

      <div>
        <p className="text-2xl font-bold text-white tabular-nums">
          {openQuotes.toLocaleString()}
        </p>
        <p className="text-xs text-[#555] mt-0.5">Báo giá mở</p>
        <MiniTrend value="+0.6%" color="#888" />
      </div>

      <div>
        <p className="text-2xl font-bold text-white tabular-nums">
          {opportunities}
        </p>
        <p className="text-xs text-[#555] mt-0.5">Cơ hội</p>
        <MiniTrend value="+3.0%" color="#888" />
      </div>
    </div>
  );
}
