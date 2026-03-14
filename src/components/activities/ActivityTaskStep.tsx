// src/components/activities/ActivityTaskStep.tsx
// Step 2 của AddActivityModal — form xác nhận và tạo task follow-up.
//
// Được kích hoạt khi user điền field "Bước tiếp theo" trước khi lưu activity.
// Activity đã được lưu thành công ở Step 1 trước khi component này mount.
//
// showAssignedTo: chỉ true với manager — cùng logic với TaskModal.
// API tự inject assignedTo = session.id cho salesperson (POST /api/tasks).

'use client';

import { useMemo } from 'react';
import { CheckSquare } from 'lucide-react';
import { useUsersStore } from '@/store/useUsersStore';

interface TaskFormState {
  title:      string;
  dueDate:    string;
  assignedTo: string;
}

interface ActivityTaskStepProps {
  taskForm:        TaskFormState;
  taskError:       string;
  taskSaving:      boolean;
  showAssignedTo:  boolean;
  onChange:        (patch: Partial<TaskFormState>) => void;
  onSkip:          () => void;
  onCreate:        () => void;
}

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

export function ActivityTaskStep({
  taskForm, taskError, taskSaving, showAssignedTo, onChange, onSkip, onCreate,
}: ActivityTaskStepProps) {
  const users        = useUsersStore(s => s.users);
  const salespersons = useMemo(() => users.filter(u => u.role === 'salesperson'), [users]);

  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Xác nhận activity đã lưu */}
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
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

        <Field label="Nội dung task *" error={taskError}>
          <input
            className="input-base w-full"
            placeholder="Mô tả việc cần làm..."
            value={taskForm.title}
            autoFocus
            onChange={e => onChange({ title: e.target.value })}
          />
        </Field>

        <Field label="Ngày đến hạn">
          <input
            className="input-base w-full"
            style={{ paddingRight: '2.5rem' }}
            type="date"
            value={taskForm.dueDate}
            onChange={e => onChange({ dueDate: e.target.value })}
          />
        </Field>

        {/* Chỉ hiện khi showAssignedTo=true (manager) — cùng logic với TaskModal */}
        {showAssignedTo && (
          <Field label="Giao cho">
            <select
              className="select-base w-full"
              value={taskForm.assignedTo}
              onChange={e => onChange({ assignedTo: e.target.value })}
            >
              <option value="">— Không giao —</option>
              {salespersons.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <button onClick={onSkip} className="btn-ghost text-sm px-4 py-2">
          Bỏ qua
        </button>
        <button
          onClick={onCreate}
          disabled={taskSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          style={{ background: '#22C55E', color: '#000' }}
        >
          {taskSaving
            ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            : <CheckSquare size={13} />}
          {taskSaving ? 'Đang tạo...' : 'Tạo task & đóng'}
        </button>
      </div>
    </>
  );
}
