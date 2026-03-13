import type { OpportunityStatus } from '@/types';
import { STATUS_STYLE, STATUS_LABELS } from './_constants';
export { TagBadge } from '@/components/ui/TagBadge';

export function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }[size];
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold ${cls}`}
      style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
      {(initials || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest"
        style={{ color: error ? 'var(--color-danger)' : 'var(--color-text-faint)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}
