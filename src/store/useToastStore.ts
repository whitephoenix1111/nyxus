'use client';

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 3500
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push: (toast) => {
    const id = crypto.randomUUID();
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));

    // Auto-dismiss
    const duration = toast.duration ?? 3500;
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, duration);
  },

  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

// Shorthand helpers
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().push({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().push({ type: 'error', message, duration }),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().push({ type: 'warning', message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().push({ type: 'info', message, duration }),
};
