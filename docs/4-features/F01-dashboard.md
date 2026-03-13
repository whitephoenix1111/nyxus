# F01 — Dashboard (Home Page)

> **Route**: `/`
> **Accessible by**: Salesperson · Manager

---

## Mục tiêu

Trang chính — nhìn thấy toàn bộ pipeline + cảnh báo proactive trong 1 màn hình.

---

## Layout

```
┌──────────────────────────────────┬──────────┐
│  StatsBar (4 cards)              │          │
├──────────────────────────────────┤ SidePanel│
│  KPIScatterChart                 │ Reminders│
│  KPISummary                      │ Widget   │
│                                  │          │
│                                  │ Top      │
│                                  │ Clients  │
└──────────────────────────────────┴──────────┘
```

---

## Components & Data Dependencies

| Component | Selector | Ghi chú |
|---|---|---|
| `<StatsBar />` | `useStatsByStatus()` | 4 cards: Lead · Proposal · Negotiation · Won |
| `<KPIScatterChart />` | `useMonthlyChartData()`, `useAverageValue()` | Dot lime = Won, xám = khác |
| `<KPISummary />` | `useForecastRevenue()`, `useStatsByStatus()` | Weighted revenue + trend |
| `<RemindersWidget />` | `useReminders(activities)` | 3 cards: overdue · stale · expiring |
| `<TopClientsWidget />` | `useTopClients(25)` | 2-column grid, sort by value desc |

---

## Reminders Widget — 3 loại

| Card | Điều kiện | Accent |
|---|---|---|
| Overdue tasks | `nextActionDate < today`, chưa có activity mới | Đỏ |
| Stale deals | `lastContactDate > 3 ngày`, [Lead/Qualified/Proposal], không có pending task | Vàng |
| Expiring proposals | `status = Proposal`, `lastContactDate > 14 ngày` | Cam |

---

## Acceptance Criteria

- [x] StatsBar hiển thị count + totalValue cho Lead, Proposal, Negotiation, Won
- [x] StatCard active (mặc định: Lead) có `.card-brand` (lime bg)
- [x] KPI ScatterChart: dot lime = Won, xám = khác; ReferenceLine tại average
- [x] KPISummary: weighted revenue, open deals count, opportunities count
- [x] RemindersWidget: 3 card với count và description
- [x] TopClientsWidget: top 25, 2-column grid
- [x] SidePanel ẩn trên màn hình < 1280px
