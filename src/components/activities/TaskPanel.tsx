'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, CheckSquare, Clock, ListTodo } from 'lucide-react';
import { useTaskStore, usePendingTasks, useOverdueTasks, useTasksForClients } from '@/store/useTaskStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';

interface TaskPanelProps {
  ownerClientIds: Set<string> | null;
}

export function TaskPanel({ ownerClientIds }: TaskPanelProps) {
  const { tasks, isLoading, fetchTasks, addTask, toggleDone, deleteTask } = useTaskStore();
  const allPending  = usePendingTasks();
  const allOverdue  = useOverdueTasks();
  const fallbackIds = useMemo(() => new Set(tasks.map(t => t.clientId)), [tasks]);
  const ownedTasks  = useTasksForClients(ownerClientIds ?? fallbackIds);

  const today   = new Date().toISOString().split('T')[0];
  const pending = ownerClientIds
    ? ownedTasks.filter(t => t.status === 'pending')
    : allPending;
  const overdue = ownerClientIds
    ? ownedTasks.filter(t => t.status === 'pending' && t.dueDate && t.dueDate < today)
    : allOverdue;

  const [tab, setTab]            = useState<'pending' | 'done'>('pending');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const displayed = useMemo(() => {
    if (tab === 'pending') {
      const today = new Date().toISOString().split('T')[0];
      return [...pending].sort((a, b) => {
        const aOv = a.dueDate && a.dueDate < today;
        const bOv = b.dueDate && b.dueDate < today;
        if (aOv && !bOv) return -1;
        if (!aOv && bOv) return 1;
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }
    return tasks
      .filter(t => t.status === 'done')
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  }, [tab, tasks, pending]);

  return (
    <div className="flex flex-col h-full"
      style={{ borderLeft: '1px solid var(--color-border)' }}>

      {/* Panel header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare size={14} style={{ color: 'var(--color-brand)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Tasks
            </span>
            {pending.length > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums"
                style={{
                  background: overdue.length > 0 ? 'rgba(239,68,68,0.15)' : 'var(--color-brand-muted)',
                  color:      overdue.length > 0 ? '#EF4444' : 'var(--color-brand)',
                }}
              >
                {pending.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-brand)', border: '1px solid var(--color-brand-border)' }}
          >
            <Plus size={11} /> Thêm
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-0.5" style={{ background: 'var(--color-surface)' }}>
          {(['pending', 'done'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all"
              style={{
                background: tab === t ? 'var(--color-neutral-50)' : 'transparent',
                color:      tab === t ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
              }}
            >
              {t === 'pending'
                ? <><Clock size={10} /> Chờ xử lý</>
                : <><CheckSquare size={10} /> Hoàn thành</>}
            </button>
          ))}
        </div>

        {/* Overdue warning */}
        {tab === 'pending' && overdue.length > 0 && (
          <div
            className="mt-2 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <span className="font-semibold">{overdue.length}</span> task quá hạn
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2"
              style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }}
            />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col h-32 items-center justify-center gap-2">
            <ListTodo size={20} style={{ color: 'var(--color-text-disabled)' }} />
            <p className="text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
              {tab === 'pending' ? 'Không có task nào đang chờ' : 'Chưa hoàn thành task nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(task => (
              <TaskCard key={task.id} task={task} onToggle={toggleDone} onDelete={deleteTask} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          onClose={() => setShowModal(false)}
          allowedClientIds={ownerClientIds ?? undefined}
          onSave={async (data) => {
            await addTask(data);
            await fetchTasks();
          }}
        />
      )}
    </div>
  );
}
