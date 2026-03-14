// src/components/activities/constants.ts — Config hiển thị và helpers cho activities
import type { ActivityType as AType, ActivityOutcome } from '@/types';
import { Phone, Mail, Users, Monitor, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Display config ────────────────────────────────────────────────────────────

/** Màu sắc, icon và label cho từng loại activity. Dùng cho selector buttons và ActivityCard. */
export const TYPE_CONFIG: Record<AType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  call:    { label: 'Cuộc gọi', icon: Phone,    color: '#5BA3F5', bg: '#0D1B2A' },
  email:   { label: 'Email',    icon: Mail,     color: '#F5C842', bg: '#1A1400' },
  meeting: { label: 'Họp mặt',  icon: Users,    color: '#b388ff', bg: '#1a0a2e' },
  demo:    { label: 'Demo',     icon: Monitor,  color: '#DFFF00', bg: '#1a1f00' },
  note:    { label: 'Ghi chú',  icon: FileText, color: '#888',    bg: '#1a1a1a' },
};

/** Màu sắc, icon và label cho từng outcome. Dùng cho selector và ActivityCard. */
export const OUTCOME_CONFIG: Record<ActivityOutcome, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  positive: { label: 'Tích cực',  icon: TrendingUp,   color: '#22C55E', bg: '#052E16', border: '#14532d' },
  neutral:  { label: 'Trung lập', icon: Minus,        color: '#888',    bg: '#1a1a1a', border: '#333'    },
  negative: { label: 'Tiêu cực',  icon: TrendingDown, color: '#EF4444', bg: '#1C0505', border: '#7f1d1d' },
};

/** Thứ tự hiển thị các loại activity trong selector. */
export const ALL_TYPES: AType[] = ['call', 'email', 'meeting', 'demo', 'note'];

/** Thứ tự hiển thị các outcome trong selector: tích cực → trung lập → tiêu cực. */
export const ALL_OUTCOMES: ActivityOutcome[] = ['positive', 'neutral', 'negative'];

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Format ISO date thành "dd/mm/yyyy" theo locale vi-VN. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Trả về chuỗi tương đối từ một ISO date đến hiện tại.
 * VD: "Hôm nay" | "Hôm qua" | "3 ngày trước" | "2 tháng trước" | "1 năm trước"
 */
export function relativeDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  if (diff < 30)  return `${diff} ngày trước`;
  if (diff < 365) return `${Math.floor(diff / 30)} tháng trước`;
  return `${Math.floor(diff / 365)} năm trước`;
}

/**
 * Nhóm một mảng items có trường `date` theo tháng-năm, sort giảm dần (mới nhất lên đầu).
 * Key nội bộ dạng "YYYY-MM" để sort đúng thứ tự; label hiển thị theo locale vi-VN.
 *
 * @param acts Mảng items có trường `date` là ISO string.
 * @returns    Mảng { label: string; items: T[] } theo từng nhóm tháng.
 */
export function groupByDate<T extends { date: string }>(acts: T[]): { label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  acts.forEach(a => {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });
  return Array.from(map.entries()).map(([key, items]) => {
    const [year, month] = key.split('-');
    const label = new Date(+year, +month - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    return { label, items };
  });
}

/**
 * Kiểm tra xem một ngày ISO có đã qua chưa (so với thời điểm hiện tại).
 * @param dateStr ISO date string. Trả về false nếu undefined (không có deadline).
 */
export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}
