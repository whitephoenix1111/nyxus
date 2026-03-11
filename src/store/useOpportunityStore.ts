'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Activity, Opportunity, OpportunityStatus } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

interface OpportunityStore {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;
  fetchOpportunities: () => Promise<void>;
  addOpportunity: (opp: Opportunity) => void;
  updateStatus: (id: string, status: OpportunityStatus) => Promise<void>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
}

export const useOpportunityStore = create<OpportunityStore>((set, get) => ({
  opportunities: [],
  isLoading: false,
  error: null,

  fetchOpportunities: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/opportunities');
      const data: Opportunity[] = await res.json();
      set({ opportunities: data, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch', isLoading: false });
    }
  },

  // Dùng khi /api/leads trả về opportunity đã tạo sẵn — chỉ append vào state
  addOpportunity: (opp) => {
    set((s) => ({ opportunities: [...s.opportunities, opp] }));
  },

  updateStatus: async (id, status) => {
    const prev = get().opportunities;
    // Optimistic — confidence nhảy về default stage mới
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id
          ? { ...o, status, confidence: STAGE_DEFAULT_CONFIDENCE[status] }
          : o
      ),
    }));
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, confidence: STAGE_DEFAULT_CONFIDENCE[status] }),
      });
    } catch {
      set({ opportunities: prev, error: 'Failed to update status' });
    }
  },

  updateOpportunity: async (id, data) => {
    const prev = get().opportunities;
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id ? { ...o, ...data } : o
      ),
    }));
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      set({ opportunities: prev, error: 'Failed to update' });
    }
  },

  deleteOpportunity: async (id) => {
    const prev = get().opportunities;
    set((s) => ({
      opportunities: s.opportunities.filter((o) => o.id !== id),
    }));
    try {
      await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
    } catch {
      set({ opportunities: prev, error: 'Failed to delete' });
    }
  },
}));

// ── Selectors ────────────────────────────────────────────────────

export function useStatsByStatus() {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() => {
    const counts: Record<OpportunityStatus, number> = {
      Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0,
    };
    const values: Record<OpportunityStatus, number> = {
      Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0,
    };
    opps.forEach((o) => {
      counts[o.status]++;
      values[o.status] += o.value;
    });
    return { counts, values };
  }, [opps]);
}

export function useMonthlyChartData() {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() =>
    opps.map((o) => ({
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
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() => {
    if (opps.length === 0) return 0;
    return opps.reduce((sum, o) => sum + o.value, 0) / opps.length;
  }, [opps]);
}

export function useForecastRevenue() {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() =>
    opps
      .filter((o) => o.status !== 'Lost')
      .reduce((sum, o) => sum + o.value * (o.confidence / 100), 0),
    [opps]
  );
}

export function useTopClients(limit = 25) {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() =>
    [...opps].sort((a, b) => b.value - a.value).slice(0, limit),
    [opps, limit]
  );
}

// status ∈ [Lead, Qualified, Proposal], lastContactDate > N ngày, không có pending task
// activities được truyền vào để tránh circular import giữa stores
export function useStaleLeads(activities: Activity[], days = 3) {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() => {
    const now       = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000;
    const staleStatuses: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal'];

    return opps.filter((opp) => {
      if (!staleStatuses.includes(opp.status)) return false;
      if (now - new Date(opp.lastContactDate).getTime() <= threshold) return false;

      // Loại nếu có nextActionDate còn trong tương lai (pending task đã lên lịch)
      const hasPendingTask = activities.some(
        (a) =>
          a.opportunityId === opp.id &&
          a.nextActionDate &&
          new Date(a.nextActionDate).getTime() >= now
      );
      return !hasPendingTask;
    });
  }, [opps, activities, days]);
}

// activity.nextActionDate đã quá hạn && opportunity không có activity mới hơn sau due date
// activities được truyền vào để tránh circular import
export function useOverdueTasks(activities: Activity[]) {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() => {
    const now = Date.now();
    const results: Array<{ activity: Activity; opportunity: Opportunity }> = [];

    activities.forEach((act) => {
      if (!act.nextActionDate) return;
      if (new Date(act.nextActionDate).getTime() >= now) return; // chưa đến hạn
      if (!act.opportunityId) return;

      const opp = opps.find((o) => o.id === act.opportunityId);
      if (!opp || opp.status === 'Won' || opp.status === 'Lost') return;

      // Kiểm tra có activity mới hơn nextActionDate không — tức là task đã được xử lý
      const hasNewerActivity = activities.some(
        (a) =>
          a.opportunityId === opp.id &&
          a.id !== act.id &&
          new Date(a.date).getTime() > new Date(act.nextActionDate!).getTime()
      );
      if (hasNewerActivity) return;

      results.push({ activity: act, opportunity: opp });
    });

    return results.sort(
      (a, b) =>
        new Date(a.activity.nextActionDate!).getTime() -
        new Date(b.activity.nextActionDate!).getTime()
    );
  }, [opps, activities]);
}

// status = Proposal, lastContactDate > N ngày
export function useExpiringProposals(days = 14) {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() => {
    const now       = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000;
    return opps.filter(
      (o) =>
        o.status === 'Proposal' &&
        now - new Date(o.lastContactDate).getTime() > threshold
    );
  }, [opps, days]);
}

// Tổng hợp 3 loại reminder cho Dashboard widget
// activities được truyền vào từ useActivityStore ở component — tránh circular import
export function useReminders(activities: Activity[]) {
  const staleLeads        = useStaleLeads(activities, 3);
  const overdueTasks      = useOverdueTasks(activities);
  const expiringProposals = useExpiringProposals(14);

  return useMemo(() => {
    const alerts = [];

    if (overdueTasks.length > 0) alerts.push({
      id:          'overdue_task',
      type:        'overdue_task' as const,
      count:       overdueTasks.length,
      label:       'Tasks quá hạn',
      description: `${overdueTasks.length} task chưa được xử lý sau deadline`,
    });

    if (staleLeads.length > 0) alerts.push({
      id:          'stale_deal',
      type:        'stale_deal' as const,
      count:       staleLeads.length,
      label:       'Deals không có hoạt động',
      description: `${staleLeads.length} deal không có liên hệ trong 3 ngày`,
    });

    if (expiringProposals.length > 0) alerts.push({
      id:          'expiring_proposal',
      type:        'expiring_proposal' as const,
      count:       expiringProposals.length,
      label:       'Proposals sắp hết hạn',
      description: `${expiringProposals.length} proposal đã mở quá 14 ngày`,
    });

    return alerts;
  }, [overdueTasks, staleLeads, expiringProposals]);
}
