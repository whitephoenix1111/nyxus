import { RotateCcw } from 'lucide-react';
import { formatCurrencyFull } from '@/lib/utils';
import type { Opportunity } from '@/types';

interface LostCardProps {
  opp: Opportunity;
  onReopen: (id: string) => void;
}

export function LostCard({ opp, onReopen }: LostCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-[#1a1a1a] bg-[#111] p-4 opacity-60 hover:opacity-100 hover:border-[#2a2a2a] transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-[#555]">
            {opp.avatar.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#888] truncate">{opp.clientName}</p>
            <p className="text-xs text-[#444] truncate">{opp.company}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#1A0000] px-2 py-0.5 text-xs text-[#EF4444]">
          Thất bại
        </span>
      </div>
      <div className="flex items-end justify-between mt-3">
        <p className="text-lg font-bold text-[#555] tabular-nums line-through">
          {formatCurrencyFull(opp.value)}
        </p>
        <button
          onClick={() => onReopen(opp.id)}
          className="flex items-center gap-1.5 rounded-lg border border-[#DFFF0030] px-2.5 py-1 text-xs font-medium text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors"
        >
          <RotateCcw size={10} /> Mở lại
        </button>
      </div>
      {opp.notes && (
        <p className="text-xs text-[#444] line-clamp-2 border-t border-[#1a1a1a] pt-2 mt-3">
          {opp.notes}
        </p>
      )}
    </div>
  );
}
