'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Opportunity, OpportunityStatus } from '@/types';

interface OpportunityStore {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;
  fetchOpportunities: () => Promise<void>;
  addOpportunity: (data: Omit<Opportunity, 'id'>) => Promise<void>;
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

  addOpportunity: async (data) => {
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newOpp: Opportunity = await res.json();
      set((s) => ({ opportunities: [...s.opportunities, newOpp] }));
    } catch {
      set({ error: 'Failed to add' });
    }
  },

  updateStatus: async (id, status) => {
    const prev = get().opportunities;
    // Optimistic update
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id ? { ...o, status } : o
      ),
    }));
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
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
      month: new Date(o.date).getMonth(),
      value: o.value,
      date: o.date,
      status: o.status,
      clientName: o.clientName,
      id: o.id,
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
      .filter(o => o.status !== 'Lost')
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

export function useStaleLeads(days = 3) {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() => {
    const threshold = days * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return opps.filter(
      (o) =>
        (o.status === 'Lead' || o.status === 'Qualified') &&
        now - new Date(o.lastContactDate).getTime() > threshold
    );
  }, [opps, days]);
}

export function useReminders() {
  const staleLeads = useStaleLeads(3);
  const noContact  = useNoContactLeads(7);
  const opps       = useOpportunityStore(s => s.opportunities);

  return useMemo(() => {
    const now = Date.now();
    const expiringProposals = opps.filter(o =>
      (o.status === 'Proposal' || o.status === 'Negotiation') &&
      now - new Date(o.date).getTime() > 14 * 24 * 60 * 60 * 1000
    );

    const alerts = [];

    if (staleLeads.length > 0) alerts.push({
      id: 'stale_lead',
      type: 'stale_lead' as const,
      count: staleLeads.length,
      label: 'Leads chưa có hoạt động',
      description: `${staleLeads.length} lead không có liên hệ trong 3 ngày qua`,
    });

    if (noContact.length > 0) alerts.push({
      id: 'no_contact',
      type: 'no_contact' as const,
      count: noContact.length,
      label: 'Chưa liên hệ gần đây',
      description: `${noContact.length} cơ hội không có liên hệ trong 7 ngày`,
    });

    if (expiringProposals.length > 0) alerts.push({
      id: 'expiring_proposal',
      type: 'expiring_proposal' as const,
      count: expiringProposals.length,
      label: 'Đề xuất sắp hết hạn',
      description: `${expiringProposals.length} đề xuất đã mở quá 14 ngày`,
    });

    return alerts;
  }, [staleLeads, noContact, opps]);
}

export function useNoContactLeads(days = 7) {
  const opps = useOpportunityStore((s) => s.opportunities);
  return useMemo(() => {
    const threshold = days * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return opps.filter(
      (o) => now - new Date(o.lastContactDate).getTime() > threshold
    );
  }, [opps, days]);
}
