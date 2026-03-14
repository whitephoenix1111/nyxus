/**
 * computeClientTags — Pure function, không lưu DB.
 * Nhận (client, opportunities, activities) → trả về computed ClientTag[]
 *
 * Computed tags:
 *   new-lead  — createdAt < 7 ngày
 *   warm      — liên hệ gần nhất < 14 ngày (tính từ activities)
 *   cold      — liên hệ gần nhất > 30 ngày VÀ không phải new-lead
 *   priority  — tổng value > $50,000
 *
 * Manual tags (giữ nguyên từ DB, không tính lại):
 *   enterprise, mid-market
 *
 * NOTE: lastContactDate đã xóa khỏi Opportunity schema.
 * Thay thế: tính MAX(activities.date) cho client này.
 */

import type { Activity, Client, ClientTag, Opportunity } from '@/types';

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS);
}

/** Tags do human gán — không override bằng computed */
const MANUAL_TAGS: ClientTag[] = ['enterprise', 'mid-market'];

export function computeClientTags(
  client: Client,
  opportunities: Opportunity[],
  activities: Activity[] = [],
): ClientTag[] {
  const computed: ClientTag[] = [];

  // ── new-lead: client tạo trong vòng 7 ngày ───────────────────────────────
  const isNewLead = daysSince(client.createdAt) < 7;
  if (isNewLead) computed.push('new-lead');

  // ── lastContact: MAX(activities.date) của client này ─────────────────────
  // Thay thế opp.lastContactDate đã xóa khỏi schema
  const clientActivities = activities.filter(a => a.clientId === client.id);
  const latestContact = clientActivities.length > 0
    ? clientActivities.reduce((latest, a) => a.date > latest ? a.date : latest, '')
    : null;

  if (latestContact) {
    const daysSinceContact = daysSince(latestContact);

    // warm: liên hệ < 14 ngày
    if (daysSinceContact < 14) computed.push('warm');

    // cold: không liên hệ > 30 ngày VÀ không phải new-lead
    if (daysSinceContact > 30 && !isNewLead) computed.push('cold');
  } else if (!isNewLead) {
    // Không có activity nào → coi như cold (trừ new-lead)
    computed.push('cold');
  }

  // ── priority: tổng value > $50,000 ───────────────────────────────────────
  const totalValue = opportunities
    .filter(o => o.clientId === client.id)
    .reduce((sum, o) => sum + o.value, 0);
  if (totalValue > 50_000) computed.push('priority');

  // ── Merge với manual tags từ DB ───────────────────────────────────────────
  const manualFromDB = (client.tags ?? []).filter(t => MANUAL_TAGS.includes(t));
  return Array.from(new Set([...manualFromDB, ...computed])) as ClientTag[];
}
