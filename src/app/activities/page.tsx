'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useActivityStore } from '@/store/useActivityStore';
import type { ActivityType as AType, ActivityOutcome } from '@/types';
import { TYPE_CONFIG, OUTCOME_CONFIG, ALL_TYPES, ALL_OUTCOMES, groupByDate } from '@/components/activities/constants';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { AddActivityModal } from '@/components/activities/AddActivityModal';
import { KpiBar } from '@/components/activities/KpiBar';

export default function ActivitiesPage() {
  const { activities, isLoading, fetchActivities, deleteActivity, addActivity } = useActivityStore();
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState<AType | ''>('');
  const [outcomeFilter, setOutcomeFilter] = useState<ActivityOutcome | ''>('');
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const filtered = useMemo(() => {
    let list = activities;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.clientName.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q)
    );
    if (typeFilter)    list = list.filter(a => a.type === typeFilter);
    if (outcomeFilter) list = list.filter(a => a.outcome === outcomeFilter);
    return list;
  }, [activities, search, typeFilter, outcomeFilter]);

  const grouped    = useMemo(() => groupByDate(filtered as Parameters<typeof groupByDate>[0]), [filtered]);
  const hasFilter  = !!(search || typeFilter || outcomeFilter);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setOutcomeFilter(''); };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] px-6 py-5 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Hoạt động</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
            {activities.length} hoạt động · theo dõi mọi tương tác với khách hàng
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
          <Plus size={13} /> Thêm hoạt động
        </button>
      </div>

      {!isLoading && <KpiBar activities={activities} />}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-faint)' }} />
          <input className="input-base w-full pl-8 pr-8"
            placeholder="Tìm theo tiêu đề, khách hàng..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-white"
              style={{ color: 'var(--color-text-faint)' }}>
              <X size={12} />
            </button>
          )}
        </div>
        <select className="select-base" value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as AType | '')}>
          <option value="">Tất cả loại</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
        </select>
        <select className="select-base" value={outcomeFilter}
          onChange={e => setOutcomeFilter(e.target.value as ActivityOutcome | '')}>
          <option value="">Tất cả kết quả</option>
          {ALL_OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_CONFIG[o].label}</option>)}
        </select>
        {hasFilter && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: 'var(--color-text-subtle)' }}>
            <X size={11} /> Xóa filter
          </button>
        )}
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-faint)' }}>{filtered.length} kết quả</span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2"
              style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>
              {hasFilter ? 'Không tìm thấy hoạt động nào.' : 'Chưa có hoạt động nào.'}
            </p>
            {hasFilter
              ? <button onClick={clearFilters} className="text-xs hover:underline" style={{ color: 'var(--color-brand)' }}>Xóa bộ lọc</button>
              : <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2"><Plus size={12} /> Thêm hoạt động đầu tiên</button>
            }
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs uppercase tracking-widest font-semibold"
                    style={{ color: 'var(--color-text-faint)' }}>{label}</p>
                  <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text-disabled)' }}>
                    {items.length}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                </div>
                <div className="space-y-2">
                  {(items as Parameters<typeof ActivityCard>[0]['activity'][]).map(activity => (
                    <ActivityCard key={activity.id} activity={activity} onDelete={deleteActivity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <AddActivityModal onClose={() => setShowModal(false)} onSave={addActivity} />}
    </div>
  );
}
