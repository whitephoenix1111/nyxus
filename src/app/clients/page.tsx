'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Plus, X, UserCheck } from 'lucide-react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useClientStore, useClientsWithStats, useClientIndustries } from '@/store/useClientStore';
import { formatCurrency } from '@/lib/utils';
import type { Client } from '@/types';
import { ClientCard } from './_components/ClientCard';
import { DetailPanel } from './_components/DetailPanel';
import { ClientFormModal } from './_components/ClientFormModal';
import { ExistingClientModal } from './_components/ExistingClientModal';
import { SearchInput, IndustrySelect } from './_components/FilterBar';
import { viIndustry } from './_components/_constants';

export default function ClientsPage() {
  const { opportunities, fetchOpportunities } = useOpportunityStore();
  const { fetchActivities } = useActivityStore();
  const { clients, isLoading, fetchClients, deleteClient, addClient, addExistingClient, updateClient } = useClientStore();

  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const industries = useClientIndustries();
  const clientsWithStats = useClientsWithStats(opportunities);

  useEffect(() => {
    fetchClients();
    fetchOpportunities();
  }, [fetchClients, fetchOpportunities]);

  const selectedClient = useMemo(
    () => clientsWithStats.find(c => c.id === selectedClientId) ?? null,
    [clientsWithStats, selectedClientId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = clientsWithStats;
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      viIndustry(c.industry).toLowerCase().includes(q)
    );
    if (industryFilter) list = list.filter(c => c.industry === industryFilter);
    return [...list].sort((a, b) => b.totalValue - a.totalValue);
  }, [clientsWithStats, search, industryFilter]);

  const totalRevenue = useMemo(() => clientsWithStats.reduce((s, c) => s + c.totalValue, 0), [clientsWithStats]);
  const totalOpps    = useMemo(() => clientsWithStats.reduce((s, c) => s + c.opportunityCount, 0), [clientsWithStats]);

  async function handleSaveEdit(data: Omit<Client, 'id' | 'createdAt'>) {
    if (!editingClient) return;
    await updateClient(editingClient.id, data);
  }

  const hasFilter = search || industryFilter;

  return (
    <div className="flex flex-col px-6 py-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Khách hàng</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
            {clients.length} khách hàng · {totalOpps} cơ hội
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <TrendingUp size={13} style={{ color: 'var(--color-brand)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Tổng pipeline</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <button onClick={() => setShowExistingModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 cursor-pointer">
            <UserCheck size={13} /> Khách hàng hiện có
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, công ty..."
        />
        <IndustrySelect
          value={industryFilter}
          onChange={setIndustryFilter}
          industries={industries}
        />
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setIndustryFilter(''); }}
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            <X size={11} /> Xóa filter
          </button>
        )}
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {filtered.length} kết quả
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2"
              style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>Không tìm thấy khách hàng nào.</p>
            {hasFilter ? (
              <button onClick={() => { setSearch(''); setIndustryFilter(''); }}
                className="text-xs hover:underline" style={{ color: 'var(--color-brand)' }}>
                Xóa bộ lọc
              </button>
            ) : (
              <button onClick={() => setShowExistingModal(true)}
                className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
                <UserCheck size={12} /> Thêm khách hàng hiện có
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4 pb-4">
            {filtered.map(client => (
              <ClientCard key={client.id} client={client} onClick={() => setSelectedClientId(client.id)} />
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <DetailPanel
          client={selectedClient}
          onClose={() => setSelectedClientId(null)}
          onDelete={async id => {
            const ok = await deleteClient(id);
            setSelectedClientId(null);
            if (ok) {
              fetchOpportunities();
              fetchActivities();
            }
          }}
          onEdit={() => setEditingClient(selectedClient)}
        />
      )}

      {showExistingModal && (
        <ExistingClientModal
          onClose={() => setShowExistingModal(false)}
          onSave={async (data) => {
            await addExistingClient(data);
            fetchOpportunities();
          }}
        />
      )}

      {editingClient && (
        <ClientFormModal
          mode="edit"
          initialData={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
