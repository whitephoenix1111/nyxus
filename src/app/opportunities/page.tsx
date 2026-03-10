'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Search, Plus, ChevronUp, ChevronDown, ChevronsUpDown,
  Trash2, Pencil, X, Check
} from 'lucide-react';
import {
  useOpportunityStore,
  useStatsByStatus,
} from '@/store/useOpportunityStore';
import { formatCurrencyFull } from '@/lib/utils';
import type { Opportunity, OpportunityStatus } from '@/types';

// ── Constants ───────────────────────────────────────────────────

const ALL_STATUSES: OpportunityStatus[] = ['Lead', 'Proposal', 'Forecast', 'Order'];

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  Lead: 'Tiềm năng',
  Proposal: 'Đề xuất',
  Forecast: 'Dự báo',
  Order: 'Đơn hàng',
};

const STATUS_STYLE: Record<OpportunityStatus, { bg: string; text: string; border: string }> = {
  Lead:     { bg: '#1A1A1A', text: '#AAAAAA', border: '#333333' },
  Proposal: { bg: '#0D1B2A', text: '#5BA3F5', border: '#1A3A5C' },
  Forecast: { bg: '#1A1400', text: '#F5C842', border: '#3A3000' },
  Order:    { bg: '#DFFF0015', text: '#DFFF00', border: '#DFFF0044' },
};

type SortKey = 'clientName' | 'company' | 'value' | 'status' | 'date' | 'confidence';
type SortDir = 'asc' | 'desc';

// ── Sub-components ──────────────────────────────────────────────

