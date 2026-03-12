'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, X, Activity, ChevronDown, Search, CheckSquare, CalendarClock, User } from 'lucide-react';
import type { Activity as ActivityType, ActivityType as AType, ActivityOutcome } from '@/types';
import { useClientStore } from '@/store/useClientStore';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useTaskStore } from '@/store/useTaskStore';
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

// ── Client Combobox ───────────────────────────────────────────────

interface ClientComboboxProps {
  value: string;
  onChange: (clientId: string, clientName: string, company: string) => void;
  error?: string;
}

function ClientCombobox({ value, onChange, error }: ClientComboboxProps) {
  const clients  = useClientStore(s => s.clients);
  const [query,   setQuery]   = useState('');
  const [open,    setOpen]    = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  const selected = clients.find(c => c.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clients.slice(0, 10);
    return clients
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [clients, query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(''); }}
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
          <div className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Search size={12} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
              placeholder="Tìm tên hoặc công ty..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
                Không tìm thấy khách hàng
              </p>
            ) : filtered.map(c => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c.id, c.name, c.company); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                style={{ background: c.id === value ? 'var(--color-brand-muted)' : undefined }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-brand)' }}>
                  {c.avatar || c.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {c.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-faint)' }}>
                    {c.company}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  type:           'call' as AType,
  title:          '',
  date:           new Date().toISOString().split('T')[0],
  clientId:       '',
  clientName:     '',
  company:        '',
  opportunityId:  '',
  outcome:        'neutral' as ActivityOutcome,
  nextAction:     '',
  nextActionDate: '',
  notes:          '',
};

const EMPTY_TASK = {
  title:      '',
  dueDate:    '',
  assignedTo: '',
};

// ── Main Modal ────────────────────────────────────────────────────

