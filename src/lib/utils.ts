// src/lib/utils.ts — Shared utility functions và constants dùng toàn app

// ── Currency formatters ───────────────────────────────────────────────────────

/**
 * Format số tiền ngắn gọn cho không gian hẹp (badge, card).
 * VD: 1500000 → "$1.5M" | 75000 → "$75k" | 500 → "$500"
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

/**
 * Format số tiền đầy đủ theo chuẩn en-US, không có phần thập phân.
 * VD: 1500000 → "$1,500,000"
 * Dùng Intl.NumberFormat để đảm bảo đúng locale và currency symbol.
 */
export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// ── String helpers ────────────────────────────────────────────────────────────

/**
 * Lấy 2 chữ cái đầu từ tên đầy đủ, viết hoa.
 * VD: "Nguyễn Văn An" → "NV" | "Alice" → "AL"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Chart constants ───────────────────────────────────────────────────────────

/**
 * Nhãn tháng viết tắt tiếng Việt, index 0 = tháng 1.
 * Dùng cho X-axis của KPIScatterChart và các biểu đồ theo tháng.
 */
export const MONTH_LABELS = ['th1','th2','th3','th4','th5','th6','th7','th8','th9','th10','th11','th12'];

/**
 * Màu hex cho từng OpportunityStatus, dùng nhất quán trên toàn app
 * (chart dots, badges, status bars).
 * Màu sắc theo cấp độ nhiệt: Lead=xám → Won=brand yellow → Lost=đỏ.
 */
export const STATUS_COLORS: Record<string, string> = {
  Lead:        '#555555',
  Qualified:   '#5BA3F5',
  Proposal:    '#F5A742',
  Negotiation: '#F5C842',
  Won:         '#DFFF00',
  Lost:        '#EF4444',
};
