import type { OpportunityStatus } from '@/types';
import { STATUS_CONFIG, fmt } from './constants';

export function KpiCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${accent ? 'card-brand' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: accent ? '#00000088' : 'var(--color-text-muted)' }}>
          {label}
        </span>
        <Icon size={16} style={{ color: accent ? '#00000066' : 'var(--color-text-muted)' }} />
      </div>
      <span className="text-3xl font-bold tracking-tight"
        style={{ color: accent ? '#000000' : 'var(--color-text-primary)' }}>
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: accent ? '#00000066' : 'var(--color-text-muted)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function FunnelBar({ status, count, total, value, weighted }: {
  status: OpportunityStatus; count: number; total: number; value: number; weighted: number;
}) {
  const cfg = STATUS_CONFIG[status];
  const widthPct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: cfg.bar }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{count} cơ hội</span>
        </div>
        <div className="flex gap-6 text-right">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{fmt(value)}</span>
          <span className="text-sm font-semibold" style={{ color: cfg.bar }}>{fmt(weighted)}</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${widthPct}%`, background: cfg.bar }} />
      </div>
    </div>
  );
}

export function OppRow({ clientName, company, avatar, value, confidence, status, date }: {
  clientName: string; company: string; avatar: string;
  value: number; confidence: number; status: OpportunityStatus; date: string;
}) {
  const cfg = STATUS_CONFIG[status];
  const weighted = value * (confidence / 100);
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
      style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          {clientName}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{company}</p>
      </div>
      <span className={`badge badge-${status.toLowerCase()} flex-shrink-0`}>{cfg.label}</span>
      <div className="flex items-center gap-2 w-24 flex-shrink-0">
        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
          <div className="h-full rounded-full" style={{ width: `${confidence}%`, background: cfg.bar }} />
        </div>
        <span className="text-xs w-8 text-right" style={{ color: 'var(--color-text-muted)' }}>{confidence}%</span>
      </div>
      <span className="text-sm w-20 text-right flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {fmt(value)}
      </span>
      <span className="text-sm font-semibold w-20 text-right flex-shrink-0" style={{ color: cfg.bar }}>
        {fmt(weighted)}
      </span>
      <span className="text-xs w-20 text-right flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
        {new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}
      </span>
    </div>
  );
}

export function ConfidenceTiers({ opportunities }: { opportunities: Array<{ confidence: number; value: number }> }) {
  const tiers = [
    { label: 'Cao (≥ 75%)',    color: '#DFFF00', filter: (c: number) => c >= 75 },
    { label: 'Trung (40–74%)', color: '#F5C842', filter: (c: number) => c >= 40 && c < 75 },
    { label: 'Thấp (< 40%)',   color: '#EF4444', filter: (c: number) => c < 40 },
  ];
  return (
    <div className="card p-5 flex flex-col gap-3">
      <h2 style={{ color: 'var(--color-text-muted)' }}>Phân Tầng Độ Tin Cậy</h2>
      {tiers.map(({ label, color, filter }) => {
        const group    = opportunities.filter(o => filter(o.confidence));
        const groupVal = group.reduce((s, o) => s + o.value * (o.confidence / 100), 0);
        return (
          <div key={label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{group.length} deal</span>
              <span className="text-sm font-semibold" style={{ color }}>{fmt(groupVal)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
