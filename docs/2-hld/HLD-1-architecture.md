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
| Data | JSON files (local — dev only) |

---

## 2. Cấu trúc thư mục

```
data/*.json              — dữ liệu thô (clients, opportunities, activities, tasks, documents, users)
src/app/api/             — API routes (Next.js route handlers)
src/store/               — Zustand stores + selectors
src/app/                 — Pages
src/components/          — UI components
src/lib/                 — Helpers: json-db, auth, utils
src/types/index.ts       — Tất cả TypeScript types
middleware.ts            — JWT guard tất cả routes
```

---

## 3. Domain Model & Quan hệ FK

```
users.json                 (độc lập — auth + ownership)

clients.json
  └─ opportunities.json    (clientId FK)
       └─ activities.json  (clientId + opportunityId FK)
            └─ tasks.json  (clientId + opportunityId FK)
            └─ documents.json (clientId + opportunityId? FK)
```

**Ownership gắn tại Client** — `client.ownerId → User.id`.
Mọi resource con (opp, activity, task, document) kế thừa quyền từ `client.ownerId`.
Manager bypass toàn bộ — không cần check ownership.

---

## 4. Data Flow

```
JSON File → API Route → Zustand Store → React Component (via selectors)
```

**API đặc biệt:**

```
POST /api/leads
  → Tạo Client (isProspect: true) + Opportunity (Lead, confidence: 15%)
  → clientId hard FK
  → Trả về { client, opportunity }

POST /api/activities  [nếu có promoteOpportunityTo]
  → Lưu activity
  → PATCH opportunity.lastContactDate = activity.date
  → PATCH opportunity.status = newStatus
  → PATCH opportunity.confidence = STAGE_DEFAULT_CONFIDENCE[newStatus]
  → Append statusHistory entry
  → Nếu newStatus === 'Qualified': PATCH client.isProspect = false

DELETE /api/clients/[id]  (soft delete)
  → archivedAt = today
  → Cascade xóa: opps chưa Won + tasks pending
  → Giữ: activities, tasks done, opps Won
```

---

## 5. Routing & API Structure

```
app/
├── page.tsx                    # Dashboard — Stats, KPI, Reminders, Top Clients
├── leads/page.tsx              # Sales: ownerId === me | Manager: tất cả
├── opportunities/page.tsx      # Read-only — không có action
├── clients/page.tsx            # isProspect=false; Sales: owner only
├── forecast/page.tsx           # Manager only — redirect / nếu là salesperson
├── activities/page.tsx         # Filter qua ownerClientIds Set
├── documents/page.tsx          # OwnerFilter dropdown cho Manager
├── login/page.tsx
└── api/
    ├── auth/
    │   ├── login/route.ts      # POST — set JWT cookie
    │   ├── me/route.ts         # GET — session user hiện tại
    │   └── logout/route.ts     # POST — clear cookie
    ├── users/route.ts          # GET — không trả passwordHash, filter ?role=
    ├── leads/
    │   ├── route.ts            # POST — tạo Client + Opportunity đồng thời
    │   └── [id]/assign/route.ts # PATCH — Manager only
    ├── opportunities/
    │   ├── route.ts            # GET (?status= ?clientId=), POST (internal)
    │   └── [id]/route.ts       # GET, PATCH, DELETE
    ├── clients/
    │   ├── route.ts            # GET (?industry= ?tag= ?search= ?isProspect=), POST
    │   ├── [id]/route.ts       # GET, PATCH, DELETE (soft delete + cascade)
    │   └── existing/route.ts   # POST — import khách hàng cũ
    ├── activities/
    │   ├── route.ts            # GET (?type= ?outcome= ?clientId= ?search=), POST + side effects
    │   └── [id]/route.ts       # GET, PATCH, DELETE
    ├── tasks/
    │   ├── route.ts            # GET, POST
    │   └── [id]/route.ts       # PATCH (auto set/clear completedAt), DELETE
    └── documents/
        ├── route.ts            # GET (filter theo client.ownerId), POST
        └── [id]/route.ts       # PATCH, DELETE (guard: client.ownerId === me hoặc manager)
```

---

## 6. Store Architecture

| Store | State | Key Selectors |
|---|---|---|
| `useAuthStore` | session user, role | `useCurrentUser()`, `useIsManager()`, `useIsSalesperson()` |
| `useUsersStore` | users[] | `useUserById()`, `useSalespersons()` |
| `useClientStore` | clients[] | `useClientsWithStats(opps)`, `useClientIndustries()`, `useTopClientsByValue(opps, limit)` |
| `useOpportunityStore` | opportunities[] | `useStatsByStatus()`, `useMonthlyChartData()`, `useForecastRevenue()`, `useTopClients()`, `useStaleLeads(activities)`, `useOverdueTasks(activities)`, `useReminders(activities)` |
| `useActivityStore` | activities[] | `useActivitiesByType()`, `useActivitiesByOutcome()`, `useRecentActivities()`, `useActivitiesForClient()` |
| `useTaskStore` | tasks[] | `useTasksForClients(Set)` |
| `useDocumentStore` | documents[] | `useDocumentsForClient()`, `toggleStar()` |
| `useToastStore` | toasts[] | `toast.success/error/warning/info()` |

**Quy tắc cross-store**: Stores không import lẫn nhau. Selectors cần data từ store khác nhận tham số thay vì import trực tiếp. Ví dụ: `useStaleLeads(activities: Activity[])` thay vì import `useActivityStore` bên trong `useOpportunityStore`.

---

## 7. Phân vai trang

| Trang | Sales thấy | Manager thấy | Ghi chú |
|---|---|---|---|
| `/leads` | `ownerId === me` | Tất cả | Workspace chính của sales |
| `/opportunities` | `ownerId === me` | Tất cả | Read-only |
| `/clients` | `ownerId === me` & `isProspect=false` | Tất cả | Sửa/Xóa ẩn nếu non-owner |
| `/activities` | Client có `ownerId === me` | Tất cả | Filter qua `ownerClientIds` Set |
| `/documents` | Client có `ownerId === me` | Tất cả | OwnerFilter dropdown cho Manager |
| `/forecast` | ❌ redirect `/` | ✅ Full access | Manager only |
