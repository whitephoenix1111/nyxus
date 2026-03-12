// src/store/useAuthStore.ts
// Client-side auth state — sync với server session qua /api/auth/me
// Không lưu token ở đây (token nằm trong httpOnly cookie)

import { create } from 'zustand';
import type { SessionUser } from '@/types';

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;

  // Gọi khi app mount — fetch session từ server
  fetchSession: () => Promise<void>;

  // Gọi sau khi login thành công
  setUser: (user: SessionUser) => void;

  // Gọi khi logout
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  isLoading: true,

  fetchSession: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const user: SessionUser = await res.json();
        set({ user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  setUser:   (user) => set({ user, isLoading: false }),
  clearUser: ()     => set({ user: null, isLoading: false }),
}));

// ── Selectors ─────────────────────────────────────────────────────
export const useCurrentUser  = () => useAuthStore((s) => s.user);
export const useIsManager    = () => useAuthStore((s) => s.user?.role === 'manager');
export const useIsSalesperson = () => useAuthStore((s) => s.user?.role === 'salesperson');
export const useAuthLoading  = () => useAuthStore((s) => s.isLoading);
