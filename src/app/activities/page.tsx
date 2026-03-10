'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Phone, Mail, Users, Monitor, FileText,
  Plus, Search, X, Trash2, ChevronDown,
  TrendingUp, TrendingDown, Minus, Activity,
  Calendar, ArrowRight, Clock
} from 'lucide-react';
import { useActivityStore, useActivitiesByType, useActivitiesByOutcome } from '@/store/useActivityStore';
import type { Activity as ActivityType, ActivityType as AType, ActivityOutcome } from '@/types';

// ── Constants ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  call:    { label: 'Cuộc gọi',  icon: Phone,    color: '#5BA3F5', bg: '#0D1B2A' },
  email:   { label: 'Email',     icon: Mail,     color: '#F5C842', bg: '#1A1400' },
  meeting: { label: 'Họp mặt',   icon: Users,    color: '#b388ff', bg: '#1a0a2e' },
  demo:    { label: 'Demo',      icon: Monitor,  color: '#DFFF00', bg: '#1a1f00' },
  note:    { label: 'Ghi chú',   icon: FileText, color: '#888',    bg: '#1a1a1a' },
};

const OUTCOME_CONFIG: Record<ActivityOutcome, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  positive: { label: 'Tích cực', icon: TrendingUp,   color: '#22C55E', bg: '#052E16', border: '#14532d' },
  neutral:  { label: 'Trung lập', icon: Minus,        color: '#888',    bg: '#1a1a1a', border: '#333'    },
  negative: { label: 'Tiêu cực', icon: TrendingDown, color: '#EF4444', bg: '#1C0505', border: '#7f1d1d' },
};

const ALL_TYPES: AType[] = ['call', 'email', 'meeting', 'demo', 'note'];
const ALL_OUTCOMES: ActivityOutcome[] = ['positive', 'neutral', 'negative'];

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function relativeDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  if (diff < 30)  return `${diff} ngày trước`;
  if (diff < 365) return `${Math.floor(diff / 30)} tháng trước`;
  return `${Math.floor(diff / 365)} năm trước`;
}

function groupByDate(acts: ActivityType[]): { label: string; items: ActivityType[] }[] {
  const map = new Map<string, ActivityType[]>();
  acts.forEach(a => {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });
  return Array.from(map.entries()).map(([key, items]) => {
    const [year, month] = key.split('-');
    const label = new Date(+year, +month - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    return { label, items };
  });
}

// ── Sub-components ────────────────────────────────────────────────

function TypeBadge({ type }: { type: AType }) {
  const c = TYPE_CONFIG[type];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.color }}>
      <Icon size={10} />
      {c.label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: ActivityOutcome }) {
  const c = OUTCOME_CONFIG[outcome];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <Icon size={10} />
      {c.label}
    </span>
  );
}

// ── Activity Card ─────────────────────────────────────────────────

