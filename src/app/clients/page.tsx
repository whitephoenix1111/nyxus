// src/app/clients/page.tsx — Trang danh sách khách hàng
//
// Chỉ hiển thị client KHÔNG có opp active (status = 'won' | 'no-deal').
// Client có ≥1 opp active thuộc về /leads — không hiển thị ở đây.
// Sales thấy client của mình; Manager thấy tất cả và có thêm OwnerFilter.

'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, X, UserCheck, Archive } from 'lucide-react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useClientStore, useClientsWithComputedTags, useClientIndustries } from '@/store/useClientStore';
import { useDataStore } from '@/store/useDataStore';
import { formatCurrency } from '@/lib/utils';
import type { Client } from '@/types';
import { ClientCard } from '@/components/clients/ClientCard';
import { DetailPanel } from '@/components/clients/DetailPanel';
import { ClientFormModal, type ClientFormData } from '@/components/clients/ClientFormModal';
import { ExistingClientModal } from '@/components/clients/ExistingClientModal';
import { SearchInput, IndustrySelect } from '@/components/clients/FilterBar';
import { viIndustry } from '@/components/clients/_constants';
import { useCurrentUser, useIsManager } from '@/store/useAuthStore';
import { useUsersStore } from '@/store/useUsersStore';
import { OwnerFilter } from '@/components/ui/OwnerFilter';

