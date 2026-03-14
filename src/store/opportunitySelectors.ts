// src/store/opportunitySelectors.ts — Computed selectors từ opportunity store
// Tách ra khỏi useOpportunityStore để tránh circular dependency và giữ store gọn.
// Tất cả selector đều nhận oppsOverride để hỗ trợ test hoặc manager filter theo owner.
'use client';

import { useMemo } from 'react';
import type { Activity, Opportunity, OpportunityStatus } from '@/types';
import { useOpportunityStore } from './useOpportunityStore';

// ── Aggregation selectors ─────────────────────────────────────────────────────

/** Đếm số lượng và tổng value theo từng stage. Dùng cho summary bar / dashboard. */
export function useStatsByStatus() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    const counts: Record<OpportunityStatus, number> = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 };
    const values: Record<OpportunityStatus, number> = { Lead: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 };
    opps.forEach(o => { counts[o.status]++; values[o.status] += o.value; });
    return { counts, values };
  }, [opps]);
}

/** Map opportunities thành data points cho scatter/line chart theo tháng. */
export function useMonthlyChartData() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() =>
    opps.map(o => ({
      month:  new Date(o.date).getMonth(),
      value:  o.value,
      date:   o.date,
      status: o.status,
      title:  o.title,
      id:     o.id,
    })),
    [opps]
  );
}

/** Giá trị trung bình của tất cả opportunities. Trả về 0 nếu chưa có deal nào. */
export function useAverageValue() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    if (opps.length === 0) return 0;
    return opps.reduce((sum, o) => sum + o.value, 0) / opps.length;
  }, [opps]);
}

/**
 * Doanh thu dự báo = Σ (value × confidence%) — loại bỏ Lost (confidence = 0).
 * Won vẫn được tính vì confidence = 100% và cần hiện trong pipeline tổng.
 */
export function useForecastRevenue() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() =>
    opps.filter(o => o.status !== 'Lost').reduce((sum, o) => sum + o.value * (o.confidence / 100), 0),
    [opps]
  );
}

/**
 * Top N opportunities theo value giảm dần. Dùng cho bảng xếp hạng khách hàng.
 * @param limit Số lượng kết quả, mặc định 25.
 */
export function useTopClients(limit = 25) {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() =>
    [...opps].sort((a, b) => b.value - a.value).slice(0, limit),
    [opps, limit]
  );
}

// ── Alert selectors ───────────────────────────────────────────────────────────

/**
 * Deals đang mở (Lead/Qualified/Proposal) không có liên hệ quá `days` ngày
 * VÀ không có pending task nào trong tương lai.
 * Ngưỡng mặc định 3 ngày — đủ ngắn để cảnh báo sớm nhưng không spam.
 *
 * @param activities   Danh sách activities hiện tại (để kiểm tra pending task).
 * @param days         Ngưỡng ngày không liên hệ, mặc định 3.
 * @param oppsOverride Ghi đè danh sách opps (dùng khi manager filter theo owner).
 */
export function useStaleLeads(activities: Activity[], days = 3, oppsOverride?: Opportunity[]) {
  const storeOpps = useOpportunityStore(s => s.opportunities);
  const opps = oppsOverride ?? storeOpps;
  return useMemo(() => {
    const now       = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000;
    // Chỉ cảnh báo stage chưa chốt — Won/Negotiation/Lost không cần nhắc liên hệ
    const staleStatuses: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal'];
    return opps.filter(opp => {
      if (!staleStatuses.includes(opp.status)) return false;
      // lastContactDate đã xóa khỏi schema — dùng MAX(activities.date) qua activities param
      const lastContact = activities
        .filter(a => a.clientId === opp.clientId)
        .reduce((latest, a) => a.date > latest ? a.date : latest, '');
      if (lastContact && now - new Date(lastContact).getTime() <= threshold) return false;
      // Nếu có task future đang chờ → deal không thực sự stale
      const hasPendingTask = activities.some(
        a => a.opportunityId === opp.id && a.nextActionDate && new Date(a.nextActionDate).getTime() >= now
      );
      return !hasPendingTask;
    });
  }, [opps, activities, days]);
}

