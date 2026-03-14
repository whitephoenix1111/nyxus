'use client';

import { ArrowUpRight } from 'lucide-react';
import { formatCurrencyFull, getInitials } from '@/lib/utils';
import type { Client, Opportunity } from '@/types';

interface ClientCardProps {
  opportunity: Opportunity;
  client?: Client;
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-700',
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-green-700',
  'from-amber-500 to-orange-700',
  'from-rose-500 to-red-700',
  'from-teal-500 to-cyan-700',
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ClientCard({ opportunity, client }: ClientCardProps) {
  const name     = client?.name    ?? '—';
  const company  = client?.company ?? '—';
  const gradient = colorForName(name);

  return (
    <div className="rounded-2xl bg-[#111] p-4 hover:bg-[#161616] transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-white`}>
          {client?.avatar ?? getInitials(name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">{name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{company}</p>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-base font-bold text-white tabular-nums">
            {formatCurrencyFull(opportunity.value)}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Tổng giá trị</p>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1a1a] hover:bg-[#DFFF00] hover:text-black transition-all"
          style={{ color: 'var(--color-text-muted)' }}>
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}
