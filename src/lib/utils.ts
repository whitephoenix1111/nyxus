export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const MONTH_LABELS = ['th1','th2','th3','th4','th5','th6','th7','th8','th9','th10','th11','th12'];

export const STATUS_COLORS: Record<string, string> = {
  Lead:        '#555555',
  Qualified:   '#5BA3F5',
  Proposal:    '#F5A742',
  Negotiation: '#F5C842',
  Won:         '#DFFF00',
  Lost:        '#EF4444',
};
