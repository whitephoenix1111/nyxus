'use client';

import { useEffect, useState } from 'react';
import { Settings2, Zap, Clock, Users, Phone, Timer, MessageSquare, List, Calendar } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import KPIScatterChart from '@/components/dashboard/KPIScatterChart';
import KPISummary from '@/components/dashboard/KPISummary';
import ReminderCard from '@/components/dashboard/ReminderCard';
import ClientCard from '@/components/dashboard/ClientCard';
import {
  useOpportunityStore,
  useStatsByStatus,
  useMonthlyChartData,
  useAverageValue,
  useTopClients,
  useReminders,
} from '@/store/useOpportunityStore';
import { useActivityStore } from '@/store/useActivityStore';

const SALES_TABS = ['Tất cả', 'Giao dịch', 'Công cụ', 'Báo cáo'];
const FILTER_ICONS = [Clock, Users, Phone, Timer, MessageSquare, List, Calendar];

// Màu accent cho từng loại reminder
const REMINDER_ACCENT: Record<string, string> = {
  overdue_task:       '#EF4444',
  stale_deal:         '#F5C842',
  expiring_proposal:  '#F5A742',
};

export default function DashboardPage() {
  const { fetchOpportunities, isLoading } = useOpportunityStore();
  // DELTA-3 bước 9: fetch activities để selectors nhận đúng dữ liệu
  const { activities, fetchActivities } = useActivityStore();
  const [activeTab, setActiveTab] = useState('Tất cả');

  const { counts, values } = useStatsByStatus();
  const chartData  = useMonthlyChartData();
  const avgValue   = useAverageValue();
  const topClients = useTopClients(25);
  // DELTA-3 bước 9: useReminders nhận activities làm tham số
  const reminders  = useReminders(activities);

  useEffect(() => {
    fetchOpportunities();
    fetchActivities(); // DELTA-3 bước 9
  }, [fetchOpportunities, fetchActivities]);

  const totalSales = values.Won;
  const openQuotes = counts.Proposal + counts.Negotiation;
  const totalOpps  = counts.Lead + counts.Qualified + counts.Proposal + counts.Negotiation;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-[#DFFF00]" />
          <p className="text-sm text-[#555]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Nội dung chính ────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5 min-w-0">
        <h1 className="text-2xl font-bold text-white mb-5">Tổng quan</h1>

        {/* Thanh thống kê */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard status="Lead"        count={counts.Lead}        totalValue={values.Lead}        delta={28}  isActive />
          <StatCard status="Proposal"    count={counts.Proposal}    totalValue={values.Proposal}    delta={104} />
          <StatCard status="Negotiation" count={counts.Negotiation} totalValue={values.Negotiation} delta={2}   />
          <StatCard status="Won"         count={counts.Won}         totalValue={values.Won}         delta={560} />
        </div>

        {/* Tab doanh số */}
        <div className="rounded-2xl bg-[#111] p-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1">
              {SALES_TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeTab === tab ? 'bg-[#1a1a1a] text-white' : 'text-[#555] hover:text-[#888]'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border-r border-[#222] pr-2 mr-1">
                {FILTER_ICONS.map((Icon, i) => (
                  <button key={i}
                    className={`rounded-full p-2 transition-all ${
                      i === 0 ? 'bg-white text-black' : 'text-[#555] hover:bg-[#1a1a1a] hover:text-white'
                    }`}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
              <button className="rounded-lg p-1.5 text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors">
                <Zap size={15} />
              </button>
              <button className="rounded-lg p-1.5 text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors">
                <Settings2 size={15} />
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Chỉ số hiệu suất chính</h2>
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <KPIScatterChart data={chartData} averageValue={avgValue} />
              </div>
              <KPISummary totalSales={totalSales} openQuotes={openQuotes} opportunities={totalOpps} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Cột bên phải ─────────────────────────────────── */}
      <aside className="w-80 shrink-0 border-l border-[#111] overflow-y-auto px-4 py-5">

        {/* DELTA-3 bước 9: 3 reminder cards từ useReminders */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Nhắc nhở</h2>
          <div className="flex flex-col gap-3">
            {reminders.length === 0 ? (
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] px-4 py-3">
                <p className="text-sm text-[#555]">Không có nhắc nhở nào.</p>
              </div>
            ) : (
              reminders.map(r => (
                <ReminderCard
                  key={r.id}
                  count={r.count}
                  label={r.label}
                  description={r.description}
                  accentColor={REMINDER_ACCENT[r.type] ?? '#DFFF00'}
                />
              ))
            )}
          </div>
        </div>

        {/* Top 25 khách hàng */}
        <div>
          <h2 className="text-xl font-bold text-white mb-3">Top 25 Khách hàng</h2>
          <div className="grid grid-cols-1 gap-2">
            {topClients.map((opp) => (
              <ClientCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
