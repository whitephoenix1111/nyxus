'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Activity, ActivityType, ActivityOutcome } from '@/types';

interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;

  fetchActivities: () => Promise<void>;
  addActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<Activity | null>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  isLoading: false,
  error: null,

  fetchActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/activities');
      const data: Activity[] = await res.json();
      console.log('[useActivityStore] fetchActivities OK, count:', data.length);
      set({ activities: data, isLoading: false });
    } catch (err) {
      console.error('[useActivityStore] fetchActivities ERROR:', err);
      set({ error: 'Failed to fetch activities', isLoading: false });
    }
  },

  addActivity: async (data) => {
    console.log('[useActivityStore] addActivity → POST /api/activities', { clientId: data.clientId });
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // BUG TRACKER: Log chi tiết lỗi để biết 403 (role) hay 500 (server)
        const errBody = await res.text();
        console.error('[useActivityStore] addActivity FAILED — status:', res.status, '| body:', errBody);
        set({ error: 'Failed to add activity' });
        return null;
      }

      const newAct: Activity = await res.json();
      console.log('[useActivityStore] addActivity OK — id:', newAct.id, '| clientId:', newAct.clientId);

      // Optimistic prepend — activity mới lên đầu danh sách
      set(s => {
        const next = [newAct, ...s.activities];
        console.log('[useActivityStore] store updated, total:', next.length);
        return { activities: next };
      });
      return newAct;
    } catch (err) {
      console.error('[useActivityStore] addActivity EXCEPTION:', err);
      set({ error: 'Failed to add activity' });
      return null;
    }
  },

  updateActivity: async (id, data) => {
    const prev = get().activities;
    set(s => ({ activities: s.activities.map(a => a.id === id ? { ...a, ...data } : a) }));
    try {
      await fetch(`/api/activities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      set({ activities: prev, error: 'Failed to update activity' });
    }
  },

  deleteActivity: async (id) => {
    const prev = get().activities;
    set(s => ({ activities: s.activities.filter(a => a.id !== id) }));
    try {
      await fetch(`/api/activities/${id}`, { method: 'DELETE' });
    } catch {
      set({ activities: prev, error: 'Failed to delete activity' });
    }
  },
}));

// ── Selectors ─────────────────────────────────────────────────────

export function useActivitiesByType() {
  const acts = useActivityStore(s => s.activities);
  return useMemo(() => {
    const counts: Record<ActivityType, number> = { call: 0, email: 0, meeting: 0, demo: 0, note: 0 };
    acts.forEach(a => counts[a.type]++);
    return counts;
  }, [acts]);
}

export function useActivitiesByOutcome() {
  const acts = useActivityStore(s => s.activities);
  return useMemo(() => {
    const counts: Record<ActivityOutcome, number> = { positive: 0, neutral: 0, negative: 0 };
    acts.forEach(a => counts[a.outcome]++);
    return counts;
  }, [acts]);
}

export function useRecentActivities(limit = 10) {
  const acts = useActivityStore(s => s.activities);
  return useMemo(() =>
    [...acts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit),
    [acts, limit]
  );
}

export function useActivitiesForClient(clientId: string) {
  const acts = useActivityStore(s => s.activities);
  return useMemo(() =>
    acts.filter(a => a.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [acts, clientId]
  );
}

/**
 * Tính ngày liên hệ gần nhất từ activities — thay thế opp.lastContactDate đã xóa.
 * Nếu truyền opportunityId thì filter thêm theo opp — dùng trong detail panel.
 * Nếu chỉ truyền clientId thì lấy MAX của toàn bộ activities của client.
 * @returns ISO date string hoặc null nếu chưa có activity nào
 */
export function useLastContactDate(clientId: string, opportunityId?: string): string | null {
  const acts = useActivityStore(s => s.activities);
  return useMemo(() => {
    const filtered = acts.filter(a =>
      a.clientId === clientId &&
      (opportunityId === undefined || a.opportunityId === opportunityId)
    );
    if (filtered.length === 0) return null;
    return filtered.reduce((latest, a) =>
      a.date > latest ? a.date : latest,
      filtered[0].date
    );
  }, [acts, clientId, opportunityId]);
}
