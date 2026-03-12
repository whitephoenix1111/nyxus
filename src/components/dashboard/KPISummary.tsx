'use client';

import { formatCurrencyFull } from '@/lib/utils';

interface KPISummaryProps {
  totalSales: number;
  openQuotes: number;
  opportunities: number;
}

export default function KPISummary({ totalSales, openQuotes, opportunities }: KPISummaryProps) {
  return (
    <div className="flex flex-col gap-9 pl-4 border-l border-[#1a1a1a] min-w-[160px]">
      <div>
        <p className="text-2xl font-bold text-[#DFFF00] tabular-nums">
          {formatCurrencyFull(totalSales)}
        </p>
        <p className="text-xs text-[#555] mt-0.5">Tổng doanh thu</p>
      </div>

      <div>
        <p className="text-2xl font-bold text-white tabular-nums">
          {openQuotes.toLocaleString()}
        </p>
        <p className="text-xs text-[#555] mt-0.5">Báo giá mở</p>
      </div>

      <div>
        <p className="text-2xl font-bold text-white tabular-nums">
          {opportunities}
        </p>
        <p className="text-xs text-[#555] mt-0.5">Cơ hội</p>
      </div>
    </div>
  );
}
