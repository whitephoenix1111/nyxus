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

## Trạng thái refactor (tính đến 2026-03-14)

### ✅ Đã hoàn thành toàn bộ

Toàn bộ schema cleanup + migration + store + API + component đã xong.
Không còn file nào dùng các field cũ.

**Những gì đã xóa khỏi schema:**

| Field | Bảng | Thay bằng |
|-------|------|-----------|
| `isProspect` | `clients` | `useClientStatus(clientId)` selector |
| `lastContactDate` | `opportunities` | `MAX(activities.date)` tính động |
| `clientName`, `company` | `opportunities`, `activities`, `tasks`, `documents` | Join từ `clients[clientId]` |
| `avatar` | `opportunities` | Join từ `clients[clientId].avatar` |
| `ownerId` | `documents` | Đổi tên thành `uploadedBy` |

**Những gì đã thêm:**

| Field/Selector | Nơi | Ghi chú |
|----------------|-----|---------|
| `title: string` | `opportunities` | Tên ngắn của deal |
| `useClientStatus()` | `useClientStore` | `'active' \| 'won' \| 'no-deal'` |
| `lastContactByClient` map | `useLeadsPage` | Tính từ activities |
| `computeClientTags(client, opps, activities)` | `computeClientTags.ts` | Thêm param `activities` |

---

## Data Model

### Triết lý thiết kế

Hệ thống có **6 bảng hạt nhân** xếp thành 4 layer:

```
LAYER 1 — IDENTITY   : users · clients
LAYER 2 — PIPELINE   : opportunities
LAYER 3 — ACTIVITY   : activities · tasks
LAYER 4 — ASSETS     : documents
```

**`clients` là trung tâm hấp dẫn** — mọi bảng còn lại đều neo vào `clientId`.
**`opportunities` tách biệt khỏi `clients`** vì một client có thể phát sinh nhiều deal độc lập
(upsell, renewal, new product line). Quan hệ là **1 client : N opportunities**.

### Quan hệ FK

```
users.json
  └─ clients.json              (ownerId FK → users)
       └─ opportunities.json   (clientId FK → clients, ownerId FK → users)
            └─ activities.json  (clientId FK, opportunityId? FK)
                 └─ tasks.json  (clientId FK, opportunityId? FK, createdFrom? FK → activities)
            └─ documents.json   (clientId FK, opportunityId? FK, uploadedBy FK → users)
```

### Client

| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | string | |
| `ownerId` | FK → User | Sales phụ trách — **ownership của toàn bộ resource con** |
| `name` | string | |
| `company` | string | |
| `avatar` | string | Initials 2 ký tự |
| `email` | string | |
| `phone` | string | |
| `industry` | string | English key, dịch sang VI ở UI layer |
| `country` | string | |
| `website` | string | |
| `tags` | ClientTag[] | Chỉ lưu `enterprise`, `mid-market` — các tag còn lại là computed |
| `notes` | string | |
| `createdAt` | ISO date | |
| `archivedAt?` | ISO date | Soft delete — ẩn khỏi UI, giữ trong DB |

> `isProspect` **đã bị xóa**. Trạng thái client suy ra từ opportunities:
> - Client có ≥1 opp active (không phải Won/Lost) → hiện ở `/leads`
> - Client có ≥1 Won VÀ không còn opp active → hiện ở `/clients`
> - Client chỉ có Lost / không có opp → không hiện ở đâu
> - Client có `archivedAt` → hiện ở tab "Đã lưu trữ" trong `/clients`

### Opportunity

| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | string | |
| `clientId` | FK → Client | |
| `ownerId` | FK → User | Copy từ client khi tạo |
| `title` | string | Mô tả ngắn deal — VD: "Gói Enterprise Q3" |
| `value` | number | USD |
| `status` | enum | Lead · Qualified · Proposal · Negotiation · Won · Lost |
| `confidence` | 0–100 | Theo stage, fine-tune trong range |
| `date` | ISO date | Ngày tạo deal |
| `notes?` | string | |
| `statusHistory?` | array | Lịch sử promote, append-only |

