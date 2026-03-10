'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Search, X, ChevronRight, ArrowLeft,
  TrendingUp, Briefcase, Mail, Phone,
  Globe, Trash2, Plus, UserPlus
} from 'lucide-react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useClientStore, useClientsWithStats, useClientIndustries } from '@/store/useClientStore';
import { formatCurrencyFull, formatCurrency } from '@/lib/utils';
import type { ClientWithStats, OpportunityStatus, ClientTag, Client } from '@/types';

// ── Constants ─────────────────────────────────────────────────────

const STATUS_STYLE: Record<OpportunityStatus, { bg: string; text: string; border: string }> = {
  Lead:     { bg: 'var(--color-status-lead-bg)',     text: 'var(--color-status-lead-text)',     border: 'var(--color-status-lead-border)'     },
  Proposal: { bg: 'var(--color-status-proposal-bg)', text: 'var(--color-status-proposal-text)', border: 'var(--color-status-proposal-border)' },
  Forecast: { bg: 'var(--color-status-forecast-bg)', text: 'var(--color-status-forecast-text)', border: 'var(--color-status-forecast-border)' },
  Order:    { bg: 'var(--color-status-order-bg)',    text: 'var(--color-status-order-text)',    border: 'var(--color-status-order-border)'    },
};

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  Lead: 'Tiềm năng', Proposal: 'Đề xuất', Forecast: 'Dự báo', Order: 'Đơn hàng',
};

const TAG_STYLE: Record<ClientTag, { bg: string; text: string }> = {
  enterprise:   { bg: '#1a0a2e', text: '#b388ff' },
  'mid-market': { bg: '#0d1b2a', text: '#5ba3f5' },
  priority:     { bg: 'var(--color-brand-muted)', text: 'var(--color-brand)' },
  warm:         { bg: '#1a0f00', text: '#f5a742' },
  cold:         { bg: 'var(--color-surface-hover)', text: 'var(--color-text-muted)' },
  'new-lead':   { bg: '#001a0f', text: '#42f5a7' },
};

const ALL_TAGS: ClientTag[] = ['enterprise', 'mid-market', 'priority', 'warm', 'cold', 'new-lead'];

const INDUSTRIES = [
  'Consulting', 'Defense', 'Design', 'Finance', 'Investment',
  'Logistics', 'Manufacturing', 'Marketing', 'Media',
  'Retail', 'SaaS', 'Technology', 'Venture Capital',
];

const INDUSTRY_VI: Record<string, string> = {
  'Consulting': 'Tư vấn', 'Defense': 'Quốc phòng', 'Design': 'Thiết kế',
  'Finance': 'Tài chính', 'Investment': 'Đầu tư', 'Logistics': 'Vận tải & Logistics',
  'Manufacturing': 'Sản xuất', 'Marketing': 'Marketing', 'Media': 'Truyền thông',
  'Retail': 'Bán lẻ', 'SaaS': 'Phần mềm (SaaS)', 'Technology': 'Công nghệ',
  'Venture Capital': 'Quỹ đầu tư mạo hiểm',
};

function viIndustry(ind: string): string { return INDUSTRY_VI[ind] ?? ind; }

// ── Helpers ───────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────

