'use client';

import { useMemo } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import KPIScatterChart from '@/components/dashboard/KPIScatterChart';
import KPISummary from '@/components/dashboard/KPISummary';
import ReminderCard from '@/components/dashboard/ReminderCard';
import ClientCard from '@/components/dashboard/ClientCard';
import TeamLeaderboard from '@/components/dashboard/TeamLeaderboard';
import { OwnerFilter } from '@/components/ui/OwnerFilter';
import { useMonthlyChartData, useAverageValue, useReminders } from '@/store/opportunitySelectors';
import type { Activity, Client, Opportunity, OpportunityStatus, Task } from '@/types';

const REMINDER_ACCENT: Record<string, string> = {
  overdue_task:      '#EF4444',
  stale_deal:        '#F5C842',
  expiring_proposal: '#F5A742',
};

function useOppStats(opps: Opportunity[]) {
  return useMemo(() => {
    const counts = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 } as Record<OpportunityStatus, number>;
    const values = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 } as Record<OpportunityStatus, number>;
    opps.forEach(o => { counts[o.status]++; values[o.status] += o.value; });
    return { counts, values };
  }, [opps]);
}

interface ManagerDashboardProps {
  opportunities:      Opportunity[];
  activities:         Activity[];
  tasks:              Task[];
  clients:            Client[];
  ownerFilter:        string;
  onOwnerFilterChange: (v: string) => void;
}

export function ManagerDashboard({ opportunities, activities, tasks, clients, ownerFilter, onOwnerFilterChange }: ManagerDashboardProps) {
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const filteredOpps = useMemo(
    () => ownerFilter ? opportunities.filter(o => o.ownerId === ownerFilter) : opportunities,
    [opportunities, ownerFilter]
  );

  const filteredActivities = useMemo(() => {
    if (!ownerFilter) return activities;
    const clientIds = new Set(filteredOpps.map(o => o.clientId));
    return activities.filter(a => clientIds.has(a.clientId));
  }, [activities, filteredOpps, ownerFilter]);

  const reminders = useReminders(filteredActivities, ownerFilter ? filteredOpps : undefined);
  const chartData  = useMonthlyChartData();
  const avgValue   = useAverageValue();

  const { counts, values } = useOppStats(filteredOpps);
  const totalSales = values.Won;
  const openQuotes = counts.Proposal + counts.Negotiation;
  const totalOpps  = counts.Lead + counts.Qualified + counts.Proposal + counts.Negotiation;

  const topClients = useMemo(
    () => [...filteredOpps]
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
            ) : reminders.map(r => (
              <ReminderCard key={r.id} type={r.type} count={r.count} label={r.label}
                description={r.description} accentColor={REMINDER_ACCENT[r.type] ?? '#DFFF00'} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Top 25 Khách hàng</h2>
          <div className="grid grid-cols-1 gap-2">
            {topClients.map(opp => (
              <ClientCard key={opp.id} opportunity={opp} client={clientMap.get(opp.clientId)} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