function ActivityCard({ activity, onDelete }: {
  activity: ActivityType;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[activity.type];
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl transition-all"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

      {/* Main row */}
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
          style={{ background: cfg.bg, color: cfg.color }}>
          <Icon size={15} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {activity.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <OutcomeBadge outcome={activity.outcome} />
              <button
                onClick={() => setExpanded(e => !e)}
                className="rounded-lg p-1 transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-disabled)' }}>
                <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <TypeBadge type={activity.type} />
            <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
              {activity.clientName}
            </span>
            <span style={{ color: 'var(--color-text-disabled)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              {activity.company}
            </span>
            <span style={{ color: 'var(--color-text-disabled)' }}>·</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
              <Calendar size={10} />
              {formatDate(activity.date)}
              <span className="ml-0.5" style={{ color: 'var(--color-text-disabled)' }}>
                ({relativeDate(activity.date)})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3"
          style={{ borderTop: '1px solid var(--color-border)' }}>

          {activity.notes && (
            <div className="pt-3">
              <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-faint)' }}>
                Ghi chú
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                {activity.notes}
              </p>
            </div>
          )}

          {activity.nextAction && (
            <div className="flex items-start gap-2 rounded-xl p-3"
              style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
              <ArrowRight size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--color-brand)' }} />
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-brand)' }}>
                  Bước tiếp theo
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                  {activity.nextAction}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {activity.opportunityId && (
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-disabled)' }}>
                #{activity.opportunityId}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
                <Clock size={10} className="inline mr-1" />
                Tạo {formatDate(activity.createdAt)}
              </span>
              <button
                onClick={() => onDelete(activity.id)}
                className="flex items-center gap-1 text-xs transition-colors hover:text-red-400"
                style={{ color: 'var(--color-text-disabled)' }}>
                <Trash2 size={11} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Bar ───────────────────────────────────────────────────────

function KpiBar({ activities }: { activities: ActivityType[] }) {
  const byType    = useActivitiesByType();
  const byOutcome = useActivitiesByOutcome();
  const total     = activities.length;
  const winRate   = total > 0 ? Math.round((byOutcome.positive / total) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {/* Total */}
      <div className="rounded-2xl px-4 py-3"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>
          Tổng hoạt động
        </p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
          {total}
        </p>
      </div>

      {/* Win rate */}
      <div className="rounded-2xl px-4 py-3"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-faint)' }}>
          Tỷ lệ tích cực
        </p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-brand)' }}>
          {winRate}%
        </p>
      </div>

      {/* By outcome */}
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
                <span className="text-sm font-bold tabular-nums" style={{ color: cfg.color }}>
                  {byOutcome[o]}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="flex h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'var(--color-border)' }}>
          {total > 0 && ALL_OUTCOMES.map(o => {
            const cfg = OUTCOME_CONFIG[o];
            return (
              <div key={o} style={{ width: `${(byOutcome[o] / total) * 100}%`, background: cfg.color }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Add Activity Modal ────────────────────────────────────────────

const EMPTY_FORM = {
  type: 'call' as AType,
  title: '',
  date: new Date().toISOString().split('T')[0],
  clientId: '',
  clientName: '',
  company: '',
  opportunityId: '',
  outcome: 'neutral' as ActivityOutcome,
  nextAction: '',
  notes: '',
};

function AddActivityModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: Omit<ActivityType, 'id' | 'createdAt'>) => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.title.trim())      e.title      = 'Bắt buộc';
    if (!form.clientName.trim()) e.clientName = 'Bắt buộc';
    if (!form.company.trim())    e.company    = 'Bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      type: form.type,
      title: form.title.trim(),
      date: form.date,
      clientId: form.clientId.trim() || `cli-${Date.now()}`,
      clientName: form.clientName.trim(),
      company: form.company.trim(),
      opportunityId: form.opportunityId.trim() || undefined,
      outcome: form.outcome,
      nextAction: form.nextAction.trim(),
      notes: form.notes.trim(),
    });
    setSaving(false);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
                <Activity size={14} style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Thêm hoạt động mới
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  Ghi lại tương tác với khách hàng
                </p>
              </div>
            </div>
            <button onClick={onClose} className="transition-colors hover:text-white"
              style={{ color: 'var(--color-text-disabled)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Type selector */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
                Loại hoạt động
              </p>
              <div className="flex gap-2 flex-wrap">
                {ALL_TYPES.map(t => {
                  const c = TYPE_CONFIG[t];
                  const Icon = c.icon;
                  const active = form.type === t;
                  return (
                    <button key={t} onClick={() => set('type', t)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        background: active ? c.bg : 'var(--color-surface)',
                        color: active ? c.color : 'var(--color-text-disabled)',
                        border: active ? `1px solid ${c.color}44` : '1px solid var(--color-border)',
                      }}>
                      <Icon size={11} /> {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <Field label="Tiêu đề *" error={errors.title}>
              <input className="input-base w-full" placeholder="Mô tả ngắn về hoạt động..."
                value={form.title} onChange={e => set('title', e.target.value)} />
            </Field>

            {/* Client + Company */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên khách hàng *" error={errors.clientName}>
                <input className="input-base w-full" placeholder="Nguyễn Văn A"
                  value={form.clientName} onChange={e => set('clientName', e.target.value)} />
              </Field>
              <Field label="Công ty *" error={errors.company}>
                <input className="input-base w-full" placeholder="Acme Corp"
                  value={form.company} onChange={e => set('company', e.target.value)} />
              </Field>
            </div>

            {/* Date + Outcome */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày">
                <input className="input-base w-full" type="date"
                  value={form.date} onChange={e => set('date', e.target.value)} />
              </Field>
              <Field label="Kết quả">
                <select className="select-base w-full"
                  value={form.outcome} onChange={e => set('outcome', e.target.value as ActivityOutcome)}>
                  {ALL_OUTCOMES.map(o => (
                    <option key={o} value={o}>{OUTCOME_CONFIG[o].label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Next action */}
            <Field label="Bước tiếp theo">
              <input className="input-base w-full" placeholder="Cần làm gì sau hoạt động này?"
                value={form.nextAction} onChange={e => set('nextAction', e.target.value)} />
            </Field>

            {/* Notes */}
            <Field label="Ghi chú chi tiết">
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Diễn biến, thông tin quan trọng, điểm cần lưu ý..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>

            {/* Opportunity ID (optional) */}
            <Field label="Mã cơ hội (tuỳ chọn)">
              <input className="input-base w-full font-mono text-xs" placeholder="opp-001"
                value={form.opportunityId} onChange={e => set('opportunityId', e.target.value)} />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Hủy</button>
            <button onClick={handleSubmit} disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
              {saving
                ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                : <Plus size={13} />}
              {saving ? 'Đang lưu...' : 'Thêm hoạt động'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
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

// ── Main Page ─────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const { activities, isLoading, fetchActivities, deleteActivity, addActivity } = useActivityStore();
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState<AType | ''>('');
  const [outcomeFilter, setOutcomeFilter] = useState<ActivityOutcome | ''>('');
  const [showModal, setShowModal]     = useState(false);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const filtered = useMemo(() => {
    let list = activities;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.clientName.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q)
    );
    if (typeFilter)    list = list.filter(a => a.type === typeFilter);
    if (outcomeFilter) list = list.filter(a => a.outcome === outcomeFilter);
    return list;
  }, [activities, search, typeFilter, outcomeFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const hasFilter = !!(search || typeFilter || outcomeFilter);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] px-6 py-5 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Hoạt động
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
            {activities.length} hoạt động · theo dõi mọi tương tác với khách hàng
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
          <Plus size={13} /> Thêm hoạt động
        </button>
      </div>

      {/* KPI bar */}
      {!isLoading && <KpiBar activities={activities} />}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-faint)' }} />
          <input className="input-base w-full pl-8 pr-8"
            placeholder="Tìm theo tiêu đề, khách hàng..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-white"
              style={{ color: 'var(--color-text-faint)' }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type filter */}
        <select className="select-base" value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as AType | '')}>
          <option value="">Tất cả loại</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
        </select>

        {/* Outcome filter */}
        <select className="select-base" value={outcomeFilter}
          onChange={e => setOutcomeFilter(e.target.value as ActivityOutcome | '')}>
          <option value="">Tất cả kết quả</option>
          {ALL_OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_CONFIG[o].label}</option>)}
        </select>

        {hasFilter && (
          <button onClick={() => { setSearch(''); setTypeFilter(''); setOutcomeFilter(''); }}
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: 'var(--color-text-subtle)' }}>
            <X size={11} /> Xóa filter
          </button>
        )}

        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {filtered.length} kết quả
        </span>
      </div>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2"
              style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>
              {hasFilter ? 'Không tìm thấy hoạt động nào.' : 'Chưa có hoạt động nào.'}
            </p>
            {hasFilter ? (
              <button onClick={() => { setSearch(''); setTypeFilter(''); setOutcomeFilter(''); }}
                className="text-xs hover:underline" style={{ color: 'var(--color-brand)' }}>
                Xóa bộ lọc
              </button>
            ) : (
              <button onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
                <Plus size={12} /> Thêm hoạt động đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                {/* Month label */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs uppercase tracking-widest font-semibold"
                    style={{ color: 'var(--color-text-faint)' }}>
                    {label}
                  </p>
                  <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text-disabled)' }}>
                    {items.length}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.map(activity => (
                    <ActivityCard key={activity.id} activity={activity} onDelete={deleteActivity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AddActivityModal
          onClose={() => setShowModal(false)}
          onSave={addActivity}
        />
      )}
    </div>
  );
}
