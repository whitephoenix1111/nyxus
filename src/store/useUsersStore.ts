'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { User } from '@/types';

interface UsersStore {
  users: User[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
  isLoading: false,

  fetchUsers: async () => {
    console.log('[useUsersStore] fetchUsers start');
    set({ isLoading: true });
    try {
      const res = await fetch('/api/users');
      const data: User[] = await res.json();
      console.log('[useUsersStore] fetchUsers done —', data.length, 'users:', data.map(u => `${u.id}(${u.role})`));
      set({ users: data, isLoading: false });
    } catch (err) {
      console.error('[useUsersStore] fetchUsers error:', err);
      set({ isLoading: false });
    }
  },
}));

// ── Selectors ─────────────────────────────────────────────────────

// Resolve ownerId → User object (hoặc null nếu không tìm thấy)
export function useUserById(id: string | undefined) {
  const users = useUsersStore(s => s.users);
  return useMemo(() => users.find(u => u.id === id) ?? null, [users, id]);
}

// Chỉ lấy salesperson — dùng cho dropdown Assign & filter
export function useSalespersons() {
  const users = useUsersStore(s => s.users);
  return useMemo(() => users.filter(u => u.role === 'salesperson'), [users]);
}
