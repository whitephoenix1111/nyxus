'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Activity, ActivityType, ActivityOutcome } from '@/types';

interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;

  fetchActivities: () => Promise<void>;
  addActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
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
      set({ activities: data, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch activities', isLoading: false });
    }
  },

  addActivity: async (data) => {
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newAct: Activity = await res.json();
      set(s => ({ activities: [newAct, ...s.activities] }));
    } catch {
      set({ error: 'Failed to add activity' });
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
