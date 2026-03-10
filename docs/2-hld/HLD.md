# HLD — High-Level Design: Nyxus Sales CRM

> Tài liệu này mô tả kiến trúc tổng thể. Đọc trước LLD.

---

## 1. Tech Stack

| Layer | Công nghệ | Lý do chọn |
|---|---|---|
| Framework | Next.js (App Router) | File-based routing, RSC, production-ready |
| Language | TypeScript | Type safety cho data schema |
| Styling | Tailwind CSS v3 + CSS Variables | Utility-first, design tokens qua `globals.css` |
| State | Zustand | Lightweight, no boilerplate, selector pattern |
| Charts | Recharts | Composable, tích hợp tốt với React |
| Icons | Lucide React | Consistent stroke-based icon set |
| Data | JSON files (local) | Backend đơn giản, migrate sang API sau |

---

## 2. Domain Model

```
Contact/Lead vào hệ thống
  │
  │  POST /api/leads  →  tạo đồng thời:
  ▼
Client (isProspect: true)          Opportunity (status: Lead, confidence: 15%)
  │                                      │
  │  clientId ──────────────────────────►│  (foreign key cứng, không join bằng tên)
  │
  │  Khi promote → Qualified:
  │  isProspect = false  (Client activated)
  │
  ├── Opportunity (nhiều per client)
  │     │  status: Lead → Qualified → Proposal → Negotiation → Won / Lost
  │     │  confidence: mặc định theo stage, fine-tune trong range
  │     │  statusHistory[]: lịch sử promote để trace
  │     │
  │     └── Activity (nhiều per opportunity)
  │           type: call | email | meeting | demo | note
  │           outcome: positive | neutral | negative
  │           nextAction: string          ← mô tả bước tiếp theo
  │           nextActionDate?: string     ← due date thật (ISO 8601), tạo task
  │           promoteOpportunityTo?: OpportunityStatus  ← promote khi lưu
  │
  └── (Forecast là view tính toán, không phải entity riêng)
```

**Confidence mặc định theo stage:**

| Stage | Default | Range override |
|---|---|---|
| Lead | 15% | ✗ |
| Qualified | 35% | ±15% |
| Proposal | 60% | ±15% |
| Negotiation | 80% | ±10% |
| Won | 100% | ✗ |
| Lost | 0% | ✗ |

**Quan hệ**: `Activity.clientId` → `Client.id` (hard ref). `Opportunity.clientId` → `Client.id` (hard ref). Không còn join bằng `company` name — tránh sai khi tên công ty khác nhau.

---

## 3. Kiến trúc Tổng thể

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐  │
│  │  /       │  │ /leads   │  │/opportunit.│  │ /clients  │  │
│  │Dashboard │  │          │  │            │  │           │  │
│  └──────────┘  └──────────┘  └────────────┘  └───────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐                  │
│  │/forecast │  │/activit. │  │ /documents │                  │
│  └──────────┘  └──────────┘  └────────────┘                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                   Zustand Stores                     │    │
│  │  useOpportunityStore | useClientStore                │    │
│  │  useActivityStore                                    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Data Layer (JSON Files)                 │    │
│  │  /data/opportunities.json                            │    │
│  │  /data/clients.json                                  │    │
│  │  /data/activities.json                               │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow

```
JSON File
   │
   ▼
Next.js API Route
   │  GET  → đọc + filter
   │  POST → append, auto-generate id + createdAt
   │  PATCH → update by id (optimistic ở client)
   │  DELETE → filter out by id
   │
   │  Đặc biệt 1: POST /api/leads
   │    → tạo Client (isProspect: true) + Opportunity (Lead, confidence: 15%)
   │    → trả về { client, opportunity } trong một response
   │
   │  Đặc biệt 2: POST /api/activities
   │    nếu body.promoteOpportunityTo tồn tại:
   │    → PATCH opportunity: status mới + confidence mặc định stage mới
   │    → append vào statusHistory
   │    → nếu promote → Qualified: PATCH client.isProspect = false
   │
   │  Đặc biệt 3: GET /api/reminders
   │    → tính overdue tasks (nextActionDate < today, chưa có act mới)
   │    → tính stale deals (lastContactDate > 3 ngày, không có task)
   │    → tính expiring proposals (Proposal > 14 ngày)
   ▼
Zustand Store (client-side state)
   │  hydrate khi app load (fetchXxx action)
   │  optimistic update cho PATCH/DELETE
   │  pessimistic cho POST (đợi response có id)
   ▼
React Components (read từ store qua selectors)
   │  selectors dùng useMemo — không tính trong component
   │  components không gọi fetch trực tiếp
```

---

## 5. System Workflow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NYXUS — TECHNICAL WORKFLOW                           │
└──────────────────────────────────────────────────────────────────────────┘

   BROWSER (React)
   ┌──────────────────────────────────────────────────────────────────────┐
   │                                                                      │
   │   Component (read-only via selectors)                                │
   │       │ useOpportunityStore(s => s.opportunities)                    │
   │       │ useClientsWithStats(opps)                                    │
   │       │ useReminders()  ...                                          │
   │       ▼                                                              │
   │   Zustand Store                                                      │
   │   ┌──────────────────────────────────────────────────────────┐       │
   │   │  state: opportunities[] | clients[] | activities[]       │       │
   │   │                                                          │       │
   │   │  READ actions (fetch…)          hydrate khi app load     │       │
   │   │  WRITE actions (add/update/del)  optimistic PATCH/DELETE │      │
   │   │                                 pessimistic POST         │      │
   └───└──────────────────────────────┬───────────────────────┘──────────┘
                                       │
                     fetch() / POST / PATCH / DELETE
                                       │
   SERVER (Next.js API Routes)         ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                                                                      │
   │   /api/opportunities      /api/clients      /api/activities          │
   │                                                                      │
   │   POST /api/activities ───────────────────────────────┐              │
   │   │                                                   │              │
   │   │  body.promoteOpportunityTo ?                      │              │
   │   │     YES ─► PATCH /api/opportunities/[id]          │              │
   │   │           └─► append statusHistory                │              │
   │   │     NO  ─► chỉ lưu activity                       │              │
   │   └────────────────────────────────────────────────┘                 │
   │                                                                      │
   └───────────────────────────────────┬───────────────────────────────────┘
                                       │
                         readJSON / writeJSON
                                       │
   DATA LAYER (JSON files)             ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                                                                      │
   │   opportunities.json     clients.json     activities.json            │
   │                                                                      │
   └──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Routing Structure

