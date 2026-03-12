'use client';

import { CheckCircle2, Circle, Trash2, AlertTriangle, Zap, Calendar, Building2 } from 'lucide-react';
import type { Task } from '@/types';

function dueDateBadge(dueDate: string, status: Task['status']) {
  if (status === 'done') return null;
  const today    = new Date().toISOString().split('T')[0];
  const overdue  = dueDate < today;
  const daysLeft = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: overdue ? '#1C0505' : daysLeft <= 1 ? '#1A1400' : 'var(--color-surface)',
        color:      overdue ? '#EF4444' : daysLeft <= 1 ? '#F5C842' : 'var(--color-text-faint)',
        border:     `1px solid ${overdue ? '#7f1d1d' : daysLeft <= 1 ? '#3A3000' : 'var(--color-border)'}`,
      }}>
      <AlertTriangle size={9} />
      {overdue
        ? `Quá hạn ${Math.abs(daysLeft)}n`
        : daysLeft === 0 ? 'Hôm nay'
        : daysLeft === 1 ? 'Ngày mai'
        : `${new Date(dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`}
    </span>
  );
}

export function TaskCard({ task, onToggle, onDelete }: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const done    = task.status === 'done';
  const today   = new Date().toISOString().split('T')[0];
  const overdue = !done && task.dueDate && task.dueDate < today;

  return (
    <div className="group flex items-start gap-3 rounded-xl p-3 transition-all"
      style={{
        background: overdue ? 'rgba(239,68,68,0.04)' : 'var(--color-surface)',
        border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : 'var(--color-border)'}`,
        opacity: done ? 0.55 : 1,
      }}>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 shrink-0 transition-colors hover:scale-110"
        style={{ color: done ? 'var(--color-brand)' : 'var(--color-text-disabled)' }}>
        {done
          ? <CheckCircle2 size={16} />
          : <Circle size={16} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug"
            style={{
              color: done ? 'var(--color-text-faint)' : 'var(--color-text-primary)',
              textDecoration: done ? 'line-through' : 'none',
            }}>
            {task.title}
          </p>
          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {task.createdFrom && (
              <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: 'var(--color-brand-muted)', color: 'var(--color-brand)', border: '1px solid var(--color-brand-border)' }}>
                <Zap size={8} /> Từ hoạt động
              </span>
            )}
            {task.dueDate && dueDateBadge(task.dueDate, task.status)}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
            {task.clientName}
          </span>
          <span style={{ color: 'var(--color-text-disabled)', fontSize: 10 }}>·</span>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
            <Building2 size={9} /> {task.company}
          </span>
          {task.assignedTo && (
            <>
              <span style={{ color: 'var(--color-text-disabled)', fontSize: 10 }}>·</span>
              <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                @{task.assignedTo}
              </span>
            </>
          )}
          {done && task.completedAt && (
            <>
              <span style={{ color: 'var(--color-text-disabled)', fontSize: 10 }}>·</span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-disabled)' }}>
                <Calendar size={9} />
                Xong {new Date(task.completedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              </span>
            </>
          )}
        </div>

        {task.notes && (
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-faint)' }}>
            {task.notes}
          </p>
        )}
      </div>

      {/* Delete — chỉ hiện khi hover */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
        style={{ color: 'var(--color-text-disabled)' }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}
