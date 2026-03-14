// src/store/useDataStore.ts — Global data bootstrap & invalidation
//
// Giải quyết vấn đề kiến trúc: trước đây mỗi trang tự fetch độc lập khi mount,
// dẫn đến store không đồng bộ khi trang khác thay đổi data (vd: xóa client
// ở /clients nhưng /opportunities vẫn hiển thị opps cũ).
//
// Giải pháp:
//   1. DataProvider (mount 1 lần ở layout) fetch tất cả stores sau khi login
//   2. Mọi trang dùng data từ store — không tự gọi fetch khi mount nữa
//   3. Sau mutate (create/update/delete), gọi invalidate() để refetch đúng resource
//
// invalidate(resources[]) — refetch có chọn lọc, tránh refetch thừa:
//   invalidate(['opportunities'])           → chỉ refetch opps
//   invalidate(['clients', 'opportunities']) → refetch cả hai
//   invalidate('all')                       → refetch toàn bộ

'use client';

import { create } from 'zustand';
import { useClientStore } from './useClientStore';
import { useOpportunityStore } from './useOpportunityStore';
import { useActivityStore } from './useActivityStore';
import { useTaskStore } from './useTaskStore';
import { useDocumentStore } from './useDocumentStore';
import { useUsersStore } from './useUsersStore';

export type DataResource = 'clients' | 'opportunities' | 'activities' | 'tasks' | 'documents' | 'users';

interface DataStore {
  bootstrapped: boolean;
  // Gọi một lần sau khi user login — fetch tất cả resources song song
  bootstrap: () => Promise<void>;
  // Refetch có chọn lọc sau mutate — gọi với danh sách resource bị ảnh hưởng
  invalidate: (resources: DataResource[] | 'all') => Promise<void>;
}

export const useDataStore = create<DataStore>(() => ({
  bootstrapped: false,

  bootstrap: async () => {
    // Fetch tất cả song song — không blocking nhau
    await Promise.all([
      useUsersStore.getState().fetchUsers(),
      useClientStore.getState().fetchClients(),
      useOpportunityStore.getState().fetchOpportunities(),
      useActivityStore.getState().fetchActivities(),
      useTaskStore.getState().fetchTasks(),
      useDocumentStore.getState().fetchDocuments(),
    ]);
    useDataStore.setState({ bootstrapped: true });
  },

  invalidate: async (resources) => {
    const all: DataResource[] = ['clients', 'opportunities', 'activities', 'tasks', 'documents', 'users'];
    const targets = resources === 'all' ? all : resources;

    const fetchers: Record<DataResource, () => Promise<void>> = {
      clients:       useClientStore.getState().fetchClients,
      opportunities: useOpportunityStore.getState().fetchOpportunities,
      activities:    useActivityStore.getState().fetchActivities,
      tasks:         useTaskStore.getState().fetchTasks,
      documents:     useDocumentStore.getState().fetchDocuments,
      users:         useUsersStore.getState().fetchUsers,
    };

    await Promise.all(targets.map(r => fetchers[r]()));
  },
}));