> `clientName`, `company`, `avatar`, `lastContactDate` **đã bị xóa**.
> - Tên/công ty/avatar → join từ `clients[clientId]`
> - lastContact → `MAX(activities.date WHERE clientId = x)` tính động

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

Fields: `id`, `clientId` (FK), `opportunityId?` (FK), `type`, `title`, `date`, `outcome`,
`nextAction`, `nextActionDate?`, `promoteOpportunityTo?`, `notes`, `createdAt`

> `clientName`, `company` **đã bị xóa**.
> POST side effect: nếu `promoteOpportunityTo` có giá trị → API tự promote opp.
> `lastContactDate` trên opp **không còn được cập nhật** — field đó đã xóa.

### Task

Fields: `id`, `clientId` (FK), `opportunityId?` (FK), `title`, `status`, `dueDate?`,
`assignedTo?` (FK → User.id), `createdFrom?` (FK → Activity.id), `createdAt`, `completedAt?`

> `clientName`, `company` **đã bị xóa**.
> `assignedTo` là **FK → User.id** (không còn free text).
> API auto-inject: nếu caller là salesperson và không truyền `assignedTo` → server set `assignedTo = session.id`.

### Document

Fields: `id`, `clientId` (FK), `opportunityId?` (FK), `name`, `type`, `category`,
`size`, `url`, `starred`, `uploadedBy` (FK → User.id), `uploadedAt`

> `clientName`, `company` **đã bị xóa**.
> `ownerId` **đã đổi tên thành `uploadedBy`**.
> Guard PATCH/DELETE: qua `client.ownerId`, không qua `doc.uploadedBy`.

### User

- `role: salesperson | manager`
- **Demo:** `sale@nyxus.vn / sale123` · `manager@nyxus.vn / manager123`

---

## Smart Tags

Computed khi render — **không lưu DB**. Chỉ `enterprise` và `mid-market` lưu trong `clients.tags`.

| Tag | Điều kiện |
|-----|-----------|
| `new-lead` | `client.createdAt` < 7 ngày |
| `warm` | `MAX(activities.date)` của client < 14 ngày |
| `cold` | `MAX(activities.date)` của client > 30 ngày VÀ không phải `new-lead` |
| `priority` | Tổng value tất cả opp > $50,000 |

Signature: `computeClientTags(client, opportunities, activities)` — **bắt buộc truyền `activities`**.
Callers: `useClientsWithComputedTags(opps, activities)` · `useLeadsPage.clientTagsMap`

---

## DB hiện tại

- 21 clients: `cli-001`, `cli-003..cli-008`, `cli-010..cli-016`, `cli-017` (archived), `cli-018..cli-020`, `cli-023..cli-025`
- Hard deleted (không còn trong DB): `cli-002`, `cli-009`, `cli-021`, `cli-022`
- Activities đã xóa: `act-002`, `act-009`, `act-021`, `act-022`, `act-0c21bae0`

---

## Auth & Phân quyền

- JWT trong `httpOnly` cookie (`nyxus_session`, TTL 8h)
- `middleware.ts` guard tất cả route
- `requireSession()` / `requireRole()` trong API routes

### Nguyên tắc ownership

> Ownership nằm ở **Client.ownerId**, không phải resource con.

| Thao tác | Sales (owner) | Sales (non-owner) | Manager |
|----------|:---:|:---:|:---:|
| View | ✅ | ❌ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit | ✅ | ❌ | ✅ |
| Delete client | ❌ soft-delete | ❌ | ✅ |
| Assign Lead | ❌ | ❌ | ✅ |

---

## Phân vai trang

| Trang | Sales thấy | Manager thấy | Ghi chú |
|-------|------------|--------------|---------|
| `/leads` | opp active & `ownerId === me` | Tất cả | Không dùng `isProspect` |
| `/opportunities` | `ownerId === me` | Tất cả | Read-only |
| `/clients` | `ownerId === me` & có ≥1 Won & không có opp active | Tất cả | Xem thêm: Logic hiển thị clients |
| `/activities` | client có `ownerId === me` | Tất cả | |
| `/documents` | client có `ownerId === me` | Tất cả | |
| `/forecast` | ❌ redirect `/` | ✅ | Manager-only |

