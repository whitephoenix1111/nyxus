/**
 * computeClientTags — Phase 12: Smart Tags
 *
 * Pure function, không lưu DB.
 * Nhận (client, opportunities, activities) → trả về computed ClientTag[]
 *
 * Computed tags:
 *   new-lead  — createdAt < 7 ngày
 *   warm      — lastContactDate < 14 ngày (bất kỳ opp nào)
 *   cold      — lastContactDate > 30 ngày VÀ không phải new-lead
 *   priority  — tổng value > $50,000
 *
 * Manual tags (giữ nguyên từ DB, không tính lại):
 *   enterprise, mid-market
 */

import type { Client, ClientTag, Opportunity } from '@/types';

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS);
}

/** Tags do human gán — không override bằng computed */
const MANUAL_TAGS: ClientTag[] = ['enterprise', 'mid-market'];

export function computeClientTags(
  client: Client,
  opportunities: Opportunity[],
): ClientTag[] {
  const computed: ClientTag[] = [];

  // ── Computed rules ──────────────────────────────────────────────

  // new-lead: client tạo trong vòng 7 ngày
  const isNewLead = daysSince(client.createdAt) < 7;
  if (isNewLead) computed.push('new-lead');

  // lastContactDate: lấy ngày liên hệ gần nhất từ tất cả opp của client
  const contactDates = opportunities
    .filter(o => o.clientId === client.id && o.lastContactDate)
    .map(o => o.lastContactDate)
    .sort();
  const latestContact = contactDates.at(-1);

  if (latestContact) {
    const daysSinceContact = daysSince(latestContact);

    // warm: liên hệ < 14 ngày
    if (daysSinceContact < 14) {
      computed.push('warm');
    }

    // cold: không liên hệ > 30 ngày VÀ không phải new-lead
    if (daysSinceContact > 30 && !isNewLead) {
      computed.push('cold');
    }
  }

  // priority: tổng value > $50,000
  const totalValue = opportunities
    .filter(o => o.clientId === client.id)
    .reduce((sum, o) => sum + o.value, 0);
  if (totalValue > 50_000) computed.push('priority');

  // ── Merge với manual tags ───────────────────────────────────────
  // Giữ enterprise / mid-market từ DB nếu có, tránh duplicate
  const manualFromDB = (client.tags ?? []).filter(t => MANUAL_TAGS.includes(t));
  const merged = Array.from(new Set([...manualFromDB, ...computed])) as ClientTag[];

  return merged;
}
