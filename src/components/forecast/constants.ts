// src/components/forecast/constants.ts — Config hiển thị và helpers cho trang Forecast
// Trang Forecast chỉ manager mới thấy (/forecast bị guard bởi middleware).
import type { OpportunityStatus } from '@/types';

/**
 * Màu bar chart và nhãn tiếng Việt cho từng stage.
 * Màu giống STATUS_COLORS trong utils.ts — dùng bản local để tránh
 * import utils vào forecast khi chỉ cần subset nhỏ.
 */
export const STATUS_CONFIG: Record<OpportunityStatus, { bar: string; label: string }> = {
  Lead:        { bar: '#555555', label: 'Tiềm năng' },
  Qualified:   { bar: '#5BA3F5', label: 'Đủ điều kiện' },
  Proposal:    { bar: '#F5A742', label: 'Đề xuất' },
  Negotiation: { bar: '#F5C842', label: 'Thương lượng' },
  Won:         { bar: '#DFFF00', label: 'Chốt đơn' },
  Lost:        { bar: '#EF4444', label: 'Thất bại' },
};

/**
 * Format số tiền ngắn gọn cho labels trong chart Forecast.
 * VD: 1500000 → "$1.5M" | 75000 → "$75K" | 500 → "$500"
 * Dùng "K" viết hoa (khác formatCurrency trong utils dùng "k") để phân biệt
 * visual context — forecast chart dùng style trang trọng hơn.
 */
export function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
