import { Clock, AlertTriangle, Check, X, Pencil, Trash2, UserRound, CheckCircle2 } from 'lucide-react';
import { formatCurrencyFull } from '@/lib/utils';
import type { ClientTag, Opportunity } from '@/types';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { TagBadge } from '@/components/ui/TagBadge';
import { useIsManager } from '@/store/useAuthStore';
import { MANUAL_TAGS } from '@/components/clients/_constants';

export { LostCard } from './LostCard';

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

export function LeadCard({
  opp,
  deleteConfirm,
  hasPendingTask,
  canEdit = true,
  computedTags,
  onPromote,
  onEdit,
  onAssign,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  opp: Opportunity;
  deleteConfirm: string | null;
  hasPendingTask: boolean;
  canEdit?: boolean;
  computedTags?: ClientTag[];
  onPromote?: (opp: Opportunity) => void;
  onEdit?: (opp: Opportunity) => void;
  onAssign?: (opp: Opportunity) => void;
  onDeleteRequest?: (id: string) => void;
  onDeleteConfirm?: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const isManager = useIsManager();
  const days = daysSince(opp.lastContactDate);
  const tags = computedTags ?? [];

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[#1a1a1a] bg-[#111] p-4 hover:border-[#2a2a2a] transition-all">

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar initials={opp.avatar} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{opp.clientName}</p>
            <p className="text-xs text-[#555] truncate">{opp.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 group-hover:opacity-0 transition-opacity shrink-0">
          {isManager && <OwnerBadge ownerId={opp.ownerId} />}
          <StaleTag days={days} />
        </div>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1 mt-3 h-[46px] overflow-hidden content-start">
        {tags.slice(0, 4).map(tag => (
          <TagBadge key={tag} tag={tag} isComputed={!MANUAL_TAGS.includes(tag)} />
        ))}
      </div>

      {/* Value + confidence */}
      <div className="flex items-end justify-between mt-3">
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
        {canEdit && onPromote && (
          <button onClick={() => onPromote(opp)}
            className="rounded-lg border border-[#DFFF0030] px-2.5 py-1 text-xs font-medium text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors">
            Thăng ↑
          </button>
        )}
      </div>

      {opp.notes && (
        <p className="text-xs text-[#555] line-clamp-2 border-t border-[#1a1a1a] pt-2 mt-3">{opp.notes}</p>
      )}

      {/* Task status */}
      <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mt-3 border ${
        hasPendingTask ? 'border-[#0d2d14] bg-[#071a0c]' : 'border-[#2a1500] bg-[#1a0e00]'
      }`}>
        {hasPendingTask ? (
          <>
            <CheckCircle2 size={10} className="text-[#22C55E] shrink-0" />
            <span className="text-xs text-[#22C55E]">Đã có task đang chờ</span>
          </>
        ) : (
          <>
            <AlertTriangle size={10} className="text-[#F5A623] shrink-0" />
            <span className="text-xs text-[#F5A623]">Chưa có task nào đang chờ</span>
          </>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onAssign && (
          <button onClick={() => onAssign(opp)}
            className="rounded-lg p-1.5 text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors"
            title="Assign cho sales khác">
            <UserRound size={12} />
          </button>
        )}
        {canEdit && (
          <>
            {onEdit && (
              <button onClick={() => onEdit(opp)}
                className="rounded-lg p-1.5 text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors">
                <Pencil size={12} />
              </button>
            )}
            {deleteConfirm === opp.id ? (
              <>
                {onDeleteConfirm && (
                  <button onClick={() => onDeleteConfirm(opp.id)}
                    className="rounded-lg p-1.5 text-[#EF4444] hover:bg-[#EF444415] transition-colors">
                    <Check size={12} />
                  </button>
                )}
                <button onClick={onDeleteCancel}
                  className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] transition-colors">
                  <X size={12} />
                </button>
              </>
            ) : (
              onDeleteRequest && (
                <button onClick={() => onDeleteRequest(opp.id)}
                  className="rounded-lg p-1.5 text-[#555] hover:text-[#EF4444] hover:bg-[#EF444415] transition-colors">
                  <Trash2 size={12} />
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
