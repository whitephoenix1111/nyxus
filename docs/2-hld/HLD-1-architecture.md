# HLD (1/2) — Kiến trúc & Data Flow

> File tiếp theo: `HLD-2-conventions.md`

---

## 1. Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v3 + CSS Variables |
| State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Data | JSON files (local) |

---

## 2. Domain Model

```
POST /api/leads  →  tạo đồng thời:
  CLIENT (isProspect: true)          OPPORTUNITY (Lead, confidence: 15%)
    │  clientId (hard FK) ──────────────────────────────────────────►│

  Khi promote → Qualified: client.isProspect = false

  Client ──► Opportunity ──► Activity
                │                │
                status: Lead → Qualified → Proposal → Negotiation → Won/Lost
                confidence: mặc định theo stage, fine-tune trong range
                              │
                              nextAction: string
                              nextActionDate?: string  ← due date thật
                              promoteOpportunityTo?    ← promote khi lưu
```

**Confidence mặc định:**

| Stage | Default | Range |
|---|---|---|
| Lead | 15% | ✗ |
| Qualified | 35% | ±15% |
| Proposal | 60% | ±15% |
| Negotiation | 80% | ±10% |
| Won | 100% | ✗ |
| Lost | 0% | ✗ |

**Join**: `Opportunity.clientId → Client.id` (hard FK). Không join bằng company name.

---

## 3. Kiến trúc tổng thể

```
Next.js App Router
  Pages: / | /leads | /opportunities | /clients | /forecast | /activities | /documents

  Zustand Stores
    useOpportunityStore | useClientStore | useActivityStore

  Data Layer (JSON)
    data/opportunities.json | data/clients.json | data/activities.json
```

---

## 4. Data Flow

```
JSON File → API Route → Zustand Store → React Components (via selectors)

API đặc biệt:

POST /api/leads
  → tạo Client (isProspect: true) + Opportunity (Lead, 15%)
  → trả về { client, opportunity }

POST /api/activities  [nếu có promoteOpportunityTo]
  → PATCH opportunity: status mới + confidence mặc định stage mới
  → append statusHistory
  → nếu → Qualified: PATCH client.isProspect = false
  → luôn PATCH opportunity.lastContactDate = activity.date
```

---

## 5. Routing & API Structure

```
app/
├── page.tsx                   # Dashboard
├── leads/page.tsx
├── opportunities/page.tsx
├── clients/page.tsx
├── forecast/page.tsx
├── activities/page.tsx
├── documents/page.tsx
└── api/
    ├── leads/route.ts          # POST — tạo Client + Opportunity đồng thời
    ├── opportunities/
    │   ├── route.ts            # GET (?status=), POST (internal only)
    │   └── [id]/route.ts       # PATCH, DELETE
    ├── clients/
    │   ├── route.ts            # GET (?industry= ?tag= ?search= ?isProspect=), POST
    │   └── [id]/route.ts       # GET, PATCH, DELETE
    └── activities/
        ├── route.ts            # GET (?type= ?outcome= ?clientId= ?search=), POST + side effects
        └── [id]/route.ts       # GET, PATCH, DELETE
```

---

## 6. Store Architecture

| Store | State | Key Selectors |
|---|---|---|
| `useOpportunityStore` | `opportunities[]` | `useStatsByStatus`, `useMonthlyChartData`, `useForecastRevenue`, `useTopClients`, `useStaleLeads(activities)`, `useOverdueTasks(activities)`, `useReminders(activities)` |
| `useClientStore` | `clients[]` | `useClientsWithStats(opps)` — join bằng clientId, `useClientIndustries()`, `useTopClientsByValue(opps, limit)` |
| `useActivityStore` | `activities[]` | `useActivitiesByType`, `useActivitiesByOutcome`, `useRecentActivities`, `useActivitiesForClient` |

---

## 7. Build Status

- ✅ Phase 1–3: Dashboard, Leads, Opportunities, Clients, Forecast, Activities
- ⚠️ Phase 4 còn lại (xem `CODING_DELTA.md`):
  1. Client isProspect + `/api/leads`
  2. `Activity.nextActionDate` + Reminders overdue
  3. Confidence theo stage
  4. Activity promote UI + API side effects
  5. Documents API
  6. Search toàn cục
