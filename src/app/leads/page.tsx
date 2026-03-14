// src/app/leads/page.tsx — Trang Leads pipeline
// Tab "Đang theo dõi": Lead → Qualified → Proposal → Negotiation.
// Tab "Lưu trữ": Lost — có thể Reopen về Lead.

'use client';

import { Plus, X, AlertTriangle, Search } from 'lucide-react';
import { formatCurrencyFull } from '@/lib/utils';
import { LeadModal } from '@/components/leads/LeadModal';
import { PromoteModal } from '@/components/leads/PromoteModal';
import { LeadCard, LostCard } from '@/components/leads/LeadCard';
import { OwnerFilter } from '@/components/ui/OwnerFilter';
import { AssignLeadModal } from '@/components/leads/AssignLeadModal';
import { useLeadsPage } from './useLeadsPage';

export default function LeadsPage() {
  const {
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
    handleAdd, handleEdit, handlePromote, handleReopen,
    deleteOpportunity, updateStatus, fetchClients,
    assignLead, fetchOpportunities,
    currentUser, isManager,
    emptyLeadForm,
    clients,
    lastContactByClient,
  } = useLeadsPage();

  /** Helper: lấy client của một opp */
  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  return (
    <div className="flex flex-col px-6 py-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tiềm năng</h1>
          <p className="text-sm text-[#555] mt-0.5">
            {tab === 'active' ? (
              <>
                {leads.length} lead · {formatCurrencyFull(totalValue)} tổng giá trị
                {staleCount > 0 && (
                  <span className="ml-2 text-[#EF4444]">· {staleCount} cần liên hệ</span>
                )}
              </>
            ) : (
              <>{lostLeads.length} lead thất bại</>
            )}
          </p>
        </div>
        {tab === 'active' && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[#DFFF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors">
            <Plus size={15} /> Thêm lead
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#1a1a1a]">
        <button onClick={() => setTab('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'active' ? 'border-[#DFFF00] text-[#DFFF00]' : 'border-transparent text-[#555] hover:text-[#888]'
          }`}>
          Đang theo dõi
          {leads.length > 0 && (
            <span className="ml-1.5 rounded-full bg-[#1a1a1a] px-1.5 py-0.5 text-xs">{leads.length}</span>
          )}
        </button>
        <button onClick={() => setTab('lost')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'lost' ? 'border-[#EF4444] text-[#EF4444]' : 'border-transparent text-[#555] hover:text-[#888]'
          }`}>
          Lưu trữ
          {lostLeads.length > 0 && (
            <span className="ml-1.5 rounded-full bg-[#1a1a1a] px-1.5 py-0.5 text-xs">{lostLeads.length}</span>
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
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
          <OwnerFilter value={ownerFilter} onChange={setOwnerFilter} />
        </div>

        {tab === 'active' && (
          <button onClick={() => setSortStale(s => !s)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
              sortStale
                ? 'border-[#DFFF0044] bg-[#DFFF0010] text-[#DFFF00]'
                : 'border-[#222] text-[#555] hover:text-[#888]'
            }`}>
            <AlertTriangle size={12} /> Ưu tiên nguội nhất
          </button>
        )}
      </div>

      {/* Content grid */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-[#DFFF00]" />
        </div>
      ) : tab === 'active' ? (
        leads.length === 0 ? (
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
              {leads.map(opp => {
                const canEditThis = isManager || opp.ownerId === currentUser?.id;
                const client = getClient(opp.clientId);
                const lastContact = lastContactByClient.get(opp.clientId) ?? opp.date;
                return (
                  <LeadCard
                    key={opp.id}
                    opp={opp}
                    clientName={client?.name ?? ''}
                    clientCompany={client?.company ?? ''}
                    clientAvatar={client?.avatar ?? ''}
                    lastContact={lastContact}
                    deleteConfirm={deleteConfirm}
                    hasPendingTask={pendingClientIds.has(opp.clientId)}
                    canEdit={canEditThis}
                    computedTags={clientTagsMap.get(opp.clientId)}
                    onPromote={canEditThis ? setPromoteTarget : undefined}
                    onEdit={canEditThis ? setEditTarget : undefined}
                    onAssign={isManager ? setAssignTarget : undefined}
                    onDeleteRequest={canEditThis ? setDeleteConfirm : undefined}
                    onDeleteConfirm={canEditThis ? async id => {
                      // Không xóa thẳng — promote sang Lost → tự vào tab Lưu trữ
                      await updateStatus(id, 'Lost');
                      setDeleteConfirm(null);
                    } : undefined}
                    onDeleteCancel={() => setDeleteConfirm(null)}
                  />
                );
              })}
            </div>
          </div>
        )
      ) : (
        lostLeads.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111]">
              <span className="text-2xl text-[#555]">◱</span>
            </div>
            <p className="text-white font-medium">Không có lead thất bại nào</p>
            <p className="mt-1 text-sm text-[#555]">Các lead bị đánh dấu Thất bại sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lostLeads.map(opp => {
                const client = getClient(opp.clientId);
                return (
                  <LostCard
                    key={opp.id}
                    opp={opp}
                    clientName={client?.name ?? ''}
                    clientCompany={client?.company ?? ''}
                    clientAvatar={client?.avatar ?? ''}
                    onReopen={handleReopen}
                  />
                );
              })}
            </div>
          </div>
        )
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {showAdd && (
        <LeadModal
          title="Thêm lead mới"
          initial={emptyLeadForm()}
          showFirstTask
          showAssignedTo={isManager}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {editTarget && (() => {
        const client = getClient(editTarget.clientId);
        return (
          <LeadModal
            title="Chỉnh sửa deal"
            initial={{
              clientName: client?.name     ?? '',
              company:    client?.company  ?? '',
              avatar:     client?.avatar   ?? '',
              email:      '',
              industry:   client?.industry ?? 'Technology',
              title:      editTarget.title,
              value:      String(editTarget.value),
              confidence: String(editTarget.confidence),
              date:       editTarget.date,
              notes:      editTarget.notes ?? '',
              status:     editTarget.status,
              firstTaskTitle: '',
              firstTaskDate:  '',
              ownerId: '',
            }}
            onClose={() => setEditTarget(null)}
            onSave={handleEdit}
          />
        );
      })()}

      {promoteTarget && (() => {
        const client = getClient(promoteTarget.clientId);
        return (
          <PromoteModal
            opp={promoteTarget}
            clientName={client?.name ?? ''}
            clientCompany={client?.company ?? ''}
            onClose={() => setPromoteTarget(null)}
            onPromote={handlePromote}
          />
        );
      })()}

      {assignTarget && (() => {
        const client = getClient(assignTarget.clientId);
        return (
          <AssignLeadModal
            opp={assignTarget}
            clientName={client?.name ?? ''}
            clientCompany={client?.company ?? ''}
            onClose={() => setAssignTarget(null)}
            onAssign={async (newOwnerId) => {
              const ok = await assignLead(assignTarget.clientId, newOwnerId);
              if (ok) {
                fetchOpportunities();
                setAssignTarget(null);
              }
            }}
          />
        );
      })()}
    </div>
  );
}
