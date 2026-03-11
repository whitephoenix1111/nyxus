'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, X, AlertTriangle, Search } from 'lucide-react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useClientStore } from '@/store/useClientStore';
import { useActivityStore } from '@/store/useActivityStore';
import { formatCurrencyFull } from '@/lib/utils';
import type { Opportunity, OpportunityStatus } from '@/types';
import { LeadModal, emptyLeadForm, type LeadFormState } from '@/components/leads/LeadModal';
import { PromoteModal } from '@/components/leads/PromoteModal';
import { LeadCard, daysSince } from '@/components/leads/LeadCard';

export default function LeadsPage() {
  const { opportunities, fetchOpportunities, isLoading, addOpportunity, updateOpportunity, updateStatus, deleteOpportunity } = useOpportunityStore();
  const { addLead } = useClientStore();
  const { activities, fetchActivities } = useActivityStore();

  const [search, setSearch]             = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [editTarget, setEditTarget]     = useState<Opportunity | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<Opportunity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortStale, setSortStale]       = useState(true);

  useEffect(() => {
    fetchOpportunities();
    fetchActivities();
  }, [fetchOpportunities, fetchActivities]);

  const leads = useMemo(() => {
    let list = opportunities.filter(o => o.status === 'Lead');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => o.clientName.toLowerCase().includes(q) || o.company.toLowerCase().includes(q));
    }
    if (sortStale) {
      list = [...list].sort((a, b) => new Date(a.lastContactDate).getTime() - new Date(b.lastContactDate).getTime());
    }
    return list;
  }, [opportunities, search, sortStale]);

  const staleCount = useMemo(() => leads.filter(o => daysSince(o.lastContactDate) > 3).length, [leads]);
  const totalValue = useMemo(() => leads.reduce((s, o) => s + o.value, 0), [leads]);

  // DELTA-3 bước 7: dùng addLead → POST /api/leads → tạo Client + Opportunity đồng thời
  const handleAdd = async (form: LeadFormState) => {
    const result = await addLead({
      name:    form.clientName,
      company: form.company,
      value:   Number(form.value),
      notes:   form.notes,
    });
    if (result) {
      // Fetch lại opportunities để lấy opportunity mới có clientId đúng
      await fetchOpportunities();
    }
    setShowAdd(false);
  };

  const handleEdit = (form: LeadFormState) => {
    if (!editTarget) return;
    updateOpportunity(editTarget.id, {
      clientName:      form.clientName,
      company:         form.company,
      value:           Number(form.value),
      date:            form.date,
      lastContactDate: form.lastContactDate,
      notes:           form.notes,
    });
    setEditTarget(null);
  };

  // DELTA-3 bước 7: promote gọi updateStatus — confidence tự nhảy về default trong store
  const handlePromote = (status: OpportunityStatus) => {
    if (!promoteTarget) return;
    updateStatus(promoteTarget.id, status);
    setPromoteTarget(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] px-6 py-5 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Tiềm năng</h1>
          <p className="text-sm text-[#555] mt-0.5">
            {leads.length} lead · {formatCurrencyFull(totalValue)} tổng giá trị
            {staleCount > 0 && <span className="ml-2 text-[#EF4444]">· {staleCount} cần liên hệ</span>}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[#DFFF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors">
          <Plus size={15} /> Thêm lead
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            className="w-56 rounded-xl border border-[#222] bg-[#111] pl-8 pr-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#DFFF00] focus:outline-none transition-colors"
            placeholder="Tìm kiếm..." value={search}
            onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
        <button onClick={() => setSortStale(s => !s)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
            sortStale ? 'border-[#DFFF0044] bg-[#DFFF0010] text-[#DFFF00]' : 'border-[#222] text-[#555] hover:text-[#888]'
          }`}>
          <AlertTriangle size={12} /> Ưu tiên nguội nhất
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-[#DFFF00]" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111]">
            <span className="text-2xl text-[#DFFF00]">◱</span>
          </div>
          <p className="text-white font-medium">Chưa có lead nào</p>
          <p className="mt-1 text-sm text-[#555]">Bắt đầu bằng cách thêm lead đầu tiên.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {leads.map(opp => (
              <LeadCard
                key={opp.id}
                opp={opp}
                deleteConfirm={deleteConfirm}
                onPromote={setPromoteTarget}
                onEdit={setEditTarget}
                onDeleteRequest={setDeleteConfirm}
                onDeleteConfirm={id => { deleteOpportunity(id); setDeleteConfirm(null); }}
                onDeleteCancel={() => setDeleteConfirm(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <LeadModal title="Thêm lead mới" initial={emptyLeadForm()}
          onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editTarget && (
        <LeadModal
          title="Chỉnh sửa lead"
          initial={{
            clientName: editTarget.clientName, company: editTarget.company,
            avatar: editTarget.avatar, value: String(editTarget.value),
            confidence: String(editTarget.confidence), date: editTarget.date,
            lastContactDate: editTarget.lastContactDate,
            notes: editTarget.notes ?? '', status: editTarget.status,
          }}
          onClose={() => setEditTarget(null)} onSave={handleEdit}
        />
      )}
      {promoteTarget && (
        <PromoteModal opp={promoteTarget}
          onClose={() => setPromoteTarget(null)}
          onPromote={handlePromote} />
      )}
    </div>
  );
}
