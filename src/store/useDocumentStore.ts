'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Document } from '@/types';

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;

  fetchDocuments: () => Promise<void>;
  addDocument: (data: Omit<Document, 'id' | 'uploadedAt'>) => Promise<Document>;
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
    set(s => ({ documents: [newDoc, ...s.documents] }));
    return newDoc;
  },

  toggleStar: async (id) => {
    const doc = get().documents.find(d => d.id === id);
    if (!doc) return;

    const newStarred = !doc.starred;

    // Optimistic update
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
      // Rollback
      set(s => ({
        documents: s.documents.map(d => d.id === id ? doc : d),
        error: 'Failed to update document',
      }));
    }
  },

  updateDocument: async (id, data) => {
    const prev = get().documents;
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
    // Optimistic update
    set(s => ({ documents: s.documents.filter(d => d.id !== id) }));
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      set({ documents: prev, error: 'Failed to delete document' });
    }
  },
}));

// ── Selectors ─────────────────────────────────────────────────────

export function useDocumentsForClient(clientId: string) {
  const documents = useDocumentStore(s => s.documents);
  return useMemo(
    () => documents
      .filter(d => d.clientId === clientId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [documents, clientId]
  );
}

export function useDocumentsForOpportunity(opportunityId: string) {
  const documents = useDocumentStore(s => s.documents);
  return useMemo(
    () => documents.filter(d => d.opportunityId === opportunityId),
    [documents, opportunityId]
  );
}

export function useStarredDocuments() {
  const documents = useDocumentStore(s => s.documents);
  return useMemo(
    () => documents.filter(d => d.starred),
    [documents]
  );
}
