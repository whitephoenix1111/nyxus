'use client';

import { create } from 'zustand';
import type { Opportunity, OpportunityStatus } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

// Re-export selectors để backward-compatible với mọi import hiện tại
export {
  useStatsByStatus,
  useMonthlyChartData,
  useAverageValue,
  useForecastRevenue,
  useTopClients,
  useStaleLeads,
  useOverdueTaskAlerts,
  useExpiringProposals,
  useReminders,
} from './opportunitySelectors';

// Alias cũ còn dùng ở useOpportunityStore — giữ để không break
export { useOverdueTaskAlerts as useOverdueTasks } from './opportunitySelectors';

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

  addOpportunity: (opp) => {
    set(s => ({ opportunities: [...s.opportunities, opp] }));
  },

  updateStatus: async (id, status) => {
    const prev = get().opportunities;
    set(s => ({
      opportunities: s.opportunities.map(o =>
        o.id === id ? { ...o, status, confidence: STAGE_DEFAULT_CONFIDENCE[status] } : o
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
    set(s => ({
      opportunities: s.opportunities.map(o => o.id === id ? { ...o, ...data } : o),
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
    set(s => ({ opportunities: s.opportunities.filter(o => o.id !== id) }));
    try {
      await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
    } catch {
      set({ opportunities: prev, error: 'Failed to delete' });
    }
  },
}));