---

## Logic hiển thị clients & leads

### Quy tắc phân loại client theo opp status

```
Client có ≥1 opp active (Lead/Qualified/Proposal/Negotiation)
  → hiện ở /leads (tab "Đang theo dõi")

Client có ≥1 Won VÀ không còn opp active
  → hiện ở /clients

Client chỉ có Lost hoặc không có opp nào
  → không hiện ở đâu cả (chưa chốt được đọn nào)

Client có archivedAt (soft-deleted)
  → hiện ở tab "Đã lưu trữ" trong /clients (toggle button)
  → KHÔNG hiện ở /leads, /clients active, /opportunities
```

### Kho lưu trữ — 2 cơ chế riêng biệt

| Kho | Trigger | Nằm ở đâu | Cơ chế |
|-----|---------|-----------|--------|
| **Lưu trữ Clients** | Xóa client (soft delete) | Tab "Đã lưu trữ" trong `/clients` | `client.archivedAt` được set |
| **Lưu trữ Leads** | Xóa lead / promote sang Lost | Tab "Lưu trữ" trong `/leads` | `opp.status = 'Lost'` |

> Hai kho **dùng chung database** nhưng cơ chế hiển thị hoàn toàn khác nhau.
> Xóa lead KHÔNG soft-delete client — chỉ chuyển opp sang Lost.
> Xóa client soft-delete client — cascade xóa opps chưa Won.

### /clients — toggle "Đã lưu trữ"

- Nút **"Đã lưu trữ"** nằm trong filter bar (ngang hàng search, industry, owner filter)
- Khi bật: hiện archived clients với style mờ (`opacity: 0.5, grayscale: 0.4`)
- Trong `DetailPanel` của archived client: nút **"Mở lại"** (xanh lá) thay thế nút "Xóa" (đỏ)
- Mở lại: `PATCH /api/clients/[id] { archivedAt: null }` → API xóa field khỏi record
- **Lưu ý PATCH null**: API PATCH xử lý `null` = xóa field khỏi object (không phải set null).
  Truyền `undefined` sẽ bị `JSON.stringify` bỏ qua → không có tác dụng.

### /leads — tab "Lưu trữ"

- Tab "Lưu trữ" = filter `opp.status === 'Lost'`
- Xóa lead (trash icon + confirm) → `updateStatus(id, 'Lost')`, KHÔNG gọi `deleteOpportunity`
- Từ tab Lưu trữ: nút **"Reopen"** → `updateStatus(id, 'Lead')`

---

## API — Behaviors quan trọng

### GET /api/opportunities

Lọc ra opps thuộc client đã `archivedAt` — join `clients.json` mỗi request.
Client soft-deleted không còn lộ opps ra UI kể cả opps Won (giữ trong DB cho lịch sử).

```ts
const archivedClientIds = new Set(clients.filter(c => c.archivedAt).map(c => c.id));
let result = opps.filter(o => !archivedClientIds.has(o.clientId));
```

### PATCH /api/clients/[id]

Hỗ trợ **null = xóa field** (dùng cho restore archivedAt):

```ts
for (const key of Object.keys(body)) {
  if (body[key] === null) delete merged[key];
}
```

### DELETE /api/clients/[id] (soft delete + cascade)

```
archivedAt = today
Xóa: opps chưa Won + tasks pending
Giữ: activities, tasks done, opps Won
```

---

## Workflows

### Tạo Lead (client mới)

```
POST /api/leads
  → Client(tags=[], industry từ form) + Opportunity(title, status=Lead, confidence=15%)
  → Optional: Task "liên hệ đầu tiên"
```

### Thêm Deal mới cho client đã tồn tại

```
AddDealModal (từ ClientDetail — tab "Cơ hội")
  → POST /api/opportunities  { clientId, title, value, status, confidence }
  → ownerId copy từ client.ownerId tại API layer
```

### Thăng stage

```
PromoteModal → chọn stage
  → PATCH /api/opportunities/[id]  { status, confidence: STAGE_DEFAULT, statusHistory: [...prev, {from, to, date}] }
  → confidence reset về default của stage mới
  → statusHistory append entry mới (append-only, không xóa lịch sử)
  → Won/Lost: confirm dialog
```

