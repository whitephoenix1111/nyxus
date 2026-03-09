# LLD — Zustand Store

---

## 1. Store Structure

```typescript
// src/store/useOpportunityStore.ts
import { create } from 'zustand';
import { useMemo } from 'react';
import type { Opportunity, OpportunityStatus } from '@/types';

interface OpportunityStore {
  // ── State ──────────────────────────────────────────
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;

  // ── Actions ────────────────────────────────────────
  fetchOpportunities: () => Promise<void>;
  addOpportunity: (data: Omit<Opportunity, 'id'>) => Promise<void>;
  updateStatus: (id: string, status: OpportunityStatus) => Promise<void>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
}
```

---

## 2. Actions (Implementation Notes)

### `fetchOpportunities`
```typescript
fetchOpportunities: async () => {
  set({ isLoading: true });
  const res = await fetch('/api/opportunities');
  const data = await res.json();
  set({ opportunities: data, isLoading: false });
}
```

### `addOpportunity`
- Gọi `POST /api/opportunities`
- Sau khi nhận response (với id mới), append vào state: `set(s => ({ opportunities: [...s.opportunities, newOpp] }))`

### `updateStatus`
- Gọi `PATCH /api/opportunities/[id]` với `{ status }`
- Update optimistic trong state trước, rollback nếu lỗi

---

## 3. Selectors (Custom Hooks)

Tất cả selectors là custom hooks, dùng `useMemo` để tránh re-compute.

### `useStatsByStatus`
```typescript
// Returns: { Lead: number, Proposal: number, Forecast: number, Order: number }
// Dùng cho: StatsBar — hiển thị count và tổng value mỗi status
export function useStatsByStatus() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    return opps.reduce((acc, opp) => {
      acc[opp.status] = (acc[opp.status] || 0) + 1;
      return acc;
    }, {} as Record<OpportunityStatus, number>);
  }, [opps]);
}
```

### `useMonthlyChartData`
```typescript
// Returns: Array<{ month: string, value: number, date: string }>
// Dùng cho: ScatterChart — mỗi item là 1 dot trên chart
export function useMonthlyChartData() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    return opps.map(opp => ({
      month: new Date(opp.date).getMonth(),     // 0-11
      value: opp.value,
      date: opp.date,
      status: opp.status,
      clientName: opp.clientName,
    }));
  }, [opps]);
}
```

### `useAverageValue`
```typescript
// Returns: number — giá trị trung bình, dùng cho ReferenceLine trên chart
export function useAverageValue() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    if (opps.length === 0) return 0;
    return opps.reduce((sum, o) => sum + o.value, 0) / opps.length;
  }, [opps]);
}
```

### `useForecastRevenue`
```typescript
// Returns: number — SUM(value * confidence/100)
// Dùng cho: Forecast page
export function useForecastRevenue() {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    return opps.reduce((sum, o) => sum + o.value * (o.confidence / 100), 0);
  }, [opps]);
}
```

### `useTopClients`
```typescript
// Returns: Opportunity[] — sort by value desc, top N
export function useTopClients(limit = 25) {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    return [...opps]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }, [opps, limit]);
}
```

### `useStaleLeads`
```typescript
// Returns: Opportunity[] — leads không có activity > 3 ngày
// Logic: status === 'Lead' && (today - lastContactDate) > 3 ngày
export function useStaleLeads(days = 3) {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    const now = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000;
    return opps.filter(opp =>
      opp.status === 'Lead' &&
      now - new Date(opp.lastContactDate).getTime() > threshold
    );
  }, [opps, days]);
}
```
