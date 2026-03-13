import { formatCurrency, formatCurrencyFull } from '@/lib/utils';
import type { ClientWithStats, OpportunityStatus } from '@/types';
import { StatusBadge } from './_atoms';

interface DetailPanelOppsProps {
  client: ClientWithStats;
}

export function DetailPanelOpps({ client }: DetailPanelOppsProps) {
  const byStatus = client.opportunities.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Stats row */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Tổng GT',  value: formatCurrency(client.totalValue),                    color: 'var(--color-text-primary)' },
            { label: 'Cơ hội',   value: client.opportunityCount,                              color: 'var(--color-text-primary)' },
            { label: 'Dự báo',   value: formatCurrency(Math.round(client.forecastValue)),      color: 'var(--color-brand)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl px-3 py-2.5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>{label}</p>
              <p className="text-base font-bold tabular-nums" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        {Object.keys(byStatus).length > 0 && (
          <>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
              Phân bổ trạng thái
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(byStatus) as OpportunityStatus[]).map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <StatusBadge status={s} />
                  <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>×{byStatus[s]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Opportunity list */}
      {client.opportunities.length > 0 ? (
        <div className="px-6 py-4">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
            Tất cả cơ hội
          </p>
          <div className="flex flex-col gap-2">
            {[...client.opportunities].sort((a, b) => b.value - a.value).map(opp => (
              <div key={opp.id} className="rounded-xl px-4 py-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{opp.clientName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
                      {new Date(opp.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={opp.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tabular-nums font-mono" style={{ color: 'var(--color-text-primary)' }}>
                    {formatCurrencyFull(opp.value)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${opp.confidence}%`,
                        background: opp.confidence >= 75 ? 'var(--color-brand)'
                          : opp.confidence >= 40 ? 'var(--color-status-forecast-text)'
                          : 'var(--color-text-disabled)',
                      }} />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-subtle)' }}>{opp.confidence}%</span>
                  </div>
                </div>
                {opp.notes && (
                  <p className="mt-2 text-xs line-clamp-2" style={{ color: 'var(--color-text-subtle)' }}>{opp.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>Chưa có cơ hội nào.</p>
        </div>
      )}
    </>
  );
}
