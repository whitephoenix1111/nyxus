import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortKey, SortDir } from './constants';

export function StatusBadge({ status, labels, styles }: {
  status: string;
  labels: Record<string, string>;
  styles: Record<string, { bg: string; text: string; border: string }>;
}) {
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {labels[status]}
    </span>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-[#888]">
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function SortIcon({ col, sortKey, sortDir }: {
  col: SortKey; sortKey: SortKey; sortDir: SortDir;
}) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-[#333]" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-[#DFFF00]" />
    : <ChevronDown size={12} className="text-[#DFFF00]" />;
}
