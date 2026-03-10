import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ClientWithStats } from '@/types';
import { Avatar, StatusBadge, TagBadge } from './_atoms';

interface ClientCardProps {
  client: ClientWithStats;
  onClick: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const orderCount = client.opportunities.filter(o => o.status === 'Order').length;

  return (
    <button onClick={onClick}
      className="group w-full rounded-2xl p-4 text-left transition-all"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-alt)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar initials={client.avatar} />
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {client.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
              {client.company}
            </p>
          </div>
        </div>
        <ChevronRight size={14} className="mt-1 transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--color-text-disabled)' }} />
      </div>

      {client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {client.tags.slice(0, 3).map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}

      <div className="h-px mb-3" style={{ background: 'var(--color-border)' }} />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-faint)' }}>
            Tổng giá trị
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(client.totalValue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-faint)' }}>
            Cơ hội
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {client.opportunityCount}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        {client.topStatus ? <StatusBadge status={client.topStatus} /> : <span />}
        {orderCount > 0 && (
          <span className="text-xs tabular-nums" style={{ color: 'var(--color-brand)' }}>
            {orderCount} đơn hàng
          </span>
        )}
        {orderCount === 0 && client.forecastValue > 0 && (
          <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>
            ~{formatCurrency(Math.round(client.forecastValue))} dự báo
          </span>
        )}
      </div>
    </button>
  );
}
