'use client';

import { useState } from 'react';
import { Plus, X, Activity } from 'lucide-react';
import type { Activity as ActivityType, ActivityType as AType, ActivityOutcome, OpportunityStatus } from '@/types';
import { TYPE_CONFIG, OUTCOME_CONFIG, ALL_TYPES, ALL_OUTCOMES } from './constants';

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

const PROMOTE_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: 'Qualified',   label: 'Đủ điều kiện' },
  { value: 'Proposal',    label: 'Đề xuất' },
  { value: 'Negotiation', label: 'Thương lượng' },
  { value: 'Won',         label: 'Chốt đơn' },
  { value: 'Lost',        label: 'Thất bại' },
];

const EMPTY_FORM = {
  type:                  'call' as AType,
  title:                 '',
  date:                  new Date().toISOString().split('T')[0],
  clientId:              '',
  clientName:            '',
  company:               '',
  opportunityId:         '',
  outcome:               'neutral' as ActivityOutcome,
  nextAction:            '',
  nextActionDate:        '',   // DELTA-3 bước 8: due date thật
  promoteOpportunityTo:  '' as OpportunityStatus | '',
  notes:                 '',
};

export function AddActivityModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: Omit<ActivityType, 'id' | 'createdAt'>) => Promise<void>;
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
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
      type:                 form.type,
      title:                form.title.trim(),
      date:                 form.date,
      clientId:             form.clientId.trim() || `cli-${Date.now()}`,
      clientName:           form.clientName.trim(),
      company:              form.company.trim(),
      opportunityId:        form.opportunityId.trim() || undefined,
      outcome:              form.outcome,
      nextAction:           form.nextAction.trim(),
      nextActionDate:       form.nextActionDate || undefined,         // DELTA-3 bước 8
      promoteOpportunityTo: (form.promoteOpportunityTo as OpportunityStatus) || undefined, // DELTA-3
      notes:                form.notes.trim(),
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
                        color:      active ? c.color : 'var(--color-text-disabled)',
                        border:     active ? `1px solid ${c.color}44` : '1px solid var(--color-border)',
                      }}>
                      <Icon size={11} /> {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Tiêu đề *" error={errors.title}>
              <input className="input-base w-full" placeholder="Mô tả ngắn về hoạt động..."
                value={form.title} onChange={e => set('title', e.target.value)} />
            </Field>

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

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày">
                <input className="input-base w-full" type="date"
                  value={form.date} onChange={e => set('date', e.target.value)} />
              </Field>
              <Field label="Kết quả">
                <select className="select-base w-full" value={form.outcome}
                  onChange={e => set('outcome', e.target.value as ActivityOutcome)}>
                  {ALL_OUTCOMES.map(o => (
                    <option key={o} value={o}>{OUTCOME_CONFIG[o].label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* DELTA-3 bước 8: nextAction + nextActionDate */}
            <Field label="Bước tiếp theo">
              <input className="input-base w-full" placeholder="Cần làm gì sau hoạt động này?"
                value={form.nextAction} onChange={e => set('nextAction', e.target.value)} />
            </Field>

            <Field label="Deadline bước tiếp theo">
              <input className="input-base w-full" type="date"
                value={form.nextActionDate} onChange={e => set('nextActionDate', e.target.value)} />
            </Field>

            {/* DELTA-3 bước 8: promoteOpportunityTo */}
            <Field label="Thăng cấp cơ hội (tuỳ chọn)">
              <select className="select-base w-full" value={form.promoteOpportunityTo}
                onChange={e => set('promoteOpportunityTo', e.target.value)}>
                <option value="">— Không thăng —</option>
                {PROMOTE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Ghi chú chi tiết">
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Diễn biến, thông tin quan trọng, điểm cần lưu ý..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>

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
