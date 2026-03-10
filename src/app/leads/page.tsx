'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, X, Check, Pencil, Trash2, AlertTriangle, Clock, Search } from 'lucide-react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { formatCurrencyFull } from '@/lib/utils';
import type { Opportunity, OpportunityStatus } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function StaleTag({ days }: { days: number }) {
  if (days <= 3) return <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-xs text-[#22C55E]"><Clock size={10} />Mới</span>;
  if (days <= 7) return <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1400] px-2 py-0.5 text-xs text-[#F5C842]"><Clock size={10} />{days}n</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#1A0000] px-2 py-0.5 text-xs text-[#EF4444]"><AlertTriangle size={10} />{days}n</span>;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-[#888]">
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Form Modal (Add / Edit) ───────────────────────────────────────

type FormState = {
  clientName: string; company: string; avatar: string;
  value: string; confidence: string;
  date: string; lastContactDate: string; notes: string;
  status: OpportunityStatus;
};

const emptyForm = (): FormState => ({
  clientName: '', company: '', avatar: '',
  value: '', confidence: '30',
  date: new Date().toISOString().slice(0, 10),
  lastContactDate: new Date().toISOString().slice(0, 10),
  notes: '', status: 'Lead',
});

function LeadModal({
  initial, title, onClose, onSave,
}: {
  initial: FormState;
  title: string;
  onClose: () => void;
  onSave: (f: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const inputCls = 'w-full rounded-xl bg-[#0a0a0a] border border-[#222] px-3 py-2 text-sm text-white focus:border-[#DFFF00] focus:outline-none transition-colors';
  const labelCls = 'block text-xs text-[#555] mb-1 uppercase tracking-widest';

  const valid = form.clientName.trim() && form.company.trim() && form.value.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Tên khách hàng *</label>
            <input className={inputCls} placeholder="Nguyễn Văn A" value={form.clientName} onChange={f('clientName')} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Công ty *</label>
            <input className={inputCls} placeholder="Tên công ty" value={form.company} onChange={f('company')} />
          </div>
          <div>
            <label className={labelCls}>Giá trị (USD) *</label>
            <input className={inputCls} type="number" placeholder="50000" value={form.value} onChange={f('value')} />
          </div>
          <div>
            <label className={labelCls}>Confidence (%)</label>
            <input className={inputCls} type="number" min={0} max={100} value={form.confidence} onChange={f('confidence')} />
          </div>
          <div>
            <label className={labelCls}>Ngày tạo</label>
            <input className={inputCls} type="date" value={form.date} onChange={f('date')} />
          </div>
          <div>
            <label className={labelCls}>Liên hệ gần nhất</label>
            <input className={inputCls} type="date" value={form.lastContactDate} onChange={f('lastContactDate')} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Ghi chú</label>
            <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={f('notes')} />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[#333] py-2 text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors">Hủy</button>
          <button
            onClick={() => valid && onSave(form)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              valid ? 'bg-[#DFFF00] text-black hover:bg-[#c8e600]' : 'bg-[#1a1a1a] text-[#555] cursor-not-allowed'
            }`}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Promote Modal ─────────────────────────────────────────────────

const PROMOTE_STEPS: OpportunityStatus[] = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const PROMOTE_LABELS: Record<string, string> = {
  Qualified: 'Đủ điều kiện', Proposal: 'Đề xuất',
  Negotiation: 'Thương lượng', Won: 'Chốt đơn', Lost: 'Thất bại',
};

function PromoteModal({ opp, onClose, onPromote }: { opp: Opportunity; onClose: () => void; onPromote: (s: OpportunityStatus) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Chuyển trạng thái</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors"><X size={15} /></button>
        </div>
        <p className="text-sm text-[#888] mb-5">
          <span className="text-white font-medium">{opp.clientName}</span> · {opp.company}
        </p>
        <div className="flex flex-col gap-2">
          {PROMOTE_STEPS.map(s => (
            <button
              key={s}
              onClick={() => { onPromote(s); onClose(); }}
              className="flex items-center justify-between rounded-xl border border-[#222] px-4 py-3 text-sm font-medium text-white hover:border-[#DFFF00] hover:bg-[#DFFF0008] transition-all"
            >
              {PROMOTE_LABELS[s]}
              <span className="text-[#DFFF00] text-xs">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function LeadsPage() {
  const { opportunities, fetchOpportunities, isLoading, addOpportunity, updateOpportunity, updateStatus, deleteOpportunity } = useOpportunityStore();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Opportunity | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<Opportunity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortStale, setSortStale] = useState(true); // sort by stale first by default

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

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

  const handleAdd = (form: FormState) => {
    addOpportunity({
      clientName: form.clientName,
      company: form.company,
      avatar: form.avatar || form.clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      value: Number(form.value),
      status: 'Lead',
      confidence: Number(form.confidence),
      date: form.date,
      lastContactDate: form.lastContactDate,
      notes: form.notes,
    });
    setShowAdd(false);
  };

  const handleEdit = (form: FormState) => {
    if (!editTarget) return;
    updateOpportunity(editTarget.id, {
      clientName: form.clientName,
      company: form.company,
      value: Number(form.value),
      confidence: Number(form.confidence),
      date: form.date,
      lastContactDate: form.lastContactDate,
      notes: form.notes,
    });
    setEditTarget(null);
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
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[#DFFF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors"
        >
          <Plus size={15} /> Thêm lead
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            className="w-56 rounded-xl border border-[#222] bg-[#111] pl-8 pr-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#DFFF00] focus:outline-none transition-colors"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-white"><X size={12} /></button>}
        </div>
        <button
          onClick={() => setSortStale(s => !s)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
            sortStale ? 'border-[#DFFF0044] bg-[#DFFF0010] text-[#DFFF00]' : 'border-[#222] text-[#555] hover:text-[#888]'
          }`}
        >
          <AlertTriangle size={12} />
          Ưu tiên nguội nhất
        </button>
      </div>

      {/* Card grid */}
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
            {leads.map(opp => {
              const days = daysSince(opp.lastContactDate);
              return (
                <div
                  key={opp.id}
                  className="group relative flex flex-col gap-3 rounded-2xl border border-[#1a1a1a] bg-[#111] p-4 hover:border-[#2a2a2a] transition-all"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar initials={opp.avatar} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{opp.clientName}</p>
                        <p className="text-xs text-[#555] truncate">{opp.company}</p>
                      </div>
                    </div>
                    <StaleTag days={days} />
                  </div>

                  {/* Value + confidence */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-white tabular-nums">{formatCurrencyFull(opp.value)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-1 w-16 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${opp.confidence}%`,
                              background: opp.confidence >= 50 ? '#DFFF00' : '#555',
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#555] tabular-nums">{opp.confidence}%</span>
                      </div>
                    </div>
                    {/* Promote button */}
                    <button
                      onClick={() => setPromoteTarget(opp)}
                      className="rounded-lg border border-[#DFFF0030] px-2.5 py-1 text-xs font-medium text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors"
                    >
                      Thăng ↑
                    </button>
                  </div>

                  {/* Notes */}
                  {opp.notes && (
                    <p className="text-xs text-[#555] line-clamp-2 border-t border-[#1a1a1a] pt-2">{opp.notes}</p>
                  )}

                  {/* Actions — hover */}
                  <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditTarget(opp)}
                      className="rounded-lg p-1.5 text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    {deleteConfirm === opp.id ? (
                      <>
                        <button onClick={() => { deleteOpportunity(opp.id); setDeleteConfirm(null); }} className="rounded-lg p-1.5 text-[#EF4444] hover:bg-[#EF444415] transition-colors">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] transition-colors">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(opp.id)} className="rounded-lg p-1.5 text-[#555] hover:text-[#EF4444] hover:bg-[#EF444415] transition-colors">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && <LeadModal title="Thêm lead mới" initial={emptyForm()} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editTarget && (
        <LeadModal
          title="Chỉnh sửa lead"
          initial={{
            clientName: editTarget.clientName,
            company: editTarget.company,
            avatar: editTarget.avatar,
            value: String(editTarget.value),
            confidence: String(editTarget.confidence),
            date: editTarget.date,
            lastContactDate: editTarget.lastContactDate,
            notes: editTarget.notes ?? '',
            status: editTarget.status,
          }}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}
      {promoteTarget && (
        <PromoteModal
          opp={promoteTarget}
          onClose={() => setPromoteTarget(null)}
          onPromote={status => updateStatus(promoteTarget.id, status)}
        />
      )}
    </div>
  );
}

