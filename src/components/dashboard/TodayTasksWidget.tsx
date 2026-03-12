'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import type { Task } from '@/types';

interface TodayTasksWidgetProps {
  tasks: Task[];
  onToggle?: (taskId: string) => void;
}

export default function TodayTasksWidget({ tasks, onToggle }: TodayTasksWidgetProps) {
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();

  const { overdue, dueToday, upcoming } = useMemo(() => {
    const pending = tasks.filter(t => t.status === 'pending');
    return {
      overdue:  pending.filter(t => t.dueDate && t.dueDate < today),
      dueToday: pending.filter(t => t.dueDate === today),
      upcoming: pending.filter(t => !t.dueDate || t.dueDate > today).slice(0, 3),
    };
  }, [tasks, today]);

  const visible = [...overdue, ...dueToday, ...upcoming];

  return (
    <div className="rounded-2xl bg-[#111] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Việc cần làm hôm nay</h2>
        {(overdue.length + dueToday.length) > 0 && (
          <span className="rounded-full bg-[#EF444420] px-2 py-0.5 text-xs font-medium text-[#EF4444]">
            {overdue.length + dueToday.length} cần xử lý
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 size={32} className="text-[#DFFF00] mb-2" />
          <p className="text-sm text-[#555]">Không có task nào cần làm hôm nay.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(task => {
            const isOverdue = task.dueDate && task.dueDate < today;
            const isToday   = task.dueDate === today;

            return (
              <div
                key={task.id}
                onClick={() => router.push('/activities')}
                className={`flex items-start gap-3 rounded-xl p-3 transition-colors cursor-pointer hover:brightness-125 ${
                  isOverdue
                    ? 'bg-[#EF444410] border border-[#EF444430]'
                    : isToday
                    ? 'bg-[#DFFF0008] border border-[#DFFF0020]'
                    : 'bg-[#0a0a0a]'
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle?.(task.id); }}
                  className="mt-0.5 shrink-0 text-[#444] hover:text-[#DFFF00] transition-colors"
                >
                  <Circle size={16} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug truncate">{task.title}</p>
                  <p className="text-xs text-[#555] mt-0.5 truncate">{task.company}</p>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {isOverdue && (
                    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                      <AlertCircle size={12} />
                      Quá hạn
                    </span>
                  )}
                  {isToday && !isOverdue && (
                    <span className="flex items-center gap-1 text-xs text-[#DFFF00]">
                      <Clock size={12} />
                      Hôm nay
                    </span>
                  )}
                  {task.dueDate && !isOverdue && !isToday && (
                    <span className="text-xs text-[#444]">{task.dueDate}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