```
app/
├── layout.tsx             # Root layout: TopNav + body
├── page.tsx               # /  → Dashboard
├── leads/page.tsx         # /leads — card view, stale indicator, promote
├── opportunities/page.tsx # /opportunities — table, filter, inline edit
├── clients/page.tsx       # /clients — grid, detail panel, join stats
├── forecast/page.tsx      # /forecast — weighted revenue, funnel, breakdown
├── activities/page.tsx    # /activities — timeline by month, KPI bar
├── documents/page.tsx     # /documents — TODO: wire API
└── api/
    ├── opportunities/
    │   ├── route.ts        # GET (filter ?status=), POST
    │   └── [id]/route.ts   # PATCH, DELETE
    ├── clients/
    │   ├── route.ts        # GET (filter ?industry= ?tag= ?search=), POST
    │   └── [id]/route.ts   # GET, PATCH, DELETE
    └── activities/
        ├── route.ts        # GET (filter ?type= ?outcome= ?clientId= ?search=), POST
        └── [id]/route.ts   # GET, PATCH, DELETE
```

---

## 6. Store Architecture

| Store | State | Key Selectors |
|---|---|---|
| `useOpportunityStore` | `opportunities[]` | `useStatsByStatus`, `useMonthlyChartData`, `useAverageValue`, `useForecastRevenue`, `useTopClients`, `useStaleLeads`, `useNoContactLeads`, `useReminders` |
| `useClientStore` | `clients[]` | `useClientsWithStats(opps)`, `useClientIndustries()`, `useTopClientsByValue(opps, limit)` |
| `useActivityStore` | `activities[]` | `useActivitiesByType`, `useActivitiesByOutcome`, `useRecentActivities`, `useActivitiesForClient` |

**Nguyên tắc**: `ClientWithStats` được tính runtime bằng join `client.company ↔ opportunity.company` (case-insensitive). Không lưu computed values vào JSON.

---

## 7. Component Architecture (Dashboard)

```
RootLayout
└── TopNav (Home / Tiềm năng / Cơ hội / Khách hàng / Dự báo / Hoạt động / Tài liệu)
└── Page (mỗi route)
    └── Dashboard (/):
        ├── StatsBar (4 StatCards: Lead / Proposal / Negotiation / Won)
        ├── MainContent
        │   ├── SalesTabBar
        │   └── KPISection
        │       ├── KPIScatterChart (dot màu theo status, ReferenceLine avg)
        │       └── KPISummary (Total Sales / Open Quotes / Opportunities)
        └── SidePanel
            ├── RemindersWidget (stale leads, no-contact, expiring proposals)
            └── TopClientsWidget (top 25 by value)
```

---

## 8. Thứ tự Build — Trạng thái

### Phase 1 — Core Dashboard ✅
- Layout + TopNav
- Zustand stores + JSON data layer
- Dashboard: StatsBar + ScatterChart + Reminders + TopClients

### Phase 2 — List Pages ✅
- Opportunities page
- Leads page
- Clients page

### Phase 3 — Advanced ✅ (phần lớn)
- Forecast page ✅
- Activities page ✅
- Documents page ⚠️ (mock data, chưa wire API)

### Phase 4 — Còn lại (ưu tiên theo thứ tự)
1. **Client isProspect + Lead creation flow**: `POST /api/leads` tạo đồng thời Client + Opportunity
2. **nextActionDate**: thêm field vào Activity, Reminders Widget đọc overdue tasks
3. **Confidence theo stage**: promote → auto-set confidence mặc định, fine-tune UI
4. **Activity promote UI + API**: field `promoteOpportunityTo` trong AddActivityModal + PATCH logic
5. Documents: wire lên `/api/documents` + `data/documents.json`
6. Search toàn cục

---

## 9. Design System

- **Nền**: `#000000` tuyệt đối
- **Accent**: `#DFFF00` (lime) — chỉ dùng cho 1 element quan trọng nhất mỗi vùng
- **Tokens**: định nghĩa trong `globals.css` block `@theme inline`, dùng qua CSS variables
- **Font**: Syne (display/headings) · Geist (body) · DM Mono (số liệu, IDs)
- **Utility classes**: `.card`, `.btn-primary`, `.btn-ghost`, `.input-base`, `.select-base`, `.badge-*`

---

## 10. Conventions

- Components không gọi `fetch` trực tiếp — chỉ qua store actions
- Selectors dùng `useMemo`, đặt trong store file, không trong component
- Optimistic update cho PATCH/DELETE, pessimistic cho POST
- Join data runtime — không denormalize vào JSON (ngoại trừ `clientName`/`company` trong Activity để tránh join mỗi render)
- Status history append-only — không edit, không xóa
