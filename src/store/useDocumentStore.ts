// src/store/useDocumentStore.ts — Zustand store cho documents + selectors
//
// Pattern optimistic update (dùng nhất quán cho toggleStar, updateDocument, deleteDocument):
//   1. Lưu snapshot prev = get().documents
//   2. set() ngay với state mới (UI phản hồi tức thì)
//   3. Gọi API; nếu lỗi → set({ documents: prev }) để rollback
//
// addDocument không dùng optimistic vì cần id từ server để render đúng.
'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Document } from '@/types';

// Payload mà client gửi lên khi tạo document.
// `uploadedBy` bị bỏ vì server tự inject từ session JWT — client không được tự set
// để tránh giả mạo ownership. `id` và `uploadedAt` cũng do server sinh ra.
type AddDocumentPayload = Omit<Document, 'id' | 'uploadedAt' | 'uploadedBy'>;

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;

  fetchDocuments: () => Promise<void>;
  addDocument: (data: AddDocumentPayload) => Promise<Document>;
  toggleStar: (id: string) => Promise<void>;
  updateDocument: (id: string, data: Partial<Pick<Document, 'name' | 'category' | 'starred'>>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Document[] = await res.json();
      set({ documents: data, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch documents', isLoading: false });
    }
  },

  // addDocument: không optimistic — server gán id, uploadedBy, và uploadedAt.
  addDocument: async (data) => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      set({ error: err.error ?? 'Failed to add document' });
      throw new Error('Failed to add document');
    }
    const newDoc: Document = await res.json();
    // Thêm vào đầu danh sách (mới nhất lên trên)
    set(s => ({ documents: [newDoc, ...s.documents] }));
    return newDoc;
  },

  toggleStar: async (id) => {
    const doc = get().documents.find(d => d.id === id);
    if (!doc) return;
    const newStarred = !doc.starred;
    // Optimistic update — rollback nếu API lỗi (xem pattern ở file header)
    set(s => ({
      documents: s.documents.map(d =>
        d.id === id ? { ...d, starred: newStarred } : d
      ),
    }));
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: newStarred }),
      });
    } catch {
      set(s => ({
        documents: s.documents.map(d => d.id === id ? doc : d),
        error: 'Failed to update document',
      }));
    }
  },

  updateDocument: async (id, data) => {
    const prev = get().documents;
    // Optimistic update — rollback nếu API lỗi
    set(s => ({ documents: s.documents.map(d => d.id === id ? { ...d, ...data } : d) }));
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      set({ documents: prev, error: 'Failed to update document' });
    }
  },

  deleteDocument: async (id) => {
    const prev = get().documents;
    // Optimistic update — rollback nếu API lỗi
    set(s => ({ documents: s.documents.filter(d => d.id !== id) }));
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      set({ documents: prev, error: 'Failed to delete document' });
    }
  },
}));

// ── Selectors ─────────────────────────────────────────────────────────────────

/** Tất cả documents của một client, sort theo uploadedAt giảm dần. */
export function useDocumentsForClient(clientId: string) {
  const documents = useDocumentStore(s => s.documents);
  return useMemo(
    () => documents
      .filter(d => d.clientId === clientId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [documents, clientId]
  );
}

/** Documents gắn với một opportunity cụ thể. */
export function useDocumentsForOpportunity(opportunityId: string) {
  const documents = useDocumentStore(s => s.documents);
  return useMemo(
    () => documents.filter(d => d.opportunityId === opportunityId),
    [documents, opportunityId]
  );
}

/** Tất cả documents đã được star, dùng cho section "Quan trọng". */
export function useStarredDocuments() {
  const documents = useDocumentStore(s => s.documents);
  return useMemo(
    () => documents.filter(d => d.starred),
    [documents]
  );
}
