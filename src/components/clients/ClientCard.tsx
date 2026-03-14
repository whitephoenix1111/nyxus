import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ClientWithStats } from '@/types';
import { Avatar } from './_atoms';
import { TagBadge } from '@/components/ui/TagBadge';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { useIsManager } from '@/store/useAuthStore';
import { MANUAL_TAGS } from './_constants';

interface ClientCardProps {
  client: ClientWithStats;
  onClick: () => void;
  archived?: boolean;
}

export function ClientCard({ client, onClick, archived = false }: ClientCardProps) {
  const isManager = useIsManager();
  const orderCount = client.opportunities.filter(o => o.status === 'Won').length;

  const lastContact = client.opportunities
    .map(o => o.lastContactDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  const lastContactLabel = lastContact
    ? new Date(lastContact).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  return (
    <button onClick={onClick}
      className="group w-full rounded-2xl p-4 text-left transition-all"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        opacity: archived ? 0.5 : 1,
        filter: archived ? 'grayscale(0.4)' : 'none',
      }}
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
          {client.tags.slice(0, 3).map(tag => (
            <TagBadge
              key={tag}
              tag={tag}
              isComputed={!MANUAL_TAGS.includes(tag)}
            />
          ))}
        </div>
      )}

      <div className="h-px mb-3" style={{ background: 'var(--color-border)' }} />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-faint)' }}>
            Tổng doanh thu
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(client.totalValue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-faint)' }}>
            Số đơn
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {orderCount}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Liên hệ cuối</span>
        <div className="flex items-center gap-2">
          {isManager && <OwnerBadge ownerId={client.ownerId} />}
          <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>{lastContactLabel}</span>
        </div>
      </div>
    </button>
  );
}
