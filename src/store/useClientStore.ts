'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Client, ClientWithStats, Opportunity } from '@/types';
import { computeClientTags } from '@/lib/computeClientTags';

interface ClientStore {
  clients: Client[];
  isLoading: boolean;
  error: string | null;

  fetchClients: () => Promise<void>;
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  addLead: (data: { name: string; company: string; email?: string; phone?: string; value: number; notes?: string }) => Promise<{ clientId: string; opportunityId: string } | null>;
  // Thêm khách hàng cũ (isProspect=false + Opportunity Won tự động)
  addExistingClient: (data: { name: string; company: string; email?: string; phone?: string; industry?: string; country?: string; website?: string; notes?: string; tags?: Client['tags']; value: number; contractDate?: string }) => Promise<{ clientId: string; opportunityId: string } | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  // Soft delete: đánh dấu archivedAt, không xóa khỏi DB
  deleteClient: (id: string) => Promise<boolean>;
  // Manager only: assign lead sang salesperson khác
  assignLead: (clientId: string, newOwnerId: string) => Promise<boolean>;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/clients');
      const data: Client[] = await res.json();
      set({ clients: data, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch clients', isLoading: false });
    }
  },

  addClient: async (data) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newClient: Client = await res.json();
      set((s) => ({ clients: [...s.clients, newClient] }));
    } catch {
      set({ error: 'Failed to add client' });
    }
  },

  addExistingClient: async (data) => {
    try {
      const res = await fetch('/api/clients/existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        set({ error: 'Failed to create existing client' });
        return null;
      }
      const { client, opportunity } = await res.json();
      set((s) => ({ clients: [...s.clients, client] }));
      return { clientId: client.id, opportunityId: opportunity.id };
    } catch {
      set({ error: 'Failed to create existing client' });
      return null;
    }
  },

  addLead: async (data) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        set({ error: 'Failed to create lead' });
        return null;
      }
      const { client, opportunity } = await res.json();
      set((s) => ({ clients: [...s.clients, client] }));
      return { clientId: client.id, opportunityId: opportunity.id };
    } catch {
      set({ error: 'Failed to create lead' });
      return null;
    }
  },

  updateClient: async (id, data) => {
    const prev = get().clients;
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      set({ clients: prev, error: 'Failed to update client' });
    }
  },

  deleteClient: async (id) => {
    const prev = get().clients;
    // Optimistic: xóa client khỏi UI ngay
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return true; // Caller sẽ refetch opportunities & activities
    } catch {
      set({ clients: prev, error: 'Failed to delete client' });
      return false;
    }
  },

  assignLead: async (clientId, newOwnerId) => {
    try {
      const res = await fetch(`/api/leads/${clientId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: newOwnerId }),
      });
      if (!res.ok) return false;
      // Cập nhật local state
      set((s) => ({
        clients: s.clients.map(c =>
          c.id === clientId ? { ...c, ownerId: newOwnerId } : c
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },
}));

// ── Selectors ─────────────────────────────────────────────────────

export function useClientsWithStats(opportunities: Opportunity[]) {
  const clients = useClientStore((s) => s.clients);

  return useMemo((): ClientWithStats[] => {
    // Chỉ hiển thị client thật (isProspect=false) và chưa bị archive
    const realClients = clients.filter(c => !c.isProspect && !c.archivedAt);
    return realClients.map((client) => {
      const clientOpps = opportunities.filter((o) => o.clientId === client.id);

      const totalValue    = clientOpps.reduce((sum, o) => sum + o.value, 0);
      const forecastValue = clientOpps.reduce(
        (sum, o) => sum + o.value * (o.confidence / 100), 0
      );

      const priority = ['Won', 'Negotiation', 'Proposal', 'Qualified', 'Lead', 'Lost'] as const;
      const topStatus = priority.find((s) => clientOpps.some((o) => o.status === s)) ?? null;

      return {
        ...client,
        opportunities: clientOpps,
        opportunityCount: clientOpps.length,
        totalValue,
        forecastValue,
        topStatus,
      };
    });
  }, [clients, opportunities]);
}

/**
 * Phase 12 — selector trả về ClientWithStats với tags đã merge computed.
 * Tags trong `client.tags` được replace bằng kết quả computeClientTags():
 *   - manual tags (enterprise, mid-market) giữ nguyên nếu có trong DB
 *   - computed tags (new-lead, warm, cold, priority) tính lại mỗi render
 */
export function useClientsWithComputedTags(opportunities: Opportunity[]) {
  const withStats = useClientsWithStats(opportunities);

  return useMemo((): ClientWithStats[] => {
    return withStats.map(client => ({
      ...client,
      tags: computeClientTags(client, opportunities),
    }));
  }, [withStats, opportunities]);
}

export function useClientIndustries() {
  const clients = useClientStore((s) => s.clients);
  return useMemo(
    () => Array.from(new Set(clients.map((c) => c.industry))).sort(),
    [clients]
  );
}

export function useTopClientsByValue(opportunities: Opportunity[], limit = 5) {
  const withStats = useClientsWithStats(opportunities);
  return useMemo(
    () => [...withStats].sort((a, b) => b.totalValue - a.totalValue).slice(0, limit),
    [withStats, limit]
  );
}
