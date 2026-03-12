'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useOpportunityStore, useStatsByStatus } from '@/store/useOpportunityStore';
import { formatCurrencyFull } from '@/lib/utils';
import type { OpportunityStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS, STATUS_STYLE, type SortKey, type SortDir } from '@/components/opportunities/constants';
import { StatusBadge, Avatar, SortIcon } from '@/components/opportunities/OppUI';

const FILTER_TABS: Array<OpportunityStatus | 'Tất cả'> = ['Tất cả', ...ALL_STATUSES];
const thCls = 'px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-[#555] cursor-pointer select-none hover:text-[#888] transition-colors';

export default function OpportunitiesPage() {
  const { opportunities, fetchOpportunities, isLoading } = useOpportunityStore();
  const { counts } = useStatsByStatus();

  const [activeFilter, setActiveFilter] = useState<OpportunityStatus | 'Tất cả'>('Tất cả');
  const [search, setSearch]             = useState('');
  const [sortKey, setSortKey]           = useState<SortKey>('date');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const filtered = useMemo(() => {
    let list = opportunities;
    if (activeFilter !== 'Tất cả') list = list.filter(o => o.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => o.clientName.toLowerCase().includes(q) || o.company.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let va: string | number = a[sortKey] as string | number;
      let vb: string | number = b[sortKey] as string | number;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [opportunities, activeFilter, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] px-6 py-5 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Cơ hội</h1>
          <p className="text-sm text-[#555] mt-0.5">{opportunities.length} cơ hội · {filtered.length} đang hiển thị</p>
        </div>

      </div>

      {/* Filter tabs + Search */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-[#111] p-1">
          {FILTER_TABS.map(tab => {
            const cnt = tab === 'Tất cả' ? opportunities.length : counts[tab];
            return (
              <button key={tab} onClick={() => setActiveFilter(tab)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeFilter === tab ? 'bg-[#1a1a1a] text-white' : 'text-[#555] hover:text-[#888]'
                }`}>
                {tab === 'Tất cả' ? 'Tất cả' : STATUS_LABELS[tab]}
                <span className={`text-xs tabular-nums ${activeFilter === tab ? 'text-[#DFFF00]' : 'text-[#333]'}`}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
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
                {(['clientName', 'company', 'value', 'status', 'confidence', 'date'] as SortKey[]).map((col, i) => (
                  <th key={col} className={thCls} onClick={() => toggleSort(col)}>
                    <span className="flex items-center gap-1">
                      {['Khách hàng', 'Công ty', 'Giá trị', 'Trạng thái', 'Confidence', 'Ngày'][i]}
                      <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-sm text-[#555]">Không tìm thấy cơ hội nào.</td></tr>
              ) : filtered.map(opp =>
                  <tr key={opp.id} className="group border-b border-[#111] hover:bg-[#0d0d0d] transition-colors">
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
                      <StatusBadge status={opp.status} labels={STATUS_LABELS} styles={STATUS_STYLE} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${opp.confidence}%`,
                            background: opp.confidence >= 75 ? '#DFFF00' : opp.confidence >= 40 ? '#F5C842' : '#555',
                          }} />
                        </div>
                        <span className="text-xs tabular-nums text-[#888]">{opp.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#555]">
                      {new Date(opp.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>

                  </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