/**
 * Activities có nextActionDate đã qua và deal vẫn đang mở.
 * Loại bỏ activity nếu đã có activity mới hơn deadline — tức deal đã được follow-up.
 * Kết quả sort tăng dần theo deadline (quá hạn lâu nhất lên đầu).
 *
 * @param activities   Toàn bộ activities của user hiện tại.
 * @param oppsOverride Ghi đè danh sách opps nếu cần filter.
 */
export function useOverdueTaskAlerts(activities: Activity[], oppsOverride?: Opportunity[]) {
  const storeOpps = useOpportunityStore(s => s.opportunities);
  const opps = oppsOverride ?? storeOpps;
  return useMemo(() => {
    const now = Date.now();
    const results: Array<{ activity: Activity; opportunity: Opportunity }> = [];
    activities.forEach(act => {
      if (!act.nextActionDate) return;
      if (new Date(act.nextActionDate).getTime() >= now) return;
      if (!act.opportunityId) return;
      const opp = opps.find(o => o.id === act.opportunityId);
      // Bỏ qua deal đã đóng — Won/Lost không cần alert
      if (!opp || opp.status === 'Won' || opp.status === 'Lost') return;
      // Nếu đã log activity sau deadline → coi như đã xử lý, không alert
      const hasNewerActivity = activities.some(
        a => a.opportunityId === opp.id && a.id !== act.id &&
             new Date(a.date).getTime() > new Date(act.nextActionDate!).getTime()
      );
      if (hasNewerActivity) return;
      results.push({ activity: act, opportunity: opp });
    });
    return results.sort((a, b) =>
      new Date(a.activity.nextActionDate!).getTime() - new Date(b.activity.nextActionDate!).getTime()
    );
  }, [opps, activities]);
}

/**
 * Proposals đang mở quá `days` ngày không có cập nhật (dùng lastContactDate làm proxy).
 * Ngưỡng mặc định 14 ngày — phù hợp chu kỳ quyết định B2B thông thường.
 *
 * @param days         Ngưỡng ngày, mặc định 14.
 * @param oppsOverride Ghi đè danh sách opps nếu cần filter.
 */
export function useExpiringProposals(days = 14, oppsOverride?: Opportunity[]) {
  const storeOpps = useOpportunityStore(s => s.opportunities);
  const opps = oppsOverride ?? storeOpps;
  return useMemo(() => {
    const now       = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000;
    // lastContactDate đã xóa — useExpiringProposals giờ chỉ filter theo date tạo deal (opp.date)
    // TODO: truyền activities vào để dùng MAX(activities.date) chính xác hơn
    return opps.filter(o =>
      o.status === 'Proposal' && now - new Date(o.date).getTime() > threshold
    );
  }, [opps, days]);
}

// ── Aggregated reminders ──────────────────────────────────────────────────────

/**
 * Tổng hợp 3 loại alert thành danh sách reminder hiển thị trên UI.
 * Thứ tự ưu tiên: overdue_task → stale_deal → expiring_proposal.
 * Không trả về alert nếu count = 0 (tránh hiển thị badge trống).
 */
export function useReminders(activities: Activity[], oppsOverride?: Opportunity[]) {
  const staleLeads        = useStaleLeads(activities, 3, oppsOverride);
  const overdueTasks      = useOverdueTaskAlerts(activities, oppsOverride);
  const expiringProposals = useExpiringProposals(14, oppsOverride);

  return useMemo(() => {
    const alerts = [];
    if (overdueTasks.length > 0) alerts.push({
      id: 'overdue_task', type: 'overdue_task' as const, count: overdueTasks.length,
      label: 'Tasks quá hạn', description: `${overdueTasks.length} task chưa được xử lý sau deadline`,
    });
    if (staleLeads.length > 0) alerts.push({
      id: 'stale_deal', type: 'stale_deal' as const, count: staleLeads.length,
      label: 'Deals không có hoạt động', description: `${staleLeads.length} deal không có liên hệ trong 3 ngày`,
    });
    if (expiringProposals.length > 0) alerts.push({
      id: 'expiring_proposal', type: 'expiring_proposal' as const, count: expiringProposals.length,
      label: 'Proposals sắp hết hạn', description: `${expiringProposals.length} proposal đã mở quá 14 ngày`,
    });
    return alerts;
  }, [overdueTasks, staleLeads, expiringProposals]);
}