export function AddActivityModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: Omit<ActivityType, 'id' | 'createdAt'>) => Promise<ActivityType | null>;
}) {
  const opportunities        = useOpportunityStore(s => s.opportunities);
  const { addTask }          = useTaskStore();

  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState<Partial<Record<string, string>>>({});

  // Step 2 state
  const [step,        setStep]        = useState<1 | 2>(1);
  const [savedActId,  setSavedActId]  = useState('');      // activityId để set createdFrom
  const [taskForm,    setTaskForm]    = useState(EMPTY_TASK);
  const [taskSaving,  setTaskSaving]  = useState(false);
  const [taskError,   setTaskError]   = useState('');

  const clientOpps = useMemo(() =>
    form.clientId
      ? opportunities.filter(o => o.clientId === form.clientId && o.status !== 'Won' && o.status !== 'Lost')
      : [],
    [opportunities, form.clientId]
  );

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function handleClientChange(clientId: string, clientName: string, company: string) {
    setForm(f => ({ ...f, clientId, clientName, company, opportunityId: '' }));
    if (errors.clientId) setErrors(e => ({ ...e, clientId: '' }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.title.trim())    e.title    = 'Bắt buộc';
    if (!form.clientId.trim()) e.clientId = 'Vui lòng chọn khách hàng';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Step 1: Submit activity ──
  async function handleSubmitActivity() {
    if (!validate()) return;
    setSaving(true);

    const saved = await onSave({
      type:           form.type,
      title:          form.title.trim(),
      date:           form.date,
      clientId:       form.clientId,
      clientName:     form.clientName,
      company:        form.company,
      opportunityId:  form.opportunityId || undefined,
      outcome:        form.outcome,
      nextAction:     form.nextAction.trim(),
      nextActionDate: form.nextActionDate || undefined,
      notes:          form.notes.trim(),
    });

    setSaving(false);

    if (!saved) return; // lỗi, ở lại step 1

    // Nếu có nextAction → bước sang step 2
    if (form.nextAction.trim()) {
      setSavedActId(saved.id);
      setTaskForm({
        title:      form.nextAction.trim(),
        dueDate:    form.nextActionDate,
        assignedTo: '',
      });
      setStep(2);
    } else {
      onClose();
    }
  }

  // ── Step 2: Tạo task và đóng ──
  async function handleCreateTask() {
    if (!taskForm.title.trim()) { setTaskError('Tiêu đề task không được để trống'); return; }
    setTaskSaving(true);
    await addTask({
      title:         taskForm.title.trim(),
      clientId:      form.clientId,
      clientName:    form.clientName,
      company:       form.company,
      opportunityId: form.opportunityId || undefined,
      dueDate:       taskForm.dueDate || undefined,
      status:        'pending',
      assignedTo:    taskForm.assignedTo.trim() || undefined,
      createdFrom:   savedActId,
    });
    setTaskSaving(false);
    onClose();
  }

  const isStep2 = step === 2;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]"
        onClick={isStep2 ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}>

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: isStep2 ? 'rgba(34,197,94,0.12)' : 'var(--color-brand-muted)',
                  border: `1px solid ${isStep2 ? 'rgba(34,197,94,0.3)' : 'var(--color-brand-border)'}`,
                }}>
                {isStep2
                  ? <CheckSquare size={14} style={{ color: '#22C55E' }} />
                  : <Activity    size={14} style={{ color: 'var(--color-brand)' }} />}
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {isStep2 ? 'Xác nhận task follow-up' : 'Thêm hoạt động mới'}
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {isStep2
                    ? 'Bước 2 / 2 — Kiểm tra và tạo task'
                    : 'Ghi lại tương tác với khách hàng'}
                </p>
              </div>
            </div>
            {!isStep2 && (
              <button onClick={onClose} className="transition-colors hover:text-white"
                style={{ color: 'var(--color-text-disabled)' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* ── Body: Step 1 ── */}
          {!isStep2 && (
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
                      <button key={t} onClick={() => setField('type', t)}
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
                  value={form.title} onChange={e => setField('title', e.target.value)} />
              </Field>

              <Field label="Khách hàng *" error={errors.clientId}>
                <ClientCombobox
                  value={form.clientId}
                  onChange={handleClientChange}
                  error={errors.clientId}
                />
              </Field>

              {form.clientId && (
                <Field label="Cơ hội (tuỳ chọn)">
                  <select className="select-base w-full"
                    value={form.opportunityId}
                    onChange={e => setField('opportunityId', e.target.value)}>
                    <option value="">— Không gắn cơ hội —</option>
                    {clientOpps.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.status} · {o.value.toLocaleString('vi-VN')}đ{o.notes ? ` · ${o.notes.slice(0, 30)}` : ''}
                      </option>
                    ))}
                  </select>
                  {clientOpps.length === 0 && (
                    <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Không có cơ hội đang mở cho khách hàng này
                    </p>
                  )}
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Ngày">
                  <input className="input-base w-full" type="date"
                    value={form.date} onChange={e => setField('date', e.target.value)} />
                </Field>
                <Field label="Kết quả">
                  <select className="select-base w-full" value={form.outcome}
                    onChange={e => setField('outcome', e.target.value as ActivityOutcome)}>
                    {ALL_OUTCOMES.map(o => (
                      <option key={o} value={o}>{OUTCOME_CONFIG[o].label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Bước tiếp theo">
                <input className="input-base w-full" placeholder="Cần làm gì sau hoạt động này?"
                  value={form.nextAction} onChange={e => setField('nextAction', e.target.value)} />
              </Field>

              {form.nextAction.trim() && (
                <>
                  <Field label="Deadline bước tiếp theo">
                    <input className="input-base w-full" type="date"
                      value={form.nextActionDate} onChange={e => setField('nextActionDate', e.target.value)} />
                  </Field>
                  <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                    style={{ background: 'var(--color-brand-muted)', border: '1px solid var(--color-brand-border)' }}>
                    <CheckSquare size={12} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Sau khi lưu, bạn sẽ được xác nhận task follow-up.
                    </p>
                  </div>
                </>
              )}

              <Field label="Ghi chú chi tiết">
                <textarea className="input-base w-full resize-none" rows={3}
                  placeholder="Diễn biến, thông tin quan trọng, điểm cần lưu ý..."
                  value={form.notes} onChange={e => setField('notes', e.target.value)} />
              </Field>

            </div>
          )}

          {/* ── Body: Step 2 ── */}
          {isStep2 && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Banner */}
              <div className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <CheckSquare size={15} style={{ color: '#22C55E', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#22C55E' }}>
                    Hoạt động đã lưu thành công
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                    Xác nhận hoặc chỉnh thông tin task follow-up bên dưới.
                  </p>
                </div>
              </div>

              {/* Task title */}
              <Field label="Nội dung task *" error={taskError}>
                <input
                  className="input-base w-full"
                  placeholder="Mô tả việc cần làm..."
                  value={taskForm.title}
                  autoFocus
                  onChange={e => {
                    setTaskForm(f => ({ ...f, title: e.target.value }));
                    if (taskError) setTaskError('');
                  }}
                />
              </Field>

              {/* Due date */}
              <Field label="Ngày đến hạn">
                <div className="relative">
                  <CalendarClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-faint)' }} />
                  <input
                    className="input-base w-full pl-8"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
              </Field>

              {/* Assigned to */}
              <Field label="Giao cho">
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-faint)' }} />
                  <input
                    className="input-base w-full pl-8"
                    placeholder="Tên người thực hiện..."
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))}
                  />
                </div>
              </Field>

            </div>
          )}

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}>

            {!isStep2 ? (
              <>
                <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Hủy</button>
                <button onClick={handleSubmitActivity} disabled={saving}
                  className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
                  {saving
                    ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    : <Plus size={13} />}
                  {saving ? 'Đang lưu...' : 'Thêm hoạt động'}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose}
                  className="btn-ghost text-sm px-4 py-2">
                  Bỏ qua
                </button>
                <button onClick={handleCreateTask} disabled={taskSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
                  style={{ background: '#22C55E', color: '#000' }}>
                  {taskSaving
                    ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    : <CheckSquare size={13} />}
                  {taskSaving ? 'Đang tạo...' : 'Tạo task & đóng'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
