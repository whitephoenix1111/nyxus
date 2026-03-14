// src/components/tasks/TaskModal.tsx — Modal tạo task thủ công
//
// Phân biệt với task được tạo tự động:
// - Task thủ công (modal này): user chủ động tạo, `createdFrom` = undefined
// - Task tự động: tạo từ `nextAction` khi log Activity, `createdFrom = activityId`
//   (xem AddActivityModal — step 2: confirm tạo Task follow-up)
//
// Modal này dùng duy nhất cho luồng tạo thủ công từ /tasks page.

'use client';

import { useState, useMemo } from 'react';
import { X, Plus, CheckSquare } from 'lucide-react';
import type { Task } from '@/types';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useUsersStore } from '@/store/useUsersStore';
import { ClientCombobox } from '@/components/ui/ClientCombobox';

// ── Field wrapper ─────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY: Omit<Task, 'id' | 'createdAt'> = {
  title:         '',
  clientId:      '',
  opportunityId: undefined,
  dueDate:       '',
  status:        'pending',
  assignedTo:    undefined,
  notes:         '',
};

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * @param onClose          Gọi khi Hủy, X, hoặc click backdrop
 * @param onSave           Async callback nhận payload task — caller gọi store.addTask
 * @param allowedClientIds Set clientId user được phép tạo task cho (undefined = manager, không giới hạn)
 * @param showAssignedTo   false khi caller là salesperson — field không có ý nghĩa vì
 *                         sales chỉ thấy client của mình, người được giao khác sẽ không
 *                         thấy task trên giao diện của họ (filter theo client.ownerId).
 *                         true (default) = manager — có thể giao cho bất kỳ salesperson nào.
 */

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskModal({ onClose, onSave, allowedClientIds, showAssignedTo = true }: {
  onClose: () => void;
  onSave:  (data: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  allowedClientIds?: Set<string>;
  showAssignedTo?: boolean;
}) {
  const opportunities  = useOpportunityStore(s => s.opportunities);
  const users          = useUsersStore(s => s.users);
  const salespersons   = useMemo(() => users.filter(u => u.role === 'salesperson'), [users]);

  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const clientOpps = useMemo(() =>
    form.clientId
      ? opportunities.filter(o =>
          o.clientId === form.clientId &&
          o.status !== 'Won' &&
          o.status !== 'Lost'
        )
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
      dueDate:       form.dueDate       || undefined,
      // assignedTo chỉ gửi lên khi field được hiển thị (manager).
      // Sales không thấy field này → luôn undefined, server không set assignedTo.
      assignedTo:    showAssignedTo ? (form.assignedTo || undefined) : undefined,
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

          {/* ── Header ──────────────────────────────────────────────────────── */}
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

          {/* ── Body ────────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            <Field label="Tiêu đề *" error={errors.title}>
              <input className="input-base w-full" placeholder="Việc cần làm..."
                value={form.title} onChange={e => setField('title', e.target.value)} />
            </Field>

            <Field label="Khách hàng *" error={errors.clientId}>
              <ClientCombobox
                value={form.clientId}
                error={errors.clientId}
                allowedClientIds={allowedClientIds}
                onChange={(id) => {
                  setForm(f => ({ ...f, clientId: id, opportunityId: undefined }));
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
                      {o.title} · {o.status}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Deadline">
              <input className="input-base w-full" type="date"
                value={form.dueDate ?? ''} onChange={e => setField('dueDate', e.target.value)} />
            </Field>

            {/* Chỉ hiện khi showAssignedTo=true (manager).
                Sales không thấy field này vì task của client mình tạo ra luôn thuộc về mình —
                giao cho người khác không có tác dụng vì filter hiển thị theo client.ownerId. */}
            {showAssignedTo && (
              <Field label="Giao cho">
                <select className="select-base w-full"
                  value={form.assignedTo ?? ''}
                  onChange={e => setField('assignedTo', e.target.value)}>
                  <option value="">— Không giao —</option>
                  {salespersons.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Ghi chú">
              <textarea className="input-base w-full resize-none" rows={3}
                placeholder="Thông tin bổ sung..."
                value={form.notes ?? ''} onChange={e => setField('notes', e.target.value)} />
            </Field>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
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
