# Nyxus CRM — Kiến trúc tổng quan

## Prompt khởi động cho new chat

```
Bạn là claude desktop.
Đọc toàn bộ D:\nyxus\REFACTOR.md trước khi làm bất cứ việc gì.
File này chứa kiến trúc và workflow của toàn hệ thống.
Nếu cần chi tiết hơn, đọc D:\nyxus\docs\ theo hướng dẫn trong START_HERE.md.
```

---

## Stack

**Next.js App Router · JSON file DB · Zustand stores**

```
data/*.json          — dữ liệu thô
src/app/api/         — API routes (Next.js route handlers)
src/store/           — Zustand stores + selectors
src/app/             — Pages
src/components/      — UI components
src/lib/             — Helpers (json-db, auth, utils)
src/types/index.ts   — Tất cả types
```

---

## Data Model

### Quan hệ FK

```
clients.json
  └─ opportunities.json   (clientId FK)
       └─ activities.json  (clientId + opportunityId FK)
            └─ tasks.json   (clientId + opportunityId FK)
            └─ documents.json (clientId + opportunityId? FK)
users.json                (độc lập — auth + ownership)
```

### Client
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | string | |
| `ownerId` | FK → User | Sales phụ trách |
| `isProspect` | boolean | `true` = đang trong Leads pipeline, `false` = đã Won hoặc import |
| `archivedAt?` | ISO date | Soft delete — ẩn khỏi toàn bộ UI nhưng không xóa DB |
| `tags` | ClientTag[] | `enterprise`, `mid-market` lưu DB; `warm`, `cold`, `new-lead`, `priority` computed |

### Opportunity
| Field | Type | Ghi chú |
|-------|------|---------|
| `clientId` | FK → Client | |
| `ownerId` | FK → User | Denormalized từ client |
| `status` | enum | Lead · Qualified · Proposal · Negotiation · Won · Lost |
| `confidence` | 0–100 | Gắn cứng theo stage, fine-tune trong range |

**Confidence theo stage:**

| Stage | Default | Fine-tune range |
|-------|---------|-----------------|
| Lead | 15% | Cố định |
| Qualified | 35% | 20–50% |
| Proposal | 60% | 45–75% |
| Negotiation | 80% | 70–90% |
| Won | 100% | Cố định |
| Lost | 0% | Cố định |

### Activity
- Log thủ công — không tự sinh
- Fields: `type`, `outcome`, `nextAction`, `nextActionDate`, `promoteOpportunityTo?`
- POST side effects: cập nhật `lastContactDate` trên opp; nếu `promoteOpportunityTo=Won` → set `client.isProspect=false`

### Task
- `status: pending | done`
- `createdFrom?: activityId` — nếu auto-tạo từ nextAction của activity
- PATCH auto set/clear `completedAt`

### Document
- Metadata-only — `url: null` là placeholder, không lưu binary
- `type`: pdf · doc · xls · img · other
- `category`: Hợp đồng · Đề xuất · Báo cáo · Hoá đơn
- Visibility: Sales thấy docs có `client.ownerId === me`; Manager thấy tất cả
- Mutate (PATCH/DELETE): guard qua `client.ownerId`, không qua `doc.ownerId`

### User
- `role: salesperson | manager`
- `passwordHash` — plain-text trong dev (nâng bcrypt khi prod)
- **Demo:** `sale@nyxus.vn / sale123` · `manager@nyxus.vn / manager123`

---

## Auth & Phân quyền

- JWT trong `httpOnly` cookie (`nyxus_session`, TTL 8h)
- `middleware.ts` guard tất cả route, redirect `/login` nếu chưa đăng nhập
- `requireSession()` / `requireRole()` trong API routes
- UI selectors: `useCurrentUser()` · `useIsManager()` · `useIsSalesperson()`

### Nguyên tắc ownership

> **Ownership nằm ở Client, không phải resource con.**
> Sales A phụ trách client → thấy và thao tác được mọi opp/activity/task/document của client đó.
> Manager bypass toàn bộ — thấy và làm được mọi thứ.

| Thao tác | Sales (owner) | Sales (non-owner) | Manager |
|----------|:---:|:---:|:---:|
| View resource | ✅ | ❌ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit | ✅ | ❌ | ✅ |
| Delete client | ❌ soft-delete | ❌ | ✅ |
| Assign Lead | ❌ | ❌ | ✅ |

---

## Phân vai trang

| Trang | Sales thấy | Manager thấy | Ghi chú |
|-------|------------|--------------|---------|
| `/leads` | `ownerId === me` | Tất cả | Workspace chính của sales |
| `/opportunities` | `ownerId === me` | Tất cả | Read-only — không có action |
| `/clients` | `ownerId === me` & `isProspect=false` | Tất cả | Sửa/Xóa ẩn nếu non-owner |
| `/activities` | Client có `ownerId === me` | Tất cả | Filter qua `ownerClientIds` Set |
| `/documents` | Client có `ownerId === me` | Tất cả | OwnerFilter dropdown cho Manager |
| `/forecast` | ❌ redirect `/` | ✅ Full access | Manager-only |

---

## Workflows

### Tạo Lead
```
POST /api/leads
  → Client(isProspect=true) + Opportunity(status=Lead, confidence=15%)
  → Optional: Task "liên hệ đầu tiên" (không phải Activity)
```

