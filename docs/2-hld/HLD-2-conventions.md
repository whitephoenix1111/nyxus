# HLD (2/2) — Conventions & Design System

> File trước: `HLD-1-architecture.md`

---

## 1. Coding Conventions

- Components **không gọi fetch trực tiếp** — chỉ qua store actions
- Selectors dùng `useMemo`, đặt trong file store, không trong component
- **Optimistic update** cho PATCH/DELETE, **pessimistic** cho POST (đợi response có id)
- Join data runtime — không denormalize vào JSON (ngoại trừ `clientName`/`company` trong Activity)
- `statusHistory` append-only — không edit, không xóa
- Stores **không import lẫn nhau** (tránh circular dependency) — selectors cần cross-store data nhận tham số thay vì import trực tiếp. Ví dụ: `useStaleLeads(activities: Activity[])` thay vì import `useActivityStore`

---

## 2. Design System

- **Nền**: `#000000` tuyệt đối
- **Accent**: `#DFFF00` (lime) — chỉ dùng cho 1 element quan trọng nhất mỗi vùng
- **Tokens**: định nghĩa trong `globals.css` block `@theme inline`, dùng qua CSS variables
- **Font**: Syne (headings) · Geist (body) · DM Mono (số liệu, IDs)
- **Utility classes**: `.card`, `.btn-primary`, `.btn-ghost`, `.input-base`, `.select-base`, `.badge-*`

**Status colors:**

| Status | Text | Background |
|---|---|---|
| Lead | `#AAAAAA` | `#1A1A1A` |
| Qualified | `#5BA3F5` | `#0D1B2A` |
| Proposal | `#F5A742` | `#1A1000` |
| Negotiation | `#F5C842` | `#1A1400` |
| Won | `#DFFF00` | `#DFFF0015` |
| Lost | `#EF4444` | `#1C0505` |

---

## 3. Component Architecture (Dashboard)

```
RootLayout
└── TopNav
└── Page
    └── Dashboard (/):
        ├── StatsBar (StatCards: Lead / Proposal / Negotiation / Won)
        ├── MainContent
        │   └── KPISection
        │       ├── KPIScatterChart
        │       └── KPISummary
        └── SidePanel
            ├── RemindersWidget (3 cards: overdue / stale / expiring)
            └── TopClientsWidget (top 25 by value)
```
