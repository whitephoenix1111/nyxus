# HLD — High-Level Design: Nyxus Sales CRM

> Tài liệu này mô tả kiến trúc tổng thể. Đọc trước LLD.

---

## 1. Tech Stack

| Layer | Công nghệ | Lý do chọn |
|---|---|---|
| Framework | Next.js (App Router) | File-based routing, RSC, production-ready |
| Language | TypeScript | Type safety cho data schema |
| Styling | Tailwind CSS v3 | Utility-first, dark mode native |
| State | Zustand | Lightweight, no boilerplate, selector pattern |
| Charts | Recharts | Composable, tích hợp tốt với React |
| Icons | Lucide React | Consistent stroke-based icon set |
| Data | JSON files (local) | Backend đơn giản, migrate sang API sau |

---

## 2. Kiến trúc Tổng thể

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  /       │  │ /leads   │  │ /opportunities     │ │
│  │ Dashboard│  │          │  │                    │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ /clients │  │/forecast │  │ /documents         │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │              Zustand Store                      ││
│  │  opportunities[] | actions | selectors          ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │           Data Layer (JSON Files)               ││
│  │  /data/opportunities.json | /data/clients.json  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 3. Data Flow

```
JSON File
   │
   ▼
Next.js API Route (/api/opportunities)
   │  GET → trả về array
   │  POST → append vào JSON file
   │  PATCH → update by id
   ▼
Zustand Store (client-side state)
   │  hydrate khi app load
   │  optimistic update khi user action
   ▼
React Components (read từ store via selectors)
```

**Nguyên tắc**: Components không được gọi API trực tiếp. Mọi data access đều qua Zustand store actions.

---

## 4. Routing Structure

```
app/
├── layout.tsx          # Root layout: TopNav + body
├── page.tsx            # /  → Dashboard (Home)
├── leads/
│   └── page.tsx        # /leads
├── opportunities/
│   └── page.tsx        # /opportunities
├── clients/
│   └── page.tsx        # /clients
├── forecast/
│   └── page.tsx        # /forecast
├── documents/
│   └── page.tsx        # /documents
└── api/
    └── opportunities/
        └── route.ts    # GET, POST, PATCH
```

---

## 5. Component Architecture (Top-Down)

```
RootLayout
└── TopNav
└── Page (mỗi route)
    └── Dashboard:
        ├── StatsBar (4 cards)
        ├── MainContent
        │   ├── SalesTabBar (All Sales / Transactions / Tools / Reports)
        │   └── KPISection
        │       ├── ScatterChart
        │       └── RevenueKPISummary
        └── SidePanel
            ├── RemindersWidget
            └── TopClientsWidget
```

---

## 6. Thứ tự Build (Priority)

### Phase 1 — Core Dashboard (MVP)
1. Layout + TopNav
2. Zustand store + JSON data layer
3. Home page: StatsBar + ScatterChart + Reminders + TopClients

### Phase 2 — List Pages
4. Opportunities page (table + status filter)
5. Leads page (form add/edit)
6. Clients page

### Phase 3 — Advanced
7. Forecast page
8. Documents page
9. Search functionality

---

## 7. Lệnh cài đặt (Tự chạy)

```bash
# Tạo project
npx create-next-app@latest nyxus --typescript --tailwind --app --src-dir --import-alias "@/*"

# cd vào project
cd nyxus

# Cài dependencies
npm install zustand recharts lucide-react
npm install -D @types/node
```

**Node.js yêu cầu**: >= 18.17.0

---

## 8. Cấu hình Tailwind (tailwind.config.ts)

Cần extend theme với màu custom:

```ts
theme: {
  extend: {
    colors: {
      lime: {
        accent: '#DFFF00',
      },
      surface: {
        DEFAULT: '#0A0A0A',
        card: '#111111',
        hover: '#1A1A1A',
      }
    },
    fontFamily: {
      // Chọn sau — xem LLD
    }
  }
}
```
