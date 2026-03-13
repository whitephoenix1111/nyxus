'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, X, ChevronDown } from 'lucide-react';
import { useActivityStore } from '@/store/useActivityStore';
import { useClientStore } from '@/store/useClientStore';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useCurrentUser, useIsManager } from '@/store/useAuthStore';
import type { ActivityType as AType, ActivityOutcome } from '@/types';
import { TYPE_CONFIG, OUTCOME_CONFIG, ALL_TYPES, ALL_OUTCOMES, groupByDate } from '@/components/activities/constants';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { AddActivityModal } from '@/components/activities/AddActivityModal';
import { KpiBar } from '@/components/activities/KpiBar';
import { TaskPanel } from '@/components/activities/TaskPanel';

export default function ActivitiesPage() {
  const { activities, isLoading, fetchActivities, deleteActivity, addActivity } = useActivityStore();
  const { clients, fetchClients }   = useClientStore();
  const { fetchOpportunities }      = useOpportunityStore();
  const currentUser = useCurrentUser();
  const isManager   = useIsManager();

  const ownerClientIds = useMemo(() => {
    if (isManager) return null;
    return new Set(clients.filter(c => c.ownerId === currentUser?.id).map(c => c.id));
  }, [isManager, clients, currentUser?.id]);

  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState<AType | ''>('');
  const [outcomeFilter, setOutcomeFilter] = useState<ActivityOutcome | ''>('');
  const [showModal,     setShowModal]     = useState(false);
  const [mobileTab,     setMobileTab]     = useState<'activities' | 'tasks'>('activities');
  const [typeOpen,      setTypeOpen]      = useState(false);
  const [outcomeOpen,   setOutcomeOpen]   = useState(false);

  useEffect(() => {
    fetchActivities();
    fetchClients();
    fetchOpportunities();
  }, [fetchActivities, fetchClients, fetchOpportunities]);

  const visibleActivities = useMemo(() => {
    if (!ownerClientIds) return activities;
    return activities.filter(a => ownerClientIds.has(a.clientId));
  }, [activities, ownerClientIds]);

  const filtered = useMemo(() => {
    let list = visibleActivities;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.clientName.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q)
    );
    if (typeFilter)    list = list.filter(a => a.type === typeFilter);
    if (outcomeFilter) list = list.filter(a => a.outcome === outcomeFilter);
    return list;
  }, [visibleActivities, search, typeFilter, outcomeFilter]);

  const grouped    = useMemo(() => groupByDate(filtered as Parameters<typeof groupByDate>[0]), [filtered]);
  const hasFilter  = !!(search || typeFilter || outcomeFilter);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setOutcomeFilter(''); };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

      {/* Mobile tab switcher */}
      <div className="md:hidden flex items-center gap-1 px-4 pt-3 pb-0 shrink-0">
        {(['activities', 'tasks'] as const).map(t => (
          <button key={t} onClick={() => setMobileTab(t)}
            className="flex-1 rounded-xl py-2 text-xs font-medium transition-all"
            style={{
              background: mobileTab === t ? 'var(--color-surface)' : 'transparent',
              color:      mobileTab === t ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
            }}>
            {t === 'activities' ? 'Hoạt động' : 'Tasks'}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left: Activity timeline */}
        <div className={`flex flex-col flex-1 min-w-0 px-6 py-5 overflow-hidden
          ${mobileTab === 'tasks' ? 'hidden md:flex' : 'flex'}`}>

          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Hoạt động</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
                {visibleActivities.length} hoạt động · theo dõi mọi tương tác với khách hàng
              </p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
              <Plus size={13} /> Thêm hoạt động
            </button>
          </div>

          {!isLoading && <KpiBar activities={visibleActivities} />}

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs rounded-xl px-3 py-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <Search size={13} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
              <input
                className="flex-1 bg-transparent text-sm outline-none min-w-0"
                style={{ color: 'var(--color-text-primary)' }}
                placeholder="Tìm theo tiêu đề, khách hàng..."
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch('')} className="shrink-0 hover:text-white transition-colors"
                  style={{ color: 'var(--color-text-faint)' }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="relative">
              <button
                onClick={() => { setTypeOpen(o => !o); setOutcomeOpen(false); }}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
                style={{
                  background: 'var(--color-surface)',
                  border: `1px solid ${typeFilter ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  color: typeFilter ? 'var(--color-brand)' : 'var(--color-text-subtle)',
                }}>
                {typeFilter
                  ? (() => { const cfg = TYPE_CONFIG[typeFilter]; const Icon = cfg.icon; return <><Icon size={12} style={{ color: cfg.color }} />{cfg.label}</>; })()
                  : 'Tất cả loại'
                }
                <ChevronDown size={12} style={{ opacity: 0.5 }} />
              </button>
              {typeOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-xl min-w-[140px]"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <button onClick={() => { setTypeFilter(''); setTypeOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                    style={{ color: typeFilter === '' ? 'var(--color-brand)' : 'var(--color-text-subtle)' }}>
                    Tất cả loại
                  </button>
                  {ALL_TYPES.map(t => {
                    const cfg = TYPE_CONFIG[t]; const Icon = cfg.icon;
                    return (
                      <button key={t} onClick={() => { setTypeFilter(t); setTypeOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: typeFilter === t ? cfg.color : 'var(--color-text-subtle)' }}>
                        <Icon size={12} style={{ color: cfg.color }} />{cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outcome filter */}
            <div className="relative">
              <button
                onClick={() => { setOutcomeOpen(o => !o); setTypeOpen(false); }}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
                style={{
                  background: 'var(--color-surface)',
                  border: `1px solid ${outcomeFilter ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  color: outcomeFilter ? 'var(--color-brand)' : 'var(--color-text-subtle)',
                }}>
                {outcomeFilter
                  ? (() => { const cfg = OUTCOME_CONFIG[outcomeFilter]; const Icon = cfg.icon; return <><Icon size={12} style={{ color: cfg.color }} />{cfg.label}</>; })()
                  : 'Tất cả kết quả'
                }
                <ChevronDown size={12} style={{ opacity: 0.5 }} />
              </button>
              {outcomeOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-xl min-w-[150px]"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <button onClick={() => { setOutcomeFilter(''); setOutcomeOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                    style={{ color: outcomeFilter === '' ? 'var(--color-brand)' : 'var(--color-text-subtle)' }}>
                    Tất cả kết quả
                  </button>
                  {ALL_OUTCOMES.map(o => {
                    const cfg = OUTCOME_CONFIG[o]; const Icon = cfg.icon;
                    return (
                      <button key={o} onClick={() => { setOutcomeFilter(o); setOutcomeOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: outcomeFilter === o ? cfg.color : 'var(--color-text-subtle)' }}>
                        <Icon size={12} style={{ color: cfg.color }} />{cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {hasFilter && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-subtle)' }}>
                <X size={11} /> Xóa filter
              </button>
            )}
            <span className="ml-auto text-xs tabular-nums" style={{ color: 'var(--color-text-faint)' }}>
              {filtered.length} kết quả
            </span>
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
                  ? <button onClick={clearFilters} className="text-xs hover:underline"
                      style={{ color: 'var(--color-brand)' }}>Xóa bộ lọc</button>
                  : <button onClick={() => setShowModal(true)}
                      className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
                      <Plus size={12} /> Thêm hoạt động đầu tiên
                    </button>
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
        </div>

        {/* Right: Task panel */}
        <div className={`w-full md:w-[340px] lg:w-[380px] shrink-0 overflow-hidden
          ${mobileTab === 'activities' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <TaskPanel ownerClientIds={ownerClientIds} />
        </div>
      </div>

      {showModal && (
        <AddActivityModal onClose={() => setShowModal(false)} onSave={addActivity} />
      )}
    </div>
  );
}
