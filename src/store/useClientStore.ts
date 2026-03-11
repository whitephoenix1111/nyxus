'use client';

import { create } from 'zustand';
import { useMemo } from 'react';
import type { Client, ClientWithStats, Opportunity } from '@/types';

interface ClientStore {
  clients: Client[];
  isLoading: boolean;
  error: string | null;

  fetchClients: () => Promise<void>;
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  // addLead gọi POST /api/leads, nhận về { client, opportunity }
  // Caller tự append opportunity vào useOpportunityStore
  addLead: (data: { name: string; company: string; email?: string; phone?: string; value: number; notes?: string }) => Promise<{ clientId: string; opportunityId: string } | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
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

  // Tạo Lead qua /api/leads — tự sinh Client (isProspect: true) + Opportunity (Lead, 15%)
  // Returns { clientId, opportunityId } để caller append opportunity vào store riêng
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
      // Pessimistic: append client sau khi server confirm
      set((s) => ({ clients: [...s.clients, client] }));
      return { clientId: client.id, opportunityId: opportunity.id };
    } catch {
      set({ error: 'Failed to create lead' });
      return null;
    }
  },

  updateClient: async (id, data) => {
    const prev = get().clients;
    // Optimistic update
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
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    } catch {
      set({ clients: prev, error: 'Failed to delete client' });
    }
  },
}));

// ── Selectors ─────────────────────────────────────────────────────

/**
 * Join clients với opportunities bằng clientId (hard FK)
 * opportunities được truyền vào từ useOpportunityStore để tránh circular import
 */
export function useClientsWithStats(opportunities: Opportunity[]) {
  const clients = useClientStore((s) => s.clients);

  return useMemo((): ClientWithStats[] => {
    return clients.map((client) => {
      // Join bằng clientId — không join bằng company name
      const clientOpps = opportunities.filter((o) => o.clientId === client.id);

      const totalValue    = clientOpps.reduce((sum, o) => sum + o.value, 0);
      const forecastValue = clientOpps.reduce(
        (sum, o) => sum + o.value * (o.confidence / 100),
        0
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

/** Danh sách industries duy nhất để filter */
export function useClientIndustries() {
  const clients = useClientStore((s) => s.clients);
  return useMemo(
    () => Array.from(new Set(clients.map((c) => c.industry))).sort(),
    [clients]
  );
}

/** Top N clients theo totalValue */
export function useTopClientsByValue(opportunities: Opportunity[], limit = 5) {
  const withStats = useClientsWithStats(opportunities);
  return useMemo(
    () => [...withStats].sort((a, b) => b.totalValue - a.totalValue).slice(0, limit),
    [withStats, limit]
  );
}