### Log Activity

```
AddActivityModal (step 1)
  → POST /api/activities  { clientId, opportunityId?, type, outcome, nextAction, ... }
  → KHÔNG update lastContactDate (field đã xóa)
  → promote opp nếu có promoteOpportunityTo
  → nếu nextAction → step 2: confirm tạo Task follow-up
      - Sales: không có field "Giao cho" (API tự inject assignedTo = session.id)
      - Manager: có dropdown "Giao cho" chọn salesperson
```

### Tạo Task thủ công

```
TaskModal (từ TaskPanel)
  → Sales: không thấy field "Giao cho" → API inject assignedTo = session.id
  → Manager: có dropdown "Giao cho" chọn salesperson
  → POST /api/tasks
```

### Xóa Task

```
TaskPanel → click Trash2 → ConfirmDialog
  → onConfirm: deleteTask(id) → toast success/error
```

### Soft delete Client (từ /clients)

```
DetailPanel → click Xóa → confirm
  → DELETE /api/clients/[id]
  → archivedAt = today, cascade xóa opps chưa Won + tasks pending
  → store: removeByClientId(id) ngay lập tức + invalidate(['clients', 'opportunities', 'activities', 'tasks'])
  → Client chuyển vào tab "Đã lưu trữ"
```

### Restore Client (từ tab "Đã lưu trữ")

```
DetailPanel → click "Mở lại"
  → PATCH /api/clients/[id] { archivedAt: null }  ← null, không phải undefined
  → API xóa field archivedAt khỏi record
  → invalidate(['clients', 'opportunities'])  ← cần refetch opps vì đã bị removeByClientId trước đó
  → Client quay về /clients active
```

### Xóa Lead (từ /leads tab "Đang theo dõi")

```
LeadCard → click Trash → confirm
  → updateStatus(id, 'Lost')  ← KHÔNG gọi deleteOpportunity
  → opp.status = 'Lost', confidence = 0%
  → Lead biến khỏi tab "Đang theo dõi", hiện ở tab "Lưu trữ"
```

---

## Stores

| Store | Chức năng chính |
|-------|-----------------|
| `useAuthStore` | Session user, role selectors |
| `useUsersStore` | Danh sách users, `useUserById()`, `useSalespersons()` |
| `useClientStore` | CRUD client, addLead, addExistingClient, assignLead, `useClientStatus()`, `useClientsWithComputedTags(opps, activities)` |
| `useOpportunityStore` | CRUD opp, `updateStatus` tự populate `statusHistory`, `removeByClientId(clientId)` xóa ngay khỏi store |
| `useActivityStore` | CRUD activity |
| `useTaskStore` | CRUD task, toggleDone, `useTasksForClients(Set)` |
| `useDocumentStore` | CRUD document, toggleStar. `addDocument` nhận `AddDocumentPayload` (không có `uploadedBy` — server inject từ session) |
| `useToastStore` | Global toast |

### `removeByClientId(clientId)`

Xóa **tất cả** opps của client khỏi store ngay lập tức (không gọi API).
Dùng sau `deleteClient` thành công — API đã cascade trên DB, store cần đồng bộ ngay.
Sau đó `invalidate(['opportunities'])` sẽ refetch đúng lại từ API.

---

## API Routes

| Route | Methods | Ghi chú |
|-------|---------|---------|
| `/api/auth/login` | POST | |
| `/api/auth/me` | GET | |
| `/api/auth/logout` | POST | |
| `/api/users` | GET | Filter `?role=` |
| `/api/clients` | GET, POST | |
| `/api/clients/[id]` | GET, PATCH, DELETE | DELETE = soft delete + cascade; PATCH null = xóa field |
| `/api/clients/existing` | POST | Import khách hàng cũ |
| `/api/leads` | POST | Client + Opp đồng thời |
| `/api/leads/[id]/assign` | PATCH | Manager only |
| `/api/opportunities` | GET, POST | GET lọc opps của archived clients; POST độc lập |
| `/api/opportunities/[id]` | GET, PATCH, DELETE | |
| `/api/activities` | GET, POST | |
| `/api/tasks` | GET, POST | POST: salesperson → auto `assignedTo = session.id` nếu body không truyền |
| `/api/tasks/[id]` | PATCH, DELETE | Auto set/clear `completedAt` |
| `/api/documents` | GET, POST | `uploadedBy` = session.id (server inject, client không truyền) |
| `/api/documents/[id]` | PATCH, DELETE | Guard: `client.ownerId` |