### Thăng stage
```
PromoteModal → chọn stage
  → PATCH /api/opportunities/[id]
  → confidence reset về default của stage mới
  → Won/Lost: confirm dialog trước khi thực thi
  → Won: client.isProspect=false → biến mất khỏi Leads, xuất hiện ở Clients
```

### Import khách hàng cũ
```
POST /api/clients/existing
  → Client(isProspect=false) + Opportunity(status=Won, confidence=100%)
```

### Log Activity
```
AddActivityModal (step 1)
  → POST /api/activities
  → side effects: lastContactDate, promote opp nếu có promoteOpportunityTo
  → nếu nextAction → step 2: confirm tạo Task follow-up
```

### Soft delete Client
```
DELETE /api/clients/[id]
  → archivedAt = today
  → cascade: xóa opps chưa Won + tasks pending
  → giữ: activities, tasks done, opps Won
  → confirm dialog nếu có deal đang mở
```

### Upload Document
```
UploadDocModal
  → chọn client (searchable, chỉ thấy client của mình)
  → chọn deal (optional, filter theo clientId)
  → POST /api/documents → metadata vào documents.json
```

---

## Smart Tags

Computed khi render — không lưu DB:

| Tag | Điều kiện |
|-----|-----------|
| `new-lead` | `client.createdAt` < 7 ngày trước |
| `warm` | `opp.lastContactDate` < 14 ngày trước |
| `cold` | `opp.lastContactDate` > 30 ngày VÀ không phải `new-lead` |
| `priority` | Tổng value tất cả opp > $50,000 |

Tags thủ công `enterprise`, `mid-market` lưu trong DB, không bị override.

---

## Stores

| Store | Chức năng chính |
|-------|-----------------|
| `useAuthStore` | Session user, role selectors |
| `useUsersStore` | Danh sách users, `useUserById()`, `useSalespersons()` |
| `useClientStore` | CRUD client, addLead, addExistingClient, assignLead |
| `useOpportunityStore` | CRUD opp, updateStatus |
| `useActivityStore` | CRUD activity |
| `useTaskStore` | CRUD task, toggleDone, `useTasksForClients(Set)` |
| `useDocumentStore` | CRUD document, toggleStar, `useDocumentsForClient()` |
| `useToastStore` | Global toast — `toast.success/error/warning/info()` |

**Pattern chung:** fetch một lần khi mount, optimistic local update, rollback nếu API lỗi.

---

## API Routes

| Route | Methods | Ghi chú |
|-------|---------|---------|
| `/api/auth/login` | POST | Set JWT cookie |
| `/api/auth/me` | GET | Session user hiện tại |
| `/api/auth/logout` | POST | Clear cookie |
| `/api/users` | GET | Không trả `passwordHash`, filter `?role=` |
| `/api/clients` | GET, POST | |
| `/api/clients/[id]` | GET, PATCH, DELETE | DELETE = soft delete + cascade |
| `/api/clients/existing` | POST | Import khách hàng cũ |
| `/api/leads` | POST | Tạo Lead (Client + Opp) |
| `/api/leads/[id]/assign` | PATCH | Manager only |
| `/api/opportunities` | GET, POST | |
| `/api/opportunities/[id]` | GET, PATCH, DELETE | |
| `/api/activities` | GET, POST | POST: side effects lastContactDate + promote |
| `/api/tasks` | GET, POST | |
| `/api/tasks/[id]` | PATCH, DELETE | PATCH auto set/clear `completedAt` |
| `/api/documents` | GET, POST | GET filter theo `client.ownerId` |
| `/api/documents/[id]` | PATCH, DELETE | Guard: `client.ownerId === me` hoặc manager |

---

## Components quan trọng

```
src/components/ui/
  TopNav.tsx            — Nav + logout (confirm dialog trước khi logout)
  OwnerBadge.tsx        — Avatar inline, chỉ hiện với manager
  OwnerFilter.tsx       — Dropdown lọc theo sales, chỉ hiện với manager
  TagBadge.tsx          — isComputed=true → style ⚡
  ToastContainer.tsx    — Render toast stack, bottom-right, auto-dismiss
  ConfirmDialog.tsx     — Reusable confirm, variant: danger/warning/info

src/components/clients/
  ClientCard.tsx        — OwnerBadge góc dưới (manager only)
  DetailPanel.tsx       — Tab "Cơ hội" + Tab "Tài liệu"; canEdit guard
  ClientFormModal.tsx   — Edit client
  ExistingClientModal.tsx — Import khách hàng cũ

src/components/leads/
  LeadCard.tsx          — Tags row h-[46px] cố định; status bar bottom
  LeadModal.tsx         — Tạo lead + optional task đầu tiên
  PromoteModal.tsx      — Thăng stage; Won/Lost có confirm dialog thêm
  AssignLeadModal.tsx   — Manager only

src/components/activities/
  AddActivityModal.tsx  — 2 bước: log → confirm task follow-up
  KpiBar.tsx            — Tính trên visibleActivities (filter theo owner)

src/components/tasks/
  TaskCard.tsx          — Badge "⚡ Từ hoạt động"; badge overdue
  TaskModal.tsx         — Tạo task thủ công

src/components/documents/
  UploadDocModal.tsx    — Searchable client select (chỉ client của mình);
                          deal select filter theo clientId; clientId pre-fillable
```
