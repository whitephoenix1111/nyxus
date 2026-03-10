import { ArrowLeft, Briefcase, Mail, Phone, Globe, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatCurrencyFull } from '@/lib/utils';
import type { ClientWithStats, OpportunityStatus } from '@/types';
import { Avatar, StatusBadge, TagBadge } from './_atoms';
import { viIndustry } from './_constants';

interface DetailPanelProps {
  client: ClientWithStats;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export function DetailPanel({ client, onClose, onDelete, onEdit }: DetailPanelProps) {
  const byStatus = client.opportunities.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md flex flex-col shadow-2xl"
        style={{ background: 'var(--color-neutral-50)', borderLeft: '1px solid var(--color-border)' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-white cursor-pointer"
            style={{ color: 'var(--color-text-subtle)' }}>
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div className="flex items-center gap-3">
            {/* Sửa */}
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand)';
                (e.currentTarget as HTMLElement).style.color = 'var(--color-brand)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
              }}
            >
              <Pencil size={12} /> Sửa
            </button>

            {/* Xóa */}
            <button
              onClick={() => { onDelete(client.id); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#1a0505';
                (e.currentTarget as HTMLElement).style.borderColor = '#ef444466';
                (e.currentTarget as HTMLElement).style.color = '#ef4444';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
              }}
            >
              <Trash2 size={12} /> Xóa
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile section */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-4 mb-4">
              <Avatar initials={client.avatar} size="lg" />
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {client.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Briefcase size={11} style={{ color: 'var(--color-text-faint)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{client.company}</span>
                  <span style={{ color: 'var(--color-text-disabled)' }}>·</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{viIndustry(client.industry)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {client.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <a href={`mailto:${client.email}`}
                className="flex items-center gap-2 text-xs transition-colors hover:text-white"
                style={{ color: 'var(--color-text-muted)' }}>
                <Mail size={12} style={{ color: 'var(--color-text-faint)' }} /> {client.email}
              </a>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Phone size={12} style={{ color: 'var(--color-text-faint)' }} /> {client.phone}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Globe size={12} style={{ color: 'var(--color-text-faint)' }} />
                {client.website} · {client.country}
              </div>
            </div>

            {client.notes && (
              <div className="rounded-xl px-4 py-3 mb-4"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>Ghi chú</p>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{client.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Tổng GT', value: formatCurrency(client.totalValue), color: 'var(--color-text-primary)' },
                { label: 'Cơ hội', value: client.opportunityCount, color: 'var(--color-text-primary)' },
                { label: 'Dự báo', value: formatCurrency(Math.round(client.forecastValue)), color: 'var(--color-brand)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>{label}</p>
                  <p className="text-base font-bold tabular-nums" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          {Object.keys(byStatus).length > 0 && (
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
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
            </div>
          )}

          {/* Opportunities list */}
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
        </div>
      </div>
    </>
  );
}
