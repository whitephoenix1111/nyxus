// src/app/leads/useLeadsPage.ts — Hook tập trung toàn bộ state & logic của LeadsPage.

import { useEffect, useState, useMemo } from 'react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useClientStore } from '@/store/useClientStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCurrentUser, useIsManager } from '@/store/useAuthStore';
import { useUsersStore } from '@/store/useUsersStore';
import { useDataStore } from '@/store/useDataStore';
import { computeClientTags } from '@/lib/computeClientTags';
import { emptyLeadForm, type LeadFormState } from '@/components/leads/LeadModal';
import type { Opportunity, OpportunityStatus } from '@/types';

const ACTIVE_STATUSES: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation'];
const STALE_THRESHOLD_DAYS = 3;

/** Số ngày kể từ một ngày ISO string đến hôm nay. */
function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function useLeadsPage() {
  const currentUser = useCurrentUser();
  const isManager   = useIsManager();

  const { opportunities, fetchOpportunities, isLoading, updateOpportunity, updateStatus, deleteOpportunity } = useOpportunityStore();
  const { clients, addLead, fetchClients, assignLead } = useClientStore();
  const { activities, fetchActivities } = useActivityStore();
  const { tasks, fetchTasks, addTask } = useTaskStore();
  const { fetchUsers } = useUsersStore();
  const { bootstrapped, invalidate } = useDataStore();

  const [search, setSearch]               = useState('');
  const [tab, setTab]                     = useState<'active' | 'lost'>('active');
  const [showAdd, setShowAdd]             = useState(false);
  const [editTarget, setEditTarget]       = useState<Opportunity | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<Opportunity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortStale, setSortStale]         = useState(true);
  const [assignTarget, setAssignTarget]   = useState<Opportunity | null>(null);
  const [ownerFilter, setOwnerFilter]     = useState('');
  // Guard chống double-submit: true khi đang chờ POST /api/leads trả về
  const [isSubmitting, setIsSubmitting]   = useState(false);

  useEffect(() => {
    if (bootstrapped) return;
    fetchOpportunities();
    fetchActivities();
    fetchClients();
    fetchTasks();
    fetchUsers();
  }, [bootstrapped, fetchOpportunities, fetchActivities, fetchClients, fetchTasks, fetchUsers]);

  // ── lastContactDate per client — tính từ MAX(activities.date) ────────────
  // Thay thế opp.lastContactDate đã xóa khỏi schema
  const lastContactByClient = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach(a => {
      const prev = map.get(a.clientId);
      if (!prev || a.date > prev) map.set(a.clientId, a.date);
    });
    return map;
  }, [activities]);

  // ── Leads đang theo dõi (tab active) ─────────────────────────────────────
  // Filter: opp active stage + client chưa archived + ownership
  const leads = useMemo(() => {
    let list = opportunities.filter(o => {
      if (!ACTIVE_STATUSES.includes(o.status)) return false;
      const client = clients.find(c => c.id === o.clientId);
      // Chỉ hiện opp có client còn tồn tại và chưa archived
      if (!client || client.archivedAt) return false;
      // Client status 'active' = có opp không phải Won/Lost — đây chính là leads
      if (!isManager && o.ownerId !== currentUser?.id) return false;
      return true;
    });

    if (ownerFilter) list = list.filter(o => o.ownerId === ownerFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      // Search trên title + tên/company của client
      list = list.filter(o => {
        if (o.title.toLowerCase().includes(q)) return true;
        const client = clients.find(c => c.id === o.clientId);
        return client?.name.toLowerCase().includes(q) || client?.company.toLowerCase().includes(q);
      });
    }

    if (sortStale) {
      // Sắp xếp theo lastContact cũ nhất lên đầu (nguội nhất)
      list = [...list].sort((a, b) => {
        const da = lastContactByClient.get(a.clientId) ?? a.date;
        const db = lastContactByClient.get(b.clientId) ?? b.date;
        return new Date(da).getTime() - new Date(db).getTime();
      });
    }

    return list;
  }, [opportunities, clients, isManager, currentUser, ownerFilter, search, sortStale, lastContactByClient]);

  // ── Leads thất bại (tab lost) ─────────────────────────────────────────────
  const lostLeads = useMemo(() => {
    let list = opportunities.filter(o => {
      if (o.status !== 'Lost') return false;
      const client = clients.find(c => c.id === o.clientId);
      if (!client || client.archivedAt) return false;
      if (!isManager && o.ownerId !== currentUser?.id) return false;
      return true;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => {
        if (o.title.toLowerCase().includes(q)) return true;
        const client = clients.find(c => c.id === o.clientId);
        return client?.name.toLowerCase().includes(q) || client?.company.toLowerCase().includes(q);
      });
    }

    return [...list].sort((a, b) => {
      const da = lastContactByClient.get(a.clientId) ?? a.date;
      const db = lastContactByClient.get(b.clientId) ?? b.date;
      return new Date(db).getTime() - new Date(da).getTime();
    });
  }, [opportunities, clients, isManager, currentUser, search, lastContactByClient]);

  // ── Badge & tags ──────────────────────────────────────────────────────────
  const pendingClientIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(t => { if (t.status === 'pending') ids.add(t.clientId); });
    return ids;
  }, [tasks]);

  const clientTagsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeClientTags>>();
    clients.forEach(client => {
      const clientOpps = opportunities.filter(o => o.clientId === client.id);
      map.set(client.id, computeClientTags(client, clientOpps, activities));
    });
    return map;
  }, [clients, opportunities, activities]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const staleCount = useMemo(() => {
    return leads.filter(o => {
      const lastContact = lastContactByClient.get(o.clientId) ?? o.date;
      return daysSince(lastContact) > STALE_THRESHOLD_DAYS;
    }).length;
  }, [leads, lastContactByClient]);

  const totalValue = useMemo(
    () => leads.reduce((s, o) => s + o.value, 0),
    [leads]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = async (form: LeadFormState) => {
    // Guard: bỏ qua nếu đang submit — tránh double-click tạo duplicate
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await addLead({
        name:     form.clientName,
        company:  form.company,
        email:    form.email,
        industry: form.industry,
        value:    Number(form.value),
        notes:    form.notes,
        // title do user nhập — không để API fallback sinh string vô nghĩa
        title:    form.title,
        // Manager: ownerId là salesperson được chọn. Salesperson: '' → không truyền → API dùng session.id
        ownerId:  form.ownerId || undefined,
      });

      // addLead() đã sync client + opportunity vào store ngay (addClient + addOpportunity).
      // Không cần invalidate(['clients','opportunities']) ở đây — tránh refetch thừa.

      if (result && form.firstTaskTitle.trim()) {
        await addTask({
          title: form.firstTaskTitle.trim(),
          clientId: result.clientId,
          opportunityId: result.opportunityId,
          dueDate: form.firstTaskDate || undefined,
          status: 'pending',
          company: undefined,
        });
        // Task chưa được sync optimistic vào store → invalidate để refetch
        await invalidate(['tasks']);
      }

      if (result) setShowAdd(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (form: LeadFormState) => {
    if (!editTarget) return;
    updateOpportunity(editTarget.id, {
      title:  form.title,
      value:  Number(form.value),
      date:   form.date,
      notes:  form.notes,
    });
    setEditTarget(null);
  };

  const handlePromote = async (status: OpportunityStatus) => {
    if (!promoteTarget) return;
    await updateStatus(promoteTarget.id, status);
    if (status === 'Won') await invalidate(['clients', 'opportunities']);
    setPromoteTarget(null);
  };

  const handleReopen = async (id: string) => {
    await updateStatus(id, 'Lead');
  };

  return {
    leads, lostLeads, pendingClientIds, clientTagsMap,
    staleCount, totalValue, isLoading,
    search, setSearch,
    tab, setTab,
    showAdd, setShowAdd,
    editTarget, setEditTarget,
    promoteTarget, setPromoteTarget,
    deleteConfirm, setDeleteConfirm,
    sortStale, setSortStale,
    assignTarget, setAssignTarget,
    ownerFilter, setOwnerFilter,
    isSubmitting,
    handleAdd, handleEdit, handlePromote, handleReopen,
    deleteOpportunity, updateStatus, fetchClients, assignLead, fetchOpportunities,
    currentUser, isManager,
    emptyLeadForm,
    clients, // expose để page lấy client info khi cần
    lastContactByClient,
  };
}
