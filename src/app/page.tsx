'use client';

import { useEffect, useMemo, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import KPIScatterChart from '@/components/dashboard/KPIScatterChart';
import KPISummary from '@/components/dashboard/KPISummary';
import ReminderCard from '@/components/dashboard/ReminderCard';
import ClientCard from '@/components/dashboard/ClientCard';
import PersonalStatCards from '@/components/dashboard/PersonalStatCards';
import TeamLeaderboard from '@/components/dashboard/TeamLeaderboard';
import TodayTasksWidget from '@/components/dashboard/TodayTasksWidget';
import StaleLeadsWidget from '@/components/dashboard/StaleLeadsWidget';
import {
  useOpportunityStore,
  useMonthlyChartData,
  useAverageValue,
  useReminders,
} from '@/store/useOpportunityStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useIsManager, useCurrentUser } from '@/store/useAuthStore';
import { useUsersStore } from '@/store/useUsersStore';
import { OwnerFilter } from '@/components/ui/OwnerBadge';
import type { Activity, Opportunity, OpportunityStatus, Task } from '@/types';

const REMINDER_ACCENT: Record<string, string> = {
  overdue_task:      '#EF4444',
  stale_deal:        '#F5C842',
  expiring_proposal: '#F5A742',
};

// ── Root page — fetches data, splits by role ──────────────────────
export default function DashboardPage() {
  const { opportunities, fetchOpportunities, isLoading } = useOpportunityStore();
  const { activities, fetchActivities } = useActivityStore();
  const { tasks, fetchTasks, toggleDone } = useTaskStore();
  const allTasks = tasks;
  const isManager   = useIsManager();
  const currentUser = useCurrentUser();
  const { fetchUsers } = useUsersStore();

  const [ownerFilter, setOwnerFilter] = useState('');

  useEffect(() => {
    fetchOpportunities();
    fetchActivities();
    fetchTasks();
    if (isManager) fetchUsers();
  }, [fetchOpportunities, fetchActivities, fetchTasks, fetchUsers, isManager]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-[#DFFF00]" />
          <p className="text-sm text-[#555]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (isManager) {
    return (
      <ManagerDashboard
        opportunities={opportunities}
        activities={activities}
        tasks={allTasks}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
      />
    );
  }

  return (
    <SalesDashboard
      opportunities={opportunities}
      activities={activities}
      tasks={tasks}
      currentUserId={currentUser?.id ?? ''}
      onToggleTask={toggleDone}
    />
  );
}

// ── Manager Dashboard ─────────────────────────────────────────────
interface ManagerProps {
  opportunities: Opportunity[];
  activities: Activity[];
  tasks: Task[];
  ownerFilter: string;
  onOwnerFilterChange: (v: string) => void;
}

function ManagerDashboard({ opportunities, activities, tasks, ownerFilter, onOwnerFilterChange }: ManagerProps) {
  const filteredOpps = useMemo(
    () => ownerFilter ? opportunities.filter(o => o.ownerId === ownerFilter) : opportunities,
    [opportunities, ownerFilter]
  );

  const filteredActivities = useMemo(() => {
    if (!ownerFilter) return activities;
    const clientIds = new Set(filteredOpps.map(o => o.clientId));
    return activities.filter(a => clientIds.has(a.clientId));
  }, [activities, filteredOpps, ownerFilter]);

  const reminders  = useReminders(filteredActivities, ownerFilter ? filteredOpps : undefined);
  const chartData  = useMonthlyChartData();
  const avgValue   = useAverageValue();

  const { counts, values } = useOppStats(filteredOpps);
  const totalSales = values.Won;
  const openQuotes = counts.Proposal + counts.Negotiation;
  const totalOpps  = counts.Lead + counts.Qualified + counts.Proposal + counts.Negotiation;

  const topClients = useMemo(
    () =>
      [...filteredOpps]
        .sort((a, b) => b.value * (b.confidence / 100) - a.value * (a.confidence / 100))
        .slice(0, 25),
    [filteredOpps]
  );

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Main */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-white">Tổng quan</h1>
          <OwnerFilter value={ownerFilter} onChange={onOwnerFilterChange} />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard status="Lead"        count={counts.Lead}        totalValue={values.Lead}        isActive />
          <StatCard status="Proposal"    count={counts.Proposal}    totalValue={values.Proposal}    />
          <StatCard status="Negotiation" count={counts.Negotiation} totalValue={values.Negotiation} />
          <StatCard status="Won"         count={counts.Won}         totalValue={values.Won}         />
        </div>

        <TeamLeaderboard opportunities={opportunities} tasks={tasks} />

        <div className="rounded-2xl bg-[#111] p-4 mt-4">
          <h2 className="text-lg font-semibold text-white mb-4">Chỉ số hiệu suất chính</h2>
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <KPIScatterChart data={chartData} averageValue={avgValue} />
            </div>
            <KPISummary totalSales={totalSales} openQuotes={openQuotes} opportunities={totalOpps} />
          </div>
        </div>
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
            ) : (
              reminders.map(r => (
                <ReminderCard
                  key={r.id}
                  type={r.type}
                  count={r.count}
                  label={r.label}
                  description={r.description}
                  accentColor={REMINDER_ACCENT[r.type] ?? '#DFFF00'}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Top 25 Khách hàng</h2>
          <div className="grid grid-cols-1 gap-2">
            {topClients.map(opp => (
              <ClientCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Sales Dashboard ───────────────────────────────────────────────
interface SalesProps {
  opportunities: Opportunity[];
  activities: Activity[];
  tasks: Task[];
  currentUserId: string;
  onToggleTask: (id: string) => void;
}

function SalesDashboard({ opportunities, activities, tasks, currentUserId, onToggleTask }: SalesProps) {
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
    () =>
      myOpps
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
            ) : (
              reminders.map(r => (
                <ReminderCard
                  key={r.id}
                  type={r.type}
                  count={r.count}
                  label={r.label}
                  description={r.description}
                  accentColor={REMINDER_ACCENT[r.type] ?? '#DFFF00'}
                />
              ))
            )}
          </div>
        </div>

        <StaleLeadsWidget opportunities={myOpps} />
      </aside>
    </div>
  );
}

// ── Shared helper ─────────────────────────────────────────────────
function useOppStats(opps: Opportunity[]) {
  return useMemo(() => {
    const counts = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 } as Record<OpportunityStatus, number>;
    const values = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 } as Record<OpportunityStatus, number>;
    opps.forEach(o => { counts[o.status]++; values[o.status] += o.value; });
    return { counts, values };
  }, [opps]);
}
