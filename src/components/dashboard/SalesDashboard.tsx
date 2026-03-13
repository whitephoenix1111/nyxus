'use client';

import { useMemo } from 'react';
import PersonalStatCards from '@/components/dashboard/PersonalStatCards';
import ReminderCard from '@/components/dashboard/ReminderCard';
import TodayTasksWidget from '@/components/dashboard/TodayTasksWidget';
import StaleLeadsWidget from '@/components/dashboard/StaleLeadsWidget';
import { useReminders } from '@/store/opportunitySelectors';
import type { Activity, Opportunity, Task } from '@/types';

const REMINDER_ACCENT: Record<string, string> = {
  overdue_task:      '#EF4444',
  stale_deal:        '#F5C842',
  expiring_proposal: '#F5A742',
};

interface SalesDashboardProps {
  opportunities: Opportunity[];
  activities: Activity[];
  tasks: Task[];
  currentUserId: string;
  onToggleTask: (id: string) => void;
}

export function SalesDashboard({ opportunities, activities, tasks, currentUserId, onToggleTask }: SalesDashboardProps) {
  const myOpps = useMemo(
    () => opportunities.filter(o => o.ownerId === currentUserId),
    [opportunities, currentUserId]
  );
  const myClientIds = useMemo(() => new Set(myOpps.map(o => o.clientId)), [myOpps]);
  const myActivities = useMemo(
    () => activities.filter(a => myClientIds.has(a.clientId)),
    [activities, myClientIds]
  );
  const myTasks = useMemo(
    () => tasks.filter(t => myClientIds.has(t.clientId)),
    [tasks, myClientIds]
  );

  const reminders = useReminders(myActivities, myOpps);

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const leadCount = useMemo(
    () => myOpps.filter(o => ['Lead', 'Qualified', 'Proposal', 'Negotiation'].includes(o.status)).length,
    [myOpps]
  );
  const pipelineValue = useMemo(
    () => myOpps.filter(o => !['Won', 'Lost'].includes(o.status)).reduce((s, o) => s + o.value, 0),
    [myOpps]
  );
  const wonThisMonth = useMemo(
    () => myOpps
      .filter(o => o.status === 'Won' && o.lastContactDate >= monthStart)
      .reduce((s, o) => s + o.value, 0),
    [myOpps, monthStart]
  );
  const pendingTaskCount = useMemo(
    () => myTasks.filter(t => t.status === 'pending').length,
    [myTasks]
  );

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Main */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5 min-w-0">
        <h1 className="text-2xl font-bold text-white mb-5">Tổng quan của bạn</h1>

        <PersonalStatCards
          leadCount={leadCount}
          pipelineValue={pipelineValue}
          wonThisMonth={wonThisMonth}
          pendingTaskCount={pendingTaskCount}
        />

        <TodayTasksWidget tasks={myTasks} onToggle={onToggleTask} />
      </div>

      {/* Sidebar */}
      <aside className="w-80 shrink-0 border-l border-[#111] overflow-y-auto px-4 py-5">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Nhắc nhở</h2>
          <div className="flex flex-col gap-3">
            {reminders.length === 0 ? (
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] px-4 py-3">
                <p className="text-sm text-[#555]">Không có nhắc nhở nào.</p>
              </div>
            ) : reminders.map(r => (
              <ReminderCard key={r.id} type={r.type} count={r.count} label={r.label}
                description={r.description} accentColor={REMINDER_ACCENT[r.type] ?? '#DFFF00'} />
            ))}
          </div>
        </div>

        <StaleLeadsWidget opportunities={myOpps} />
      </aside>
    </div>
  );
}