---

## Components quan trọng

```
src/components/ui/
  TopNav.tsx, OwnerBadge.tsx, OwnerFilter.tsx
  TagBadge.tsx          — isComputed=true → style ⚡
  ToastContainer.tsx, ConfirmDialog.tsx

src/components/clients/
  ClientCard.tsx        — prop archived?: boolean → opacity 0.5 + grayscale khi archived
  DetailPanel.tsx       — prop onRestore?: (id) => void
                          Khi client.archivedAt: hiện nút "Mở lại" (xanh), ẩn nút "Xóa"
  ClientFormModal.tsx   — Edit client, KHÔNG tạo lead
  ExistingClientModal.tsx
  AddDealModal.tsx      — Thêm deal N cho client đã tồn tại (chưa tạo)

src/components/leads/
  LeadCard.tsx          — Props: opp, clientName, clientCompany, clientAvatar, lastContact
                          Trash icon → updateStatus('Lost'), không deleteOpportunity
  LostCard.tsx          — Props: opp, clientName, clientCompany, clientAvatar
  LeadModal.tsx         — Mode add: nhập clientName/company/industry; mode edit: nhập title
  PromoteModal.tsx      — Props: opp, clientName, clientCompany
  AssignLeadModal.tsx   — Props: opp, clientName, clientCompany

src/components/activities/
  AddActivityModal.tsx  — 2 bước: log → confirm task follow-up
                          Props: showAssignedTo (false = sales, true = manager)
  ActivityTaskStep.tsx  — Step 2: confirm task. showAssignedTo ẩn/hiện field "Giao cho"

src/components/tasks/
  TaskCard.tsx          — Join client.name/company và user.name từ store (không dùng field đã xóa)
  TaskModal.tsx         — Props: showAssignedTo (false = sales, true = manager)

src/components/dashboard/
  SalesDashboard.tsx    — Props: opportunities, activities, tasks, clients
  ManagerDashboard.tsx  — Props: opportunities, activities, tasks, clients
  StaleLeadsWidget.tsx  — Props: opportunities, clients, lastContactByClient (Map)
  ClientCard.tsx        — Props: opportunity, client? (join thủ công từ caller)
```

### Pattern `showAssignedTo`

Field "Giao cho" ẩn với **salesperson** ở mọi nơi tạo task:
- `TaskModal` — prop `showAssignedTo`, caller truyền `isManager`
- `AddActivityModal` → `ActivityTaskStep` — prop `showAssignedTo`, page truyền `isManager`

Lý do: sales chỉ thấy client của mình, task luôn thuộc về họ.
Giao cho người khác không có tác dụng vì UI filter theo `client.ownerId`, không theo `task.assignedTo`.
API xử lý phần còn lại: salesperson → `assignedTo = session.id` tự động.

---

## Việc còn lại (backlog)

### 🟡 Feature mới chưa làm

- `AddDealModal` — component chưa tạo (chỉ có spec trong REFACTOR.md)
- `DetailPanel` tab "Cơ hội": nút "Thêm deal" mở `AddDealModal`

---

## Nguyên tắc comment code

```
KHÔNG comment những gì code đã tự nói rõ.
CHỈ comment:
  1. "Tại sao" — lý do kiến trúc, business rule, trade-off
  2. Side effects không hiển nhiên
  3. Ngưỡng / magic number có ý nghĩa nghiệp vụ
  4. Guard clause có thể gây bug nếu xóa
  5. JSDoc trên public API
```

Format: `// src/path — mô tả` · section: `// ── Tên ─────────` · JSDoc trên export functions
