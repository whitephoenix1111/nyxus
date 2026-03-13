import { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, Mail, Phone, Globe, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import type { ClientWithStats } from '@/types';
import { Avatar, TagBadge } from './_atoms';
import { viIndustry } from './_constants';
import { useDocumentStore, useDocumentsForClient } from '@/store/useDocumentStore';
import { DetailPanelOpps } from './DetailPanelOpps';
import { DetailPanelDocs } from './DetailPanelDocs';

interface DetailPanelProps {
  client: ClientWithStats;
  canEdit?: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
}

type PanelTab = 'opps' | 'docs';

export function DetailPanel({ client, canEdit = false, onClose, onDelete, onEdit }: DetailPanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab,   setActiveTab]   = useState<PanelTab>('opps');

  const { fetchDocuments } = useDocumentStore();
  const clientDocs = useDocumentsForClient(client.id);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const openOpps = client.opportunities.filter(o => o.status !== 'Won' && o.status !== 'Lost');

  function handleDeleteClick() {
    if (!onDelete) return;
    if (openOpps.length > 0) setShowConfirm(true);
    else { onDelete(client.id); onClose(); }
  }

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
            {canEdit && onEdit && (
              <button onClick={onEdit}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-brand)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'; }}>
                <Pencil size={12} /> Sửa
              </button>
            )}
            {canEdit && onDelete && (
              <button onClick={handleDeleteClick}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a0505'; (e.currentTarget as HTMLElement).style.borderColor = '#ef444466'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'; }}>
                <Trash2 size={12} /> Xóa
              </button>
            )}
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
          </div>

          {/* Tab bar */}
          <div className="flex px-6 pt-4 gap-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {([
              { key: 'opps', label: 'Cơ hội',   count: client.opportunities.length },
              { key: 'docs', label: 'Tài liệu', count: clientDocs.length },
            ] as { key: PanelTab; label: string; count: number }[]).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-lg transition-colors"
                style={{
                  color:        activeTab === tab.key ? 'var(--color-brand)'          : 'var(--color-text-subtle)',
                  borderBottom: activeTab === tab.key ? '2px solid var(--color-brand)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}>
                {tab.label}
                <span className="px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{
                    fontSize:   '10px',
                    background: activeTab === tab.key ? 'var(--color-brand-subtle, #DFFF0022)' : 'var(--color-surface)',
                    color:      activeTab === tab.key ? 'var(--color-brand)'                   : 'var(--color-text-faint)',
                  }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'opps' && <DetailPanelOpps client={client} />}
          {activeTab === 'docs' && (
            <DetailPanelDocs
              clientId={client.id}
              clientName={client.name}
              company={client.company}
            />
          )}
        </div>
      </div>

      {/* Confirm soft-delete */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-[2px]" onClick={() => setShowConfirm(false)} />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6"
              style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: '#1a0505', border: '1px solid #ef444433' }}>
                  <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Xác nhận lưu trữ</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{client.name}</p>
                </div>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Khách hàng này có <span className="font-semibold" style={{ color: '#ef4444' }}>{openOpps.length} cơ hội đang mở</span>.
              </p>
              <p className="text-xs mb-5" style={{ color: 'var(--color-text-subtle)' }}>
                Các cơ hội chưa đóng sẽ bị xóa. Dữ liệu lịch sử (activities, deals đã Won) vẫn được giữ lại.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowConfirm(false)} className="btn-ghost text-xs px-4 py-2">Hủy</button>
                <button
                  onClick={() => { setShowConfirm(false); onDelete!(client.id); onClose(); }}
                  className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef444444' }}>
                  Lưu trữ khách hàng
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
