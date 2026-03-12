'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { formatCurrencyFull } from '@/lib/utils';
import type { OpportunityStatus } from '@/types';

const STATUS_HREF: Record<OpportunityStatus, string> = {
  Lead:        '/opportunities',
  Qualified:   '/opportunities',
  Proposal:    '/opportunities',
  Negotiation: '/opportunities',
  Won:         '/clients',
  Lost:        '/opportunities',
};

interface StatCardProps {
  status: OpportunityStatus;
  count: number;
  totalValue: number;
  isActive?: boolean;
}

const STATUS_ICONS: Record<OpportunityStatus, string> = {
  Lead: '◱',
  Qualified: '◎',
  Proposal: '⊞',
  Negotiation: '⇄',
  Won: '⬡',
  Lost: '×',
};

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  Lead: 'Tiềm năng',
  Qualified: 'Đủ điều kiện',
  Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng',
  Won: 'Chốt đơn',
  Lost: 'Thất bại',
};

export default function StatCard({ status, count, totalValue, isActive }: StatCardProps) {
  const isLead = status === 'Lead';
  const router = useRouter();
  const href   = STATUS_HREF[status];

  return (
    <div
      onClick={() => router.push(href)}
      className={`relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-[#DFFF00] text-black hover:brightness-110'
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
        <span className={`rounded-md p-1 ${isActive ? 'text-black/60' : 'text-[#555]'}`}>
          <ArrowUpRight size={14} />
        </span>
      </div>

      {/* Count */}
      <div className="mt-3">
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold tracking-tight ${isActive ? 'text-black' : 'text-white'}`}>
            {isLead ? count : formatCurrencyFull(totalValue).replace('$', '')}
          </span>
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
