'use client';

import { useMemo } from 'react';
import type { Activity, Opportunity, OpportunityStatus } from '@/types';
import { useOpportunityStore } from './useOpportunityStore';

export function useStatsByStatus() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    const counts: Record<OpportunityStatus, number> = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 };
    const values: Record<OpportunityStatus, number> = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 };
    opps.forEach(o => { counts[o.status]++; values[o.status] += o.value; });
    return { counts, values };
  }, [opps]);
}

export function useMonthlyChartData() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() =>
    opps.map(o => ({
      month:      new Date(o.date).getMonth(),
      value:      o.value,
      date:       o.date,
      status:     o.status,
      clientName: o.clientName,
      id:         o.id,
    })),
    [opps]
  );
}

export function useAverageValue() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    if (opps.length === 0) return 0;
    return opps.reduce((sum, o) => sum + o.value, 0) / opps.length;
  }, [opps]);
}

export function useForecastRevenue() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() =>
    opps.filter(o => o.status !== 'Lost').reduce((sum, o) => sum + o.value * (o.confidence / 100), 0),
    [opps]
  );
}

export function useTopClients(limit = 25) {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() =>
    [...opps].sort((a, b) => b.value - a.value).slice(0, limit),
    [opps, limit]
  );
}

export function useStaleLeads(activities: Activity[], days = 3, oppsOverride?: Opportunity[]) {
  const storeOpps = useOpportunityStore(s => s.opportunities);
  const opps = oppsOverride ?? storeOpps;
  return useMemo(() => {
    const now       = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000;
    const staleStatuses: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal'];
    return opps.filter(opp => {
      if (!staleStatuses.includes(opp.status)) return false;
      if (now - new Date(opp.lastContactDate).getTime() <= threshold) return false;
      const hasPendingTask = activities.some(
        a => a.opportunityId === opp.id && a.nextActionDate && new Date(a.nextActionDate).getTime() >= now
      );
      return !hasPendingTask;
    });
  }, [opps, activities, days]);
}

export function useOverdueTaskAlerts(activities: Activity[], oppsOverride?: Opportunity[]) {
  const storeOpps = useOpportunityStore(s => s.opportunities);
  const opps = oppsOverride ?? storeOpps;
  return useMemo(() => {
    const now = Date.now();
    const results: Array<{ activity: Activity; opportunity: Opportunity }> = [];
    activities.forEach(act => {
      if (!act.nextActionDate) return;
      if (new Date(act.nextActionDate).getTime() >= now) return;
      if (!act.opportunityId) return;
      const opp = opps.find(o => o.id === act.opportunityId);
      if (!opp || opp.status === 'Won' || opp.status === 'Lost') return;
      const hasNewerActivity = activities.some(
        a => a.opportunityId === opp.id && a.id !== act.id &&
             new Date(a.date).getTime() > new Date(act.nextActionDate!).getTime()
      );
      if (hasNewerActivity) return;
      results.push({ activity: act, opportunity: opp });
    });
    return results.sort((a, b) =>
      new Date(a.activity.nextActionDate!).getTime() - new Date(b.activity.nextActionDate!).getTime()
    );
  }, [opps, activities]);
}

export function useExpiringProposals(days = 14, oppsOverride?: Opportunity[]) {
  const storeOpps = useOpportunityStore(s => s.opportunities);
  const opps = oppsOverride ?? storeOpps;
  return useMemo(() => {
    const now       = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000;
    return opps.filter(o =>
      o.status === 'Proposal' && now - new Date(o.lastContactDate).getTime() > threshold
    );
  }, [opps, days]);
}

export function useReminders(activities: Activity[], oppsOverride?: Opportunity[]) {
  const staleLeads        = useStaleLeads(activities, 3, oppsOverride);
  const overdueTasks      = useOverdueTaskAlerts(activities, oppsOverride);
  const expiringProposals = useExpiringProposals(14, oppsOverride);

  return useMemo(() => {
    const alerts = [];
    if (overdueTasks.length > 0) alerts.push({
      id: 'overdue_task', type: 'overdue_task' as const, count: overdueTasks.length,
      label: 'Tasks quá hạn', description: `${overdueTasks.length} task chưa được xử lý sau deadline`,
    });
    if (staleLeads.length > 0) alerts.push({
      id: 'stale_deal', type: 'stale_deal' as const, count: staleLeads.length,
      label: 'Deals không có hoạt động', description: `${staleLeads.length} deal không có liên hệ trong 3 ngày`,
    });
    if (expiringProposals.length > 0) alerts.push({
      id: 'expiring_proposal', type: 'expiring_proposal' as const, count: expiringProposals.length,
      label: 'Proposals sắp hết hạn', description: `${expiringProposals.length} proposal đã mở quá 14 ngày`,
    });
    return alerts;
  }, [overdueTasks, staleLeads, expiringProposals]);
}
