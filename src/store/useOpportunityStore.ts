// src/store/useOpportunityStore.ts — Zustand store cho opportunities + re-export selectors
'use client';

import { create } from 'zustand';
import type { Opportunity, OpportunityStatus } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

// ── Re-export selectors ───────────────────────────────────────────────────────
// Selectors được tách ra opportunitySelectors.ts để tránh circular dependency
// (selectors import store, store không import selectors ngược lại).
// Re-export tại đây để các component cũ import từ useOpportunityStore vẫn hoạt động
// mà không cần thay đổi import path — backward-compatible.
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

// Alias cũ: một số component import useOverdueTasks thay vì useOverdueTaskAlerts.
// Giữ alias này để không break — không đổi tên ở call site.
export { useOverdueTaskAlerts as useOverdueTasks } from './opportunitySelectors';

// ── Store ─────────────────────────────────────────────────────────────────────

interface OpportunityStore {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;
  fetchOpportunities: () => Promise<void>;
  addOpportunity: (opp: Opportunity) => void;
  updateStatus: (id: string, status: OpportunityStatus) => Promise<void>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
  // Xóa tất cả opportunities của một client khỏi store ngay lập tức (không gọi API).
  // Dùng sau khi deleteClient thành công — API đã cascade xóa opps chưa Won trên DB,
  // store cần đồng bộ ngay để /opportunities page cập nhật mà không cần refetch.
  // Won opps vẫn giữ trong DB nhưng bị loại khỏi store vì client đã archived —
  // chúng sẽ trở lại nếu fetchOpportunities() được gọi lại, nhưng thực tế
  // client archived thì các trang đều lọc theo client.archivedAt nên không hiển thị.
  removeByClientId: (clientId: string) => void;
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
    const opp  = prev.find(o => o.id === id);
    if (!opp) return;

    const today = new Date().toISOString().split('T')[0];

    // Append entry mới vào statusHistory — append-only, không xóa lịch sử cũ.
    // activityId không có ở đây vì promote từ PromoteModal không đi qua Activity.
    // Nếu promote từ AddActivityModal (promoteOpportunityTo), activityId được set ở API layer.
    const updatedHistory: Opportunity['statusHistory'] = [
      ...(opp.statusHistory ?? []),
      { from: opp.status, to: status, date: today },
    ];

    const newConfidence = STAGE_DEFAULT_CONFIDENCE[status];

    // Optimistic update: apply cả status, confidence, và statusHistory ngay lập tức
    set(s => ({
      opportunities: s.opportunities.map(o =>
        o.id === id
          ? { ...o, status, confidence: newConfidence, statusHistory: updatedHistory }
          : o
      ),
    }));

    try {
      await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          confidence:    newConfidence,
          statusHistory: updatedHistory,
        }),
      });
    } catch {
      // Rollback về state trước khi optimistic update
      set({ opportunities: prev, error: 'Failed to update status' });
    }
  },

  updateOpportunity: async (id, data) => {
    const prev = get().opportunities;
    // Optimistic update — rollback nếu API lỗi
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
    // Optimistic update — rollback nếu API lỗi
    set(s => ({ opportunities: s.opportunities.filter(o => o.id !== id) }));
    try {
      await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
    } catch {
      set({ opportunities: prev, error: 'Failed to delete' });
    }
  },

  // Xóa ngay lập tức khỏi store — không gọi API vì API đã cascade khi deleteClient
  removeByClientId: (clientId) => {
    set(s => ({
      opportunities: s.opportunities.filter(o => o.clientId !== clientId),
    }));
  },
}));