function StatusBadge({ status }: { status: OpportunityStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-[#888]">
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-[#333]" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-[#DFFF00]" />
    : <ChevronDown size={12} className="text-[#DFFF00]" />;
}

// ── Inline Edit Row ─────────────────────────────────────────────

function EditRow({
  opp, onSave, onCancel
}: {
  opp: Opportunity;
  onSave: (data: Partial<Opportunity>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    clientName: opp.clientName,
    company: opp.company,
    value: String(opp.value),
    status: opp.status,
    confidence: String(opp.confidence),
    date: opp.date,
  });

  const inputCls = 'w-full rounded-lg bg-[#0a0a0a] border border-[#333] px-2 py-1 text-sm text-white focus:border-[#DFFF00] focus:outline-none';

  return (
    <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
      <td className="px-4 py-2">
        <input className={inputCls} value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <input className={inputCls} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <input className={inputCls} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <select
          className={inputCls}
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value as OpportunityStatus }))}
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <input className={inputCls} type="number" min={0} max={100} value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <input className={inputCls} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSave({
              clientName: form.clientName,
              company: form.company,
              value: Number(form.value),
              status: form.status,
              confidence: Number(form.confidence),
              date: form.date,
            })}
            className="rounded-lg p-1.5 text-[#DFFF00] hover:bg-[#DFFF0015] transition-colors"
          >
            <Check size={14} />
          </button>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] transition-colors">
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Add Form Modal ───────────────────────────────────────────────

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (d: Omit<Opportunity, 'id'>) => void }) {
  const [form, setForm] = useState({
    clientName: '', company: '', avatar: '',
    value: '', status: 'Lead' as OpportunityStatus,
    confidence: '50', date: new Date().toISOString().slice(0, 10),
    lastContactDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const inputCls = 'w-full rounded-xl bg-[#0a0a0a] border border-[#222] px-3 py-2 text-sm text-white focus:border-[#DFFF00] focus:outline-none transition-colors';
  const labelCls = 'block text-xs text-[#555] mb-1 uppercase tracking-widest';

  const handleSubmit = () => {
    if (!form.clientName || !form.company || !form.value) return;
    onAdd({
      clientName: form.clientName,
      company: form.company,
      avatar: form.avatar || form.clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      value: Number(form.value),
      status: form.status,
      confidence: Number(form.confidence),
      date: form.date,
      lastContactDate: form.lastContactDate,
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Thêm cơ hội mới</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Tên khách hàng *</label>
            <input className={inputCls} placeholder="Nguyễn Văn A" value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Công ty *</label>
            <input className={inputCls} placeholder="Tên công ty" value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Giá trị (USD) *</label>
            <input className={inputCls} type="number" placeholder="50000" value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Trạng thái</label>
            <select className={inputCls} value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as OpportunityStatus }))}>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Confidence (%)</label>
            <input className={inputCls} type="number" min={0} max={100} value={form.confidence}
              onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Ngày</label>
            <input className={inputCls} type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Ghi chú</label>
            <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-[#333] py-2 text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit}
            className="flex-1 rounded-xl bg-[#DFFF00] py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors">
            Thêm cơ hội
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const { opportunities, fetchOpportunities, isLoading, updateOpportunity, deleteOpportunity, addOpportunity } =
    useOpportunityStore();
  const { counts } = useStatsByStatus();

  const [activeFilter, setActiveFilter] = useState<OpportunityStatus | 'Tất cả'>('Tất cả');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const filtered = useMemo(() => {
    let list = opportunities;
    if (activeFilter !== 'Tất cả') list = list.filter(o => o.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.clientName.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let va: string | number = a[sortKey] as string | number;
      let vb: string | number = b[sortKey] as string | number;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [opportunities, activeFilter, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const thCls = 'px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-[#555] cursor-pointer select-none hover:text-[#888] transition-colors';
  const FILTER_TABS: Array<OpportunityStatus | 'Tất cả'> = ['Tất cả', ...ALL_STATUSES];

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] px-6 py-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Cơ hội</h1>
          <p className="text-sm text-[#555] mt-0.5">{opportunities.length} cơ hội · {filtered.length} đang hiển thị</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[#DFFF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors"
        >
          <Plus size={15} />
          Thêm cơ hội
        </button>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-[#111] p-1">
          {FILTER_TABS.map(tab => {
            const cnt = tab === 'Tất cả' ? opportunities.length : counts[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeFilter === tab ? 'bg-[#1a1a1a] text-white' : 'text-[#555] hover:text-[#888]'
                }`}
              >
                {tab === 'Tất cả' ? 'Tất cả' : STATUS_LABELS[tab]}
                <span className={`text-xs tabular-nums ${
                  activeFilter === tab ? 'text-[#DFFF00]' : 'text-[#333]'
                }`}>{cnt}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            className="w-56 rounded-xl border border-[#222] bg-[#111] pl-8 pr-3 py-1.5 text-sm text-white placeholder-[#555] focus:border-[#DFFF00] focus:outline-none transition-colors"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-2xl border border-[#1a1a1a]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-[#DFFF00]" />
          </div>
        ) : (
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0d0d0d]">
              <tr className="border-b border-[#1a1a1a]">
                <th className={thCls} onClick={() => toggleSort('clientName')}>
                  <span className="flex items-center gap-1">Khách hàng <SortIcon col="clientName" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className={thCls} onClick={() => toggleSort('company')}>
                  <span className="flex items-center gap-1">Công ty <SortIcon col="company" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className={thCls} onClick={() => toggleSort('value')}>
                  <span className="flex items-center gap-1">Giá trị <SortIcon col="value" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className={thCls} onClick={() => toggleSort('status')}>
                  <span className="flex items-center gap-1">Trạng thái <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className={thCls} onClick={() => toggleSort('confidence')}>
                  <span className="flex items-center gap-1">Confidence <SortIcon col="confidence" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className={thCls} onClick={() => toggleSort('date')}>
                  <span className="flex items-center gap-1">Ngày <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-sm text-[#555]">
                    Không tìm thấy cơ hội nào.
                  </td>
                </tr>
              ) : (
                filtered.map(opp => (
                  editingId === opp.id ? (
                    <EditRow
                      key={opp.id}
                      opp={opp}
                      onSave={data => { updateOpportunity(opp.id, data); setEditingId(null); }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr
                      key={opp.id}
                      className="group border-b border-[#111] hover:bg-[#0d0d0d] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={opp.avatar} />
                          <span className="text-sm font-medium text-white">{opp.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#888]">{opp.company}</td>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-white tabular-nums">
                        {formatCurrencyFull(opp.value)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={opp.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-[#1a1a1a] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${opp.confidence}%`,
                                background: opp.confidence >= 75 ? '#DFFF00' : opp.confidence >= 40 ? '#F5C842' : '#555',
                              }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-[#888]">{opp.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#555]">
                        {new Date(opp.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {deleteConfirm === opp.id ? (
                            <>
                              <span className="mr-1 text-xs text-[#EF4444]">Xóa?</span>
                              <button
                                onClick={() => { deleteOpportunity(opp.id); setDeleteConfirm(null); }}
                                className="rounded-lg p-1.5 text-[#EF4444] hover:bg-[#EF444415] transition-colors"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="rounded-lg p-1.5 text-[#555] hover:bg-[#1a1a1a] transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingId(opp.id)}
                                className="rounded-lg p-1.5 text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(opp.id)}
                                className="rounded-lg p-1.5 text-[#555] hover:text-[#EF4444] hover:bg-[#EF444415] transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addOpportunity} />}
    </div>
  );
}

