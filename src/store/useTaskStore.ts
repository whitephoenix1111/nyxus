'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Task } from '@/types';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  toggleDone: (id: string) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/tasks');
      const data: Task[] = await res.json();
      set({ tasks: data, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch tasks', isLoading: false });
    }
  },

  addTask: async (data) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      set({ error: 'Failed to add task' });
      throw new Error('Failed to add task');
    }
    const newTask: Task = await res.json();
    set(s => ({ tasks: [newTask, ...s.tasks] }));
    return newTask;
  },

  toggleDone: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'pending' ? 'done' : 'pending';

    // Optimistic update
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === id ? { ...t, status: newStatus } : t
      ),
    }));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated: Task = await res.json();
      // Sync completedAt từ server
      set(s => ({
        tasks: s.tasks.map(t => t.id === id ? updated : t),
      }));
    } catch {
      // Rollback
      set(s => ({
        tasks: s.tasks.map(t => t.id === id ? task : t),
        error: 'Failed to update task',
      }));
    }
  },

  updateTask: async (id, data) => {
    const prev = get().tasks;
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) }));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      set({ tasks: prev, error: 'Failed to update task' });
    }
  },

  deleteTask: async (id) => {
    const prev = get().tasks;
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch {
      set({ tasks: prev, error: 'Failed to delete task' });
    }
  },
}));

// ── Selectors ─────────────────────────────────────────────────────

export function usePendingTasks() {
  const tasks = useTaskStore(s => s.tasks);
  return useMemo(() =>
    tasks.filter(t => t.status === 'pending'),
    [tasks]
  );
}

export function useOverdueTasks() {
  const tasks = useTaskStore(s => s.tasks);
  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t =>
      t.status === 'pending' && t.dueDate && t.dueDate < today
    );
  }, [tasks]);
}

export function useTasksForClient(clientId: string) {
  const tasks = useTaskStore(s => s.tasks);
  return useMemo(() =>
    tasks.filter(t => t.clientId === clientId),
    [tasks, clientId]
  );
}

export function useTasksForOpportunity(opportunityId: string) {
  const tasks = useTaskStore(s => s.tasks);
  return useMemo(() =>
    tasks.filter(t => t.opportunityId === opportunityId),
    [tasks, opportunityId]
  );
}
