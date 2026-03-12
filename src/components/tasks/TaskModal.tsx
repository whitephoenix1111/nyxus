'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Plus, CheckSquare, Search, ChevronDown } from 'lucide-react';
import type { Task } from '@/types';
import { useClientStore } from '@/store/useClientStore';
import { useOpportunityStore } from '@/store/useOpportunityStore';

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

function ClientCombobox({ value, onChange, error }: {
  value: string;
  onChange: (id: string, name: string, company: string) => void;
  error?: string;
}) {
  const clients      = useClientStore(s => s.clients);
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);
  const selected         = clients.find(c => c.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clients.slice(0, 10);
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [clients, query]);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(o => !o); setQuery(''); }}
        className="input-base w-full flex items-center justify-between gap-2 text-left"
        style={{ color: selected ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
                 borderColor: error ? 'var(--color-danger)' : undefined }}>
        <span className="truncate text-sm">
          {selected ? `${selected.name} — ${selected.company}` : 'Chọn khách hàng...'}
        </span>
        <ChevronDown size={13} style={{ flexShrink: 0, color: 'var(--color-text-faint)' }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-hidden"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Search size={12} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <input autoFocus className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
              placeholder="Tìm tên hoặc công ty..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0
              ? <p className="px-3 py-3 text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>Không tìm thấy</p>
              : filtered.map(c => (
                <button key={c.id} type="button"
                  onClick={() => { onChange(c.id, c.name, c.company); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{ background: c.id === value ? 'var(--color-brand-muted)' : undefined }}>
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-brand)' }}>
                    {c.avatar || c.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-faint)' }}>{c.company}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────

const EMPTY: Omit<Task, 'id' | 'createdAt'> = {
  title:        '',
  clientId:     '',
  clientName:   '',
  company:      '',
  opportunityId: undefined,
  dueDate:      '',
  status:       'pending',
  assignedTo:   '',
  notes:        '',
};

export function TaskModal({ onClose, onSave }: {
  onClose: () => void;
  onSave:  (data: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
}) {
  const opportunities = useOpportunityStore(s => s.opportunities);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const clientOpps = useMemo(() =>
    form.clientId
      ? opportunities.filter(o => o.clientId === form.clientId && o.status !== 'Won' && o.status !== 'Lost')
      : [],
    [opportunities, form.clientId]
  );

  function setField(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.title.trim())    e.title    = 'Bắt buộc';
    if (!form.clientId.trim()) e.clientId = 'Vui lòng chọn khách hàng';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      ...form,
      title:         form.title.trim(),
      opportunityId: form.opportunityId || undefined,
      dueDate:       form.dueDate || undefined,
      assignedTo:    form.assignedTo?.trim() || undefined,
      notes:         form.notes?.trim() || undefined,
    });
    setSaving(false);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
                <CheckSquare size={14} style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Thêm task mới</h2>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Tạo việc cần làm thủ công</p>
              </div>
            </div>
            <button onClick={onClose} className="transition-colors hover:text-white"
              style={{ color: 'var(--color-text-disabled)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <Field label="Tiêu đề *" error={errors.title}>
              <input className="input-base w-full" placeholder="Việc cần làm..."
                value={form.title} onChange={e => setField('title', e.target.value)} />
            </Field>

            <Field label="Khách hàng *" error={errors.clientId}>
              <ClientCombobox
                value={form.clientId}
                error={errors.clientId}
                onChange={(id, name, company) => {
                  setForm(f => ({ ...f, clientId: id, clientName: name, company, opportunityId: undefined }));
                  if (errors.clientId) setErrors(e => ({ ...e, clientId: '' }));
                }}
              />
            </Field>

            {form.clientId && (
              <Field label="Cơ hội (tuỳ chọn)">
                <select className="select-base w-full"
                  value={form.opportunityId ?? ''}
                  onChange={e => setField('opportunityId', e.target.value)}>
                  <option value="">— Không gắn —</option>
                  {clientOpps.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.status} · {o.value.toLocaleString('vi-VN')}đ
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Deadline">
                <input className="input-base w-full" type="date"
                  value={form.dueDate ?? ''} onChange={e => setField('dueDate', e.target.value)} />
              </Field>
              <Field label="Giao cho">
                <input className="input-base w-full" placeholder="Tên người..."
                  value={form.assignedTo ?? ''} onChange={e => setField('assignedTo', e.target.value)} />
              </Field>
            </div>

            <Field label="Ghi chú">
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Thông tin bổ sung..."
                value={form.notes ?? ''} onChange={e => setField('notes', e.target.value)} />
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
              {saving ? 'Đang lưu...' : 'Tạo task'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