export default function ClientsPage() {
  const currentUser = useCurrentUser();
  const isManager   = useIsManager();
  const { fetchUsers } = useUsersStore();

  const { opportunities, fetchOpportunities, removeByClientId } = useOpportunityStore();
  const { activities, fetchActivities } = useActivityStore();
  const { clients, isLoading, fetchClients, deleteClient, addExistingClient, updateClient } = useClientStore();
  const { bootstrapped, invalidate } = useDataStore();

  const [search, setSearch]                     = useState('');
  const [industryFilter, setIndustryFilter]     = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [editingClient, setEditingClient]       = useState<Client | null>(null);
  const [ownerFilter, setOwnerFilter]           = useState('');
  const [showArchived, setShowArchived]         = useState(false);

  const industries = useClientIndustries();
  const allClientsWithStats = useClientsWithComputedTags(opportunities, activities);

  // Scope theo role: sales chỉ thấy client của mình
  const ownedClients = isManager
    ? allClientsWithStats
    : allClientsWithStats.filter(c => c.ownerId === currentUser?.id);

  // Archived clients lấy thẳng từ raw store vì useClientsWithComputedTags đã filter !archivedAt.
  // Build ClientWithStats thủ công để ClientCard nhận đúng type.
  const rawClients = useClientStore(s => s.clients);
  const archivedClients = useMemo(() => {
    const base = rawClients.filter(c => !!c.archivedAt && (isManager || c.ownerId === currentUser?.id));
    return base.map(c => ({
      ...c,
      tags:             c.tags ?? [],
      opportunities:    opportunities.filter(o => o.clientId === c.id),
      opportunityCount: opportunities.filter(o => o.clientId === c.id).length,
      totalValue:       opportunities.filter(o => o.clientId === c.id).reduce((s, o) => s + o.value, 0),
      forecastValue:    opportunities.filter(o => o.clientId === c.id).reduce((s, o) => s + o.value * (o.confidence / 100), 0),
      topStatus:        null,
    }));
  }, [rawClients, opportunities, isManager, currentUser]);

  // Chỉ fetch khi DataProvider chưa bootstrap — tránh fetch thừa khi navigate
  useEffect(() => {
    if (bootstrapped) return;
    fetchClients();
    fetchOpportunities();
    fetchUsers();
  }, [bootstrapped, fetchClients, fetchOpportunities, fetchUsers]);

  const selectedClient = useMemo(
    () => [...ownedClients, ...archivedClients].find(c => c.id === selectedClientId) ?? null,
    [ownedClients, archivedClients, selectedClientId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // showArchived: hiển archived clients — lấy từ archivedClients (raw store)
    // Mặc định: chỉ hiện active clients không có opp đang mở.
    let list = showArchived
      ? (ownerFilter ? archivedClients.filter(c => c.ownerId === ownerFilter) : archivedClients)
      : (() => {
          const active = ownerFilter ? ownedClients.filter(c => c.ownerId === ownerFilter) : ownedClients;
          // Chỉ hiện client đã có ít nhất 1 opp Won và không có opp đang active.
          // Client chỉ có Lost / no-deal → không hiện ở đây (chưa chốt được đọn nào).
          // Client có opp đang chạy → thuộc /leads.
          return active.filter(c => {
            const clientOpps = opportunities.filter(o => o.clientId === c.id);
            const hasWon    = clientOpps.some(o => o.status === 'Won');
            const hasActive = clientOpps.some(o => o.status !== 'Won' && o.status !== 'Lost');
            return hasWon && !hasActive;
          });
        })();

    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      viIndustry(c.industry).toLowerCase().includes(q)
    );

    if (industryFilter) list = list.filter(c => c.industry === industryFilter);
    return [...list].sort((a, b) => b.totalValue - a.totalValue);
  }, [ownedClients, archivedClients, opportunities, ownerFilter, search, industryFilter, showArchived]);

  const totalRevenue = useMemo(
    () => filtered.reduce((s, c) => s + c.totalValue, 0),
    [filtered]
  );
  const totalOpps = useMemo(
    () => filtered.reduce((s, c) => s + c.opportunityCount, 0),
    [filtered]
  );

  const canCreate = currentUser?.role === 'salesperson';
  const hasFilter = search || industryFilter;

  async function handleSaveEdit(data: ClientFormData) {
    if (!editingClient) return;
    await updateClient(editingClient.id, {
      ...data,
      ownerId: editingClient.ownerId,
    });
  }

  return (
    <div className="flex flex-col px-6 py-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Khách hàng</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
            {filtered.length} khách hàng · {totalOpps} cơ hội
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
          {canCreate && (
            <button onClick={() => setShowExistingModal(true)}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 cursor-pointer">
              <UserCheck size={13} /> Khách hàng hiện có
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, công ty..." />
        <IndustrySelect value={industryFilter} onChange={setIndustryFilter} industries={industries} />
        {/* Toggle hiển thị archived — theo pattern HubSpot/Pipedrive */}
        <button
          onClick={() => setShowArchived(v => !v)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
          style={{
            background: showArchived ? 'var(--color-brand-subtle, #DFFF0022)' : 'var(--color-surface)',
            border:     `1px solid ${showArchived ? 'var(--color-brand)' : 'var(--color-border)'}`,
            color:      showArchived ? 'var(--color-brand)' : 'var(--color-text-subtle)',
          }}>
          <Archive size={13} />
          Đã lưu trữ
          {archivedClients.length > 0 && (
            <span className="tabular-nums" style={{ color: showArchived ? 'var(--color-brand)' : 'var(--color-text-faint)' }}>
              {archivedClients.length}
            </span>
          )}
        </button>
        <OwnerFilter value={ownerFilter} onChange={setOwnerFilter} />
        {hasFilter && (
          <button onClick={() => { setSearch(''); setIndustryFilter(''); }}
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: 'var(--color-text-subtle)' }}>
            <X size={11} /> Xóa filter
          </button>
        )}
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {filtered.length} kết quả
        </span>
      </div>

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
              <ClientCard
                key={client.id}
                client={client}
                archived={!!client.archivedAt}
                onClick={() => setSelectedClientId(client.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <DetailPanel
          client={selectedClient}
          canEdit={isManager || selectedClient.ownerId === currentUser?.id}
          onClose={() => setSelectedClientId(null)}
          onDelete={async id => {
            const ok = await deleteClient(id);
            setSelectedClientId(null);
            if (ok) {
              removeByClientId(id);
              await invalidate(['clients', 'opportunities', 'activities', 'tasks']);
            }
          }}
          onRestore={async id => {
            // null → API xóa field archivedAt khỏi record (undefined bị JSON.stringify bỏ qua)
            await updateClient(id, { archivedAt: null } as Partial<Client> & { archivedAt: null });
            setSelectedClientId(null);
            // invalidate cả opportunities — vì khi archive đã gọi removeByClientId()
            // xóa opps khỏi store, restore phải fetch lại để opps hiện trở lại ở /opportunities
            await invalidate(['clients', 'opportunities']);
          }}
          onEdit={() => setEditingClient(selectedClient)}
        />
      )}

      {showExistingModal && (
        <ExistingClientModal
          onClose={() => setShowExistingModal(false)}
          onSave={async (data) => {
            await addExistingClient(data);
            await invalidate(['clients', 'opportunities']);
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
