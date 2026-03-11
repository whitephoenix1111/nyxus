import { Clock, AlertTriangle, Check, X, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { formatCurrencyFull } from '@/lib/utils';
import type { Opportunity } from '@/types';

export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function StaleTag({ days }: { days: number }) {
  if (days <= 3) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-xs text-[#22C55E]">
      <Clock size={10} />Mới
    </span>
  );
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1400] px-2 py-0.5 text-xs text-[#F5C842]">
      <Clock size={10} />{days}n
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#1A0000] px-2 py-0.5 text-xs text-[#EF4444]">
      <AlertTriangle size={10} />{days}n
    </span>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-[#888]">
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function LostCard({ opp, onReopen }: {
  opp: Opportunity;
  onReopen: (id: string) => void;
}) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-[#1a1a1a] bg-[#111] p-4 opacity-60 hover:opacity-100 hover:border-[#2a2a2a] transition-all">
      {/* Top row */}
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

      {/* Value */}
      <div className="flex items-end justify-between">
        <p className="text-lg font-bold text-[#555] tabular-nums line-through">{formatCurrencyFull(opp.value)}</p>
        <button onClick={() => onReopen(opp.id)}
          className="flex items-center gap-1.5 rounded-lg border border-[#DFFF0030] px-2.5 py-1 text-xs font-medium text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors">
          <RotateCcw size={10} /> Mở lại
        </button>
      </div>

      {/* Notes */}
      {opp.notes && (
        <p className="text-xs text-[#444] line-clamp-2 border-t border-[#1a1a1a] pt-2">{opp.notes}</p>
      )}

    </div>
  );
}

export function LeadCard({ opp, deleteConfirm, onPromote, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: {
  opp: Opportunity;
  deleteConfirm: string | null;
  onPromote: (opp: Opportunity) => void;
  onEdit: (opp: Opportunity) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const days = daysSince(opp.lastContactDate);

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-[#1a1a1a] bg-[#111] p-4 hover:border-[#2a2a2a] transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar initials={opp.avatar} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{opp.clientName}</p>
            <p className="text-xs text-[#555] truncate">{opp.company}</p>
          </div>
        </div>
        <span className="group-hover:opacity-0 transition-opacity"><StaleTag days={days} /></span>
      </div>

      {/* Value + confidence */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-white tabular-nums">{formatCurrencyFull(opp.value)}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="h-1 w-16 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${opp.confidence}%`,
                background: opp.confidence >= 50 ? '#DFFF00' : '#555',
              }} />
            </div>
            <span className="text-xs text-[#555] tabular-nums">{opp.confidence}%</span>
          </div>
        </div>
        <button onClick={() => onPromote(opp)}
          className="rounded-lg border border-[#DFFF0030] px-2.5 py-1 text-xs font-medium text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors">
          Thăng ↑
        </button>
      </div>

      {/* Notes */}
      {opp.notes && (
        <p className="text-xs text-[#555] line-clamp-2 border-t border-[#1a1a1a] pt-2">{opp.notes}</p>
      )}

      {/* Actions */}
      <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => onEdit(opp)}
          className="rounded-lg p-1.5 text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors">
          <Pencil size={12} />
        </button>
        {deleteConfirm === opp.id ? (
          <>
            <button onClick={() => onDeleteConfirm(opp.id)}
              className="rounded-lg p-1.5 text-[#EF4444] hover:bg-[#EF444415] transition-colors">
              <Check size={12} />
            </button>
            <button onClick={onDeleteCancel}
              className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] transition-colors">
              <X size={12} />
            </button>
          </>
        ) : (
          <button onClick={() => onDeleteRequest(opp.id)}
            className="rounded-lg p-1.5 text-[#555] hover:text-[#EF4444] hover:bg-[#EF444415] transition-colors">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
