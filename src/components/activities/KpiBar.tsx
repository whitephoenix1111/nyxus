import type { Activity as ActivityType, ActivityType as AType, ActivityOutcome } from '@/types';
import { useActivitiesByOutcome } from '@/store/useActivityStore';
import { OUTCOME_CONFIG, ALL_OUTCOMES } from './constants';

export function KpiBar({ activities }: { activities: ActivityType[] }) {
  const byOutcome = useActivitiesByOutcome();
  const total     = activities.length;
  const winRate   = total > 0 ? Math.round((byOutcome.positive / total) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      <div className="rounded-2xl px-4 py-3"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>
          Tổng hoạt động
        </p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{total}</p>
      </div>

      <div className="rounded-2xl px-4 py-3"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>
          Tỷ lệ tích cực
        </p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-brand)' }}>{winRate}%</p>
      </div>

      <div className="rounded-2xl px-4 py-3 col-span-2"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
          Theo kết quả
        </p>
        <div className="flex items-center gap-3">
          {ALL_OUTCOMES.map(o => {
            const cfg = OUTCOME_CONFIG[o];
            const Icon = cfg.icon;
            return (
              <div key={o} className="flex items-center gap-1.5">
                <Icon size={12} style={{ color: cfg.color }} />
                <span className="text-sm font-bold tabular-nums" style={{ color: cfg.color }}>{byOutcome[o]}</span>
                <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'var(--color-border)' }}>
          {total > 0 && ALL_OUTCOMES.map(o => (
            <div key={o} style={{ width: `${(byOutcome[o] / total) * 100}%`, background: OUTCOME_CONFIG[o].color }} />
          ))}
        </div>
      </div>
    </div>
  );
}
