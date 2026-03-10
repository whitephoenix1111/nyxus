'use client';

import { ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { formatCurrencyFull } from '@/lib/utils';
import type { OpportunityStatus } from '@/types';

interface StatCardProps {
  status: OpportunityStatus;
  count: number;
  totalValue: number;
  delta?: number;
  isActive?: boolean;
}

const STATUS_ICONS: Record<OpportunityStatus, string> = {
  Lead: '◱',
  Proposal: '⊞',
  Forecast: '⤴',
  Order: '⬡',
};

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  Lead: 'Cơ hội',
  Proposal: 'Đề xuất',
  Forecast: 'Dự báo',
  Order: 'Đơn hàng',
};

export default function StatCard({ status, count, totalValue, delta, isActive }: StatCardProps) {
  const isLead = status === 'Lead';

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 ${
        isActive
          ? 'bg-[#DFFF00] text-black'
          : 'bg-[#111] text-white hover:bg-[#161616]'
      }`}
      style={{ minHeight: '130px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-sm font-medium ${isActive ? 'text-black/70' : 'text-[#888]'}`}>
          <span className="text-base">{STATUS_ICONS[status]}</span>
          <span>{STATUS_LABELS[status]}</span>
        </div>
        <button className={`rounded-md p-1 transition-colors ${isActive ? 'hover:bg-black/10' : 'hover:bg-white/5'}`}>
          <ArrowUpRight size={14} className={isActive ? 'text-black/60' : 'text-[#555]'} />
        </button>
      </div>

      {/* Count */}
      <div className="mt-3">
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold tracking-tight ${isActive ? 'text-black' : 'text-white'}`}>
            {isLead ? count : formatCurrencyFull(totalValue).replace('$', '')}
          </span>
          {delta !== undefined && (
            <span className={`mb-1 text-sm font-semibold ${isActive ? 'text-black/60' : 'text-[#DFFF00]'}`}>
              +{delta}
            </span>
          )}
        </div>
        {!isLead && (
          <p className={`mt-0.5 text-xs ${isActive ? 'text-black/50' : 'text-[#555]'}`}>
            {count} giao dịch
          </p>
        )}
      </div>

      <button className={`absolute bottom-4 right-4 ${isActive ? 'text-black/40' : 'text-[#333]'}`}>
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}
