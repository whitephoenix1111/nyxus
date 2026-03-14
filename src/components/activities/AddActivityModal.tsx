// src/components/activities/AddActivityModal.tsx — Modal log activity (2 bước)
//
// Flow:
//   Bước 1: User điền form activity → submit → POST /api/activities
//   Bước 2 (chỉ khi nextAction được điền): Confirm tạo task follow-up
//           → nếu xác nhận: POST /api/tasks với createdFrom = savedActId
//           → nếu bỏ qua: đóng modal mà không tạo task
//
// showAssignedTo: false khi caller là salesperson — ẩn field "Giao cho" ở step 2.
// API tự inject assignedTo = session.id cho salesperson (POST /api/tasks).
'use client';

import { useState, useMemo } from 'react';
import { Plus, X, Activity, CheckSquare } from 'lucide-react';
import type { Activity as ActivityType, ActivityType as AType, ActivityOutcome } from '@/types';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useTaskStore } from '@/store/useTaskStore';
import { TYPE_CONFIG, OUTCOME_CONFIG, ALL_TYPES, ALL_OUTCOMES } from './constants';
import { ClientCombobox } from '@/components/ui/ClientCombobox';
import { ActivityTaskStep } from './ActivityTaskStep';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs uppercase tracking-widest"
        style={{ color: error ? 'var(--color-danger)' : 'var(--color-text-faint)' }}
      >
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

const EMPTY_FORM = {
  type:           'call' as AType,
  title:          '',
  date:           new Date().toISOString().split('T')[0],
  clientId:       '',
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

export function AddActivityModal({ onClose, onSave, allowedClientIds, showAssignedTo = true }: {
  onClose: () => void;
  onSave: (data: Omit<ActivityType, 'id' | 'createdAt'>) => Promise<ActivityType | null>;
  /** Set<clientId> của salesperson → giới hạn ClientCombobox. undefined = Manager. */
  allowedClientIds?: Set<string>;
  /**
   * false khi caller là salesperson — ẩn field "Giao cho" ở step 2.
   * Manager (default true) thấy dropdown chọn salesperson.
   * Cùng logic với TaskModal.showAssignedTo.
   */
  showAssignedTo?: boolean;
}) {
  const opportunities = useOpportunityStore(s => s.opportunities);
  const { addTask }   = useTaskStore();

  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState<Partial<Record<string, string>>>({});
  const [step,       setStep]       = useState<1 | 2>(1);
  const [savedActId, setSavedActId] = useState('');
  const [taskForm,   setTaskForm]   = useState(EMPTY_TASK);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError,  setTaskError]  = useState('');

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

  function handleClientChange(clientId: string, _clientName: string, _company: string) {
    setForm(f => ({ ...f, clientId, opportunityId: '' }));
    if (errors.clientId) setErrors(e => ({ ...e, clientId: '' }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.title.trim())    e.title    = 'Bắt buộc';
    if (!form.clientId.trim()) e.clientId = 'Vui lòng chọn khách hàng';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmitActivity() {
    if (!validate()) return;
    setSaving(true);
    const saved = await onSave({
      type:           form.type,
      title:          form.title.trim(),
      date:           form.date,
      clientId:       form.clientId,
      opportunityId:  form.opportunityId || undefined,
      outcome:        form.outcome,
      nextAction:     form.nextAction.trim(),
      nextActionDate: form.nextActionDate || undefined,
      notes:          form.notes.trim(),
    });
    setSaving(false);
    if (!saved) return;

    if (form.nextAction.trim()) {
      setSavedActId(saved.id);
      setTaskForm({ title: form.nextAction.trim(), dueDate: form.nextActionDate, assignedTo: '' });
      setStep(2);
    } else {
      onClose();
    }
  }

  async function handleCreateTask() {
    if (!taskForm.title.trim()) { setTaskError('Tiêu đề task không được để trống'); return; }
    setTaskSaving(true);
    await addTask({
      title:         taskForm.title.trim(),
      clientId:      form.clientId,
      opportunityId: form.opportunityId || undefined,
      dueDate:       taskForm.dueDate || undefined,
      status:        'pending',
      // assignedTo chỉ gửi khi showAssignedTo=true (manager).
      // Sales: undefined → API tự inject session.id (POST /api/tasks).
      assignedTo:    showAssignedTo ? (taskForm.assignedTo || undefined) : undefined,
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

          {/* Header */}
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
                  {isStep2 ? 'Bước 2 / 2 — Kiểm tra và tạo task' : 'Ghi lại tương tác với khách hàng'}
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

          {/* Body: Step 1 */}
          {!isStep2 && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
                  Loại hoạt động
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ALL_TYPES.map(t => {
                    const c = TYPE_CONFIG[t]; const Icon = c.icon; const active = form.type === t;
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
                  allowedClientIds={allowedClientIds}
                />
              </Field>

              {form.clientId && (
                <Field label="Cơ hội (tuỳ chọn)">
                  <select className="select-base w-full" value={form.opportunityId}
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

          {/* Body + Footer: Step 2 */}
          {isStep2 && (
            <ActivityTaskStep
              taskForm={taskForm}
              taskError={taskError}
              taskSaving={taskSaving}
              showAssignedTo={showAssignedTo}
              onChange={patch => {
                setTaskForm(f => ({ ...f, ...patch }));
                if (patch.title !== undefined && taskError) setTaskError('');
              }}
              onSkip={onClose}
              onCreate={handleCreateTask}
            />
          )}

          {/* Footer: Step 1 */}
          {!isStep2 && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
              style={{ borderTop: '1px solid var(--color-border)' }}>
              <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Hủy</button>
              <button onClick={handleSubmitActivity} disabled={saving}
                className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60">
                {saving
                  ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  : <Plus size={13} />}
                {saving ? 'Đang lưu...' : 'Thêm hoạt động'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