function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }[size];
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold ${cls}`}
      style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
      {(initials || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: OpportunityStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function TagBadge({ tag }: { tag: ClientTag }) {
  const s = TAG_STYLE[tag];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.text }}>
      {tag}
    </span>
  );
}

// ── Add Client Modal ──────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', company: '', email: '', phone: '',
  industry: 'Technology', country: '', website: '', notes: '',
  tags: [] as ClientTag[],
};

function AddClientModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({});

  const preview = form.name ? getInitials(form.name) : '?';

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function toggleTag(tag: ClientTag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim())    e.name    = 'Bắt buộc';
    if (!form.company.trim()) e.company = 'Bắt buộc';
    if (!form.email.trim())   e.email   = 'Bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      industry: form.industry,
      country: form.country.trim(),
      website: form.website.trim(),
      notes: form.notes.trim(),
      tags: form.tags,
      avatar: getInitials(form.name),
    });
    setSaving(false);
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
                <UserPlus size={14} style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Thêm khách hàng mới
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  Điền thông tin bên dưới
                </p>
              </div>
            </div>
            <button onClick={onClose} className="transition-colors hover:text-white"
              style={{ color: 'var(--color-text-disabled)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Preview avatar */}
            <div className="flex items-center gap-3 py-1">
              <Avatar initials={preview} size="lg" />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {form.name || <span style={{ color: 'var(--color-text-disabled)' }}>Tên khách hàng</span>}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {form.company || 'Tên công ty'}
                </p>
              </div>
            </div>

            {/* Row: Tên + Công ty */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên đầy đủ *" error={errors.name}>
                <input className="input-base w-full" placeholder="Nguyễn Văn A"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </Field>
              <Field label="Công ty *" error={errors.company}>
                <input className="input-base w-full" placeholder="Acme Corp"
                  value={form.company} onChange={e => set('company', e.target.value)} />
              </Field>
            </div>

            {/* Row: Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email *" error={errors.email}>
                <input className="input-base w-full" placeholder="name@company.com" type="email"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </Field>
              <Field label="Số điện thoại">
                <input className="input-base w-full" placeholder="+84 90 123 4567"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </Field>
            </div>

            {/* Row: Industry + Country */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngành">
                <select className="select-base w-full"
                  value={form.industry} onChange={e => set('industry', e.target.value)}>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{viIndustry(ind)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quốc gia">
                <input className="input-base w-full" placeholder="Vietnam"
                  value={form.country} onChange={e => set('country', e.target.value)} />
              </Field>
            </div>

            {/* Website */}
            <Field label="Website">
              <input className="input-base w-full" placeholder="company.com"
                value={form.website} onChange={e => set('website', e.target.value)} />
            </Field>

            {/* Tags */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-2"
                style={{ color: 'var(--color-text-faint)' }}>
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => {
                  const s = TAG_STYLE[tag];
                  const active = form.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all"
                      style={{
                        background: active ? s.bg : 'var(--color-surface)',
                        color: active ? s.text : 'var(--color-text-disabled)',
                        border: active
                          ? `1px solid ${s.text}44`
                          : '1px solid var(--color-border)',
                        opacity: active ? 1 : 0.7,
                      }}>
                      {active && <span className="mr-1">✓</span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <Field label="Ghi chú">
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Ghi chú nội bộ về khách hàng này..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60"
            >
              {saving ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <Plus size={13} />
              )}
              {saving ? 'Đang lưu...' : 'Thêm khách hàng'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest"
        style={{ color: error ? 'var(--color-danger)' : 'var(--color-text-faint)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>
      )}
    </div>
  );
}

// ── Client Card ───────────────────────────────────────────────────

function ClientCard({ client, onClick }: { client: ClientWithStats; onClick: () => void }) {
  const orderCount = client.opportunities.filter((o) => o.status === 'Order').length;

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

// ── Detail Panel ──────────────────────────────────────────────────

function DetailPanel({ client, onClose, onDelete }: {
  client: ClientWithStats;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const byStatus = client.opportunities.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md flex flex-col shadow-2xl"
        style={{ background: 'var(--color-neutral-50)', borderLeft: '1px solid var(--color-border)' }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-white"
            style={{ color: 'var(--color-text-subtle)' }}>
            <ArrowLeft size={13} /> Quay lại
          </button>
          <button onClick={() => { onDelete(client.id); onClose(); }}
            className="flex items-center gap-1 text-xs transition-colors hover:text-red-500"
            style={{ color: 'var(--color-text-disabled)' }}>
            <Trash2 size={12} /> Xóa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
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

          {client.opportunities.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
                Tất cả cơ hội
              </p>
              <div className="flex flex-col gap-2">
                {client.opportunities.sort((a, b) => b.value - a.value).map(opp => (
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
          )}

          {client.opportunities.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>Chưa có cơ hội nào.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function ClientsPage() {
  const { opportunities, fetchOpportunities } = useOpportunityStore();
  const { clients, isLoading, fetchClients, deleteClient, addClient } = useClientStore();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const industries = useClientIndustries();
  const clientsWithStats = useClientsWithStats(opportunities);

  useEffect(() => {
    fetchClients();
    fetchOpportunities();
  }, [fetchClients, fetchOpportunities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = clientsWithStats;
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      viIndustry(c.industry).toLowerCase().includes(q)
    );
    if (industryFilter) list = list.filter(c => c.industry === industryFilter);
    return [...list].sort((a, b) => b.totalValue - a.totalValue);
  }, [clientsWithStats, search, industryFilter]);

  const totalRevenue = useMemo(() => clientsWithStats.reduce((s, c) => s + c.totalValue, 0), [clientsWithStats]);
  const totalOpps    = useMemo(() => clientsWithStats.reduce((s, c) => s + c.opportunityCount, 0), [clientsWithStats]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] px-6 py-5 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Khách hàng
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
            {clients.length} khách hàng · {totalOpps} cơ hội
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pipeline chip */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <TrendingUp size={13} style={{ color: 'var(--color-brand)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Tổng pipeline</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(totalRevenue)}
            </span>
          </div>

          {/* Nút thêm mới */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2"
          >
            <Plus size={13} />
            Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-faint)' }} />
          <input className="input-base w-full pl-8 pr-8"
            placeholder="Tìm theo tên, công ty..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
              style={{ color: 'var(--color-text-faint)' }}>
              <X size={12} />
            </button>
          )}
        </div>

        <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="select-base">
          <option value="">Tất cả ngành</option>
          {industries.map(ind => <option key={ind} value={ind}>{viIndustry(ind)}</option>)}
        </select>

        {(search || industryFilter) && (
          <button onClick={() => { setSearch(''); setIndustryFilter(''); }}
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: 'var(--color-text-subtle)' }}>
            <X size={11} /> Xóa filter
          </button>
        )}

        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {filtered.length} kết quả
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2"
              style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>
              Không tìm thấy khách hàng nào.
            </p>
            {(search || industryFilter) ? (
              <button onClick={() => { setSearch(''); setIndustryFilter(''); }}
                className="text-xs hover:underline" style={{ color: 'var(--color-brand)' }}>
                Xóa bộ lọc
              </button>
            ) : (
              <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
                <Plus size={12} /> Thêm khách hàng đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4 pb-4">
            {filtered.map(client => (
              <ClientCard key={client.id} client={client} onClick={() => setSelectedClient(client)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedClient && (
        <DetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onDelete={id => { deleteClient(id); setSelectedClient(null); }}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSave={addClient}
        />
      )}
    </div>
  );
}
