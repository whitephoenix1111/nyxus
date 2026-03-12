# Nyxus CRM — Tài liệu kiến trúc

## 🚀 PROMPT KHỞI ĐỘNG CHO NEW CHAT

```
Bạn là claude desktop.
Trước khi làm bất cứ việc gì, hãy đọc toàn bộ file D:\nyxus\REFACTOR.md —
có ngữ cảnh kiến trúc, tiến độ từng bước (✅ = done, 🔲 = chưa làm).
Sau khi đọc xong, tìm bước 🔲 đầu tiên và hỏi tôi có muốn bắt đầu không.
```

---

## Trạng thái các Phase

| Phase | Mô tả | Trạng thái |
|-------|-------|------------|
| Phase 1 | Refactor Lead → Client (isProspect) | ✅ |
| Phase 2 | Redesign Activities + hệ thống Task | ✅ |
| Phase 3 | Activity-based workflow (logic cứng) | ✅ |
| Phase 4 | Fix cascade delete (tasks mồ côi) | ✅ |
| Phase 5 | Phân vai trang Leads vs Cơ hội, read-only Opportunities | ✅ |
| Phase 6 | Soft delete client, confirm dialog, khách hàng hiện có | ✅ |
| Phase 7 | Role-based Auth (JWT cookie, middleware, API guard, UI layer) | ✅ |
| Phase 8 | Owner Model (ownerId trên Client/Opp, filter theo owner, Assign Lead) | ✅ |
| Phase 9 | Granular permission matrix + Owner visibility cho Manager | ✅ |
| Phase 10 | Dual-mode Dashboard (Manager view + Sales personal view) | ✅ |
| Phase 11 | TeamLeaderboard widget, fix Manager quyền Leads, OwnerFilter custom dropdown | ✅ |

---

## Stack & Kiến trúc

**Stack:** Next.js App Router · JSON file DB · Zustand stores

**Data files:** `data/*.json`  
**API routes:** `src/app/api/`  
**Stores:** `src/store/`  
**Pages:** `src/app/`  
**Components:** `src/components/`

**Data model (quan hệ FK):**
```
clients.json
  └─ opportunities.json  (clientId FK)
       └─ activities.json (clientId + opportunityId FK)
            └─ tasks.json  (clientId + opportunityId FK)
users.json               (độc lập — auth + ownership)
```

---

## Auth & Phân quyền

**Auth stack:**
- JWT trong `httpOnly` cookie (`nyxus_session`, TTL 8h)
- `middleware.ts` guard tất cả route — redirect `/login` nếu chưa đăng nhập
- API guard: `requireRole` / `requireOwnerOrManager` tại mutating endpoints
- UI: `useCurrentUser()` / `useIsManager()` / `useIsSalesperson()` từ `useAuthStore`
- `data/users.json` — passwordHash plain-text (nâng lên bcrypt khi cần)

**Tài khoản demo:** `sale@nyxus.vn / sale123` — `manager@nyxus.vn / manager123`

**Ma trận quyền trên Lead (Phase 9):**

| Thao tác | Sales (Owner) | Sales (Non-owner) | Manager |
|----------|:---:|:---:|:---:|
| Create Lead | ✅ | ✅ | ✅ |
| View Lead | ✅ | ❌ | ✅ toàn bộ |
| Edit Lead | ✅ | ❌ | ✅ toàn bộ |
| Delete Lead | ❌ (soft-delete) | ❌ | ✅ |
| Assign Lead | ❌ | ❌ | ✅ toàn bộ |

**Quy tắc owner check:**
- `Owner` = `resource.ownerId === currentUser.id`
- Sales chỉ thấy và thao tác được resource của chính mình
- Manager bypass toàn bộ owner check — thấy và làm được mọi thứ
- Guard thực thi ở cả **API layer** và **UI layer** (ẩn nút nếu không có quyền)

---

## Phân vai trang

| Trang | Sales thấy | Manager thấy | Ghi chú |
|-------|------------|--------------|---------|
| `/leads` | Leads có `ownerId === me` | Tất cả leads | Sales Non-owner không thấy lead người khác |
| `/opportunities` | Opps có `ownerId === me` | Tất cả opps | Read-only hoàn toàn — không có action |
| `/activities` | Activities + Tasks của client mình | Tất cả | Filter qua `ownerClientIds` Set |
| `/clients` | Clients có `ownerId === me` | Tất cả clients | Nút Sửa/Xóa ẩn nếu non-owner |
| `/forecast` | ❌ Redirect về `/` | ✅ Full access | Manager-only page |

---

## Owner Visibility cho Manager (Phase 9)

Manager cần biết khách/lead thuộc về sales nào để giám sát team.

**Cách thực hiện — không build trang riêng, 2 điểm chạm:**

**1. `OwnerBadge` component** (`src/components/ui/OwnerBadge.tsx`):
- Avatar 2 chữ của sales owner, render inline trên card
- Chỉ hiển thị khi `isManager === true` — Sales không thấy
- Dùng trên: `ClientCard` (góc dưới cạnh "Liên hệ cuối"), `LeadCard` (cạnh StaleTag góc trên phải)

**2. `OwnerFilter` component** (cùng file `OwnerBadge.tsx`):
- Dropdown `<select>` lọc theo salesperson
- Chỉ render khi `isManager === true` và có salesperson trong store
- Dùng ở toolbar của: `/leads`, `/opportunities`, `/clients`

**Data flow:**
- `useUsersStore` (`src/store/useUsersStore.ts`) — fetch `GET /api/users` một lần khi mount
- `useUserById(ownerId)` — resolve ownerId → User object
- `useSalespersons()` — chỉ lấy role=salesperson cho dropdown
- Các page chỉ `fetchUsers()` khi `isManager === true` — tránh load thừa với sales

---

## Data Model chi tiết

**Client:**
- `ownerId` — FK → User.id (sales phụ trách)
- `isProspect: boolean` — true = đang trong pipeline Leads, false = đã Won hoặc import
- `archivedAt?: string` — soft delete, set khi "Xóa"

**Opportunity:**
- `ownerId` — FK → User.id (denormalized từ client)
- `clientId` — FK → Client.id
- `status` ∈ {Lead, Qualified, Proposal, Negotiation, Won, Lost}
- `confidence` — gắn cứng theo stage, fine-tune trong range

**Confidence mặc định theo stage:**

| Stage | Default | Fine-tune |
|-------|---------|-----------|
| Lead | 15% | ❌ Cố định |
| Qualified | 35% | ±15% (20–50%) |
| Proposal | 60% | ±15% (45–75%) |
| Negotiation | 80% | ±10% (70–90%) |
| Won | 100% | ❌ Cố định |
| Lost | 0% | ❌ Cố định |

**Activity:** log thủ công — không tự sinh. Có `clientId`, `opportunityId`.  
**Task:** việc cần làm, `status: pending|done`, `assignedTo` (text tự do), `createdFrom?: activityId`.

---

## Soft Delete (Phase 6)

- Không có hard delete client — nút "Xóa" = archive (`archivedAt = today`)
- Cascade khi archive: xóa opps chưa Won + tasks pending; giữ activities + tasks done + opps Won
- Client có `archivedAt` bị lọc khỏi mọi selector — ẩn khỏi toàn bộ UI
- Confirm dialog nếu client có deal đang mở — logic trong `DetailPanel.tsx`

---

## Workflow nghiệp vụ

### Leads (`/leads`) — Salesperson workspace
- Tạo lead → `POST /api/leads` → Client(isProspect=true) + Opportunity(status=Lead, 15%)
- LeadModal có section "lên lịch liên hệ đầu tiên" (optional) → tạo Task, không phải Activity
- LeadCard badge cam "⚠ Chưa có task nào đang chờ" khi `hasPendingTask=false`
- **Thăng stage** → PromoteModal → `PATCH /api/opportunities/[id]` → confidence reset về default
- Promote lên Won → `client.isProspect=false` → biến mất khỏi Leads, xuất hiện ở Clients
- Xóa opp cuối → cascade xóa client prospect + tasks pending

### Opportunities (`/opportunities`) — Read-only overview
- Manager: thấy toàn bộ. Sales: chỉ thấy `ownerId === me`
- `OwnerFilter` dropdown để Manager lọc theo từng sales
- Sort/filter: stage, giá trị, confidence, ngày — không có action nào

### Clients (`/clients`) — Khách hàng đã chốt
- Hiển thị `isProspect=false && !archivedAt`
- Manager: thấy tất cả. Sales: chỉ thấy `ownerId === me`
- `DetailPanel.canEdit = isManager || client.ownerId === currentUser.id` — ẩn Sửa/Xóa với non-owner
- Button "Khách hàng hiện có" chỉ hiện với salesperson (`canCreate`)
- Flow import: `POST /api/clients/existing` → tạo Client(isProspect=false) + Opportunity(Won, 100%)

### Activities (`/activities`)
- **Sales**: chỉ thấy activity và task của client có `ownerId === me`
- **Manager**: thấy toàn bộ
- Filter qua `ownerClientIds: Set<string> | null` — null = Manager (bỏ qua filter)
- `TaskPanel` nhận prop `ownerClientIds` — lọc qua selector `useTasksForClients()`
- KpiBar tính trên `visibleActivities`
- Thêm activity → AddActivityModal step 1 → nếu có nextAction → step 2 confirm tạo Task
- Toggle task → `PATCH /api/tasks/[id]` → auto set/clear `completedAt`

### Dashboard (`/`) — 🔲 Phase 10: Dual-mode Dashboard
- KPI từ opportunities + activities
- Widget: overdue tasks, stale deals (>3 ngày không liên hệ), expiring proposals (>14 ngày)

**Hiện trạng:** Dashboard hiển thị số liệu toàn team, không filter theo owner — mâu thuẫn với phân quyền đã làm ở tất cả trang khác. Sales thấy số liệu của cả team, vô nghĩa.

**Kế hoạch Phase 10 — Hướng A: Một dashboard, 2 chế độ hiển thị:**

**Manager view (giữ nguyên layout, bổ sung filter):**
- StatCard 4 cột (Lead/Proposal/Negotiation/Won) — toàn team
- KPIScatterChart + KPISummary — tổng doanh thu, open quotes, tổng opps
- OwnerFilter dropdown để xem riêng từng sales (dùng `OwnerFilter` component đã có)
- Reminders — toàn team, filter theo owner khi chọn
- Top 25 clients — toàn team, filter theo owner khi chọn

**Sales view (thay layout macro bằng widget cá nhân):**
- Ẩn: KPIScatterChart, KPISummary (quá macro, không liên quan)
- Thay StatCard toàn team bằng **4 số cá nhân**: leads đang có, tổng pipeline, deals won tháng này, tasks đang chờ
- Widget **"Việc cần làm hôm nay"** (thay thế vị trí KPI panel): danh sách tasks overdue + due today của chính sales đó, sort theo urgency
- Reminders — chỉ của client mình (stale deals, overdue tasks, expiring proposals)
- Bỏ Top 25 clients — thay bằng **"Leads cần liên hệ"**: leads của mình sort theo stale nhất

**Cách phân nhánh:** `isManager` từ `useIsManager()` — không tách route, không tách component file, dùng conditional render trong cùng `page.tsx`.

**Filter data cho Sales view:**
- Opportunities: filter `ownerId === currentUser.id` trước khi truyền vào tất cả selectors
- Tasks: dùng `useTasksForClients(ownerClientIds)` đã có
- Reminders: truyền `visibleOpps` thay vì toàn bộ store vào `useReminders()`
- Cần kiểm tra `useReminders`, `useStaleLeads`, `useOverdueTasks`, `useExpiringProposals` trong `useOpportunityStore.ts` — hiện các selector này nhận `activities` từ ngoài truyền vào nhưng lấy `opps` trực tiếp từ store, cần refactor để nhận `opps` làm param hoặc filter sau khi gọi

**Files cần sửa:**
- `src/app/page.tsx` — thêm `isManager` check, tách 2 layout
- `src/store/useOpportunityStore.ts` — refactor selectors `useStaleLeads`, `useExpiringProposals` để có thể filter theo owner (hoặc filter kết quả ở page level)
- `src/components/dashboard/` — có thể tạo thêm `TodayTasksWidget.tsx`, `PersonalStatCard.tsx` nếu cần

### Forecast (`/forecast`) — Manager only
- `opportunity.value * confidence / 100`
- Bao gồm Won từ import "Khách hàng hiện có" (confidence=100%)
- Salesperson bị redirect về `/`

---

## Stores

| Store | File | Chức năng chính |
|-------|------|-----------------|
| `useAuthStore` | `store/useAuthStore.ts` | Session user, role selectors |
| `useUsersStore` | `store/useUsersStore.ts` | Danh sách users, resolve ownerId → User, filter salesperson |
| `useClientStore` | `store/useClientStore.ts` | CRUD client, addLead, addExistingClient, assignLead |
| `useOpportunityStore` | `store/useOpportunityStore.ts` | CRUD opp, updateStatus, selectors forecast/stale/overdue |
| `useActivityStore` | `store/useActivityStore.ts` | CRUD activity |
| `useTaskStore` | `store/useTaskStore.ts` | CRUD task, toggleDone, selectors pending/overdue/forClients |

**Selectors quan trọng:**
- `useClientsWithStats(opportunities)` — join Client + Opportunity, lọc `isProspect=false && !archivedAt`
- `useTasksForClients(clientIds: Set<string>)` — filter tasks theo tập clientId (dùng cho Activities page)
- `useSalespersons()` — chỉ lấy role=salesperson (dùng cho OwnerFilter dropdown)
- `useUserById(id)` — resolve ownerId → User (dùng cho OwnerBadge)

---

## API Routes

| Route | Methods | Ghi chú |
|-------|---------|---------|
| `/api/auth/login` | POST | Set JWT cookie |
| `/api/auth/me` | GET | Trả về session user |
| `/api/auth/logout` | POST | Clear cookie |
| `/api/users` | GET | Danh sách users (không có passwordHash), filter `?role=` |
| `/api/clients` | GET, POST | |
| `/api/clients/[id]` | GET, PATCH, DELETE | DELETE = soft delete + cascade |
| `/api/clients/existing` | POST | Tạo Client(isProspect=false) + Opportunity(Won) |
| `/api/leads` | POST | Tạo Client(isProspect=true) + Opportunity(Lead 15%) |
| `/api/leads/[id]/assign` | PATCH | Manager only — đổi ownerId |
| `/api/opportunities` | GET, POST | |
| `/api/opportunities/[id]` | GET, PATCH, DELETE | |
| `/api/activities` | GET, POST | POST có side effects: lastContactDate, promote opp, isProspect→false khi Won |
| `/api/tasks` | GET, POST | |
| `/api/tasks/[id]` | PATCH, DELETE | PATCH auto set/clear completedAt |

---

## Components quan trọng

```
src/components/ui/
  OwnerBadge.tsx        — OwnerBadge (avatar sales, chỉ hiện với manager)
                          OwnerFilter (dropdown lọc theo sales, chỉ hiện với manager)

src/components/clients/
  ClientCard.tsx        — có OwnerBadge góc dưới (manager only)
  DetailPanel.tsx       — canEdit default=false; Sửa/Xóa ẩn nếu canEdit=false
  ClientFormModal.tsx   — edit mode
  ExistingClientModal.tsx — import khách hàng cũ

src/components/leads/
  LeadCard.tsx          — có OwnerBadge cạnh StaleTag (manager only)
  LeadModal.tsx         — prop showFirstTask=true khi tạo mới
  PromoteModal.tsx      — thăng stage + reset confidence
  AssignLeadModal.tsx   — manager only, chuyển owner

src/components/activities/
  AddActivityModal.tsx  — 2 step: log activity → confirm task follow-up
  ActivityCard.tsx
  KpiBar.tsx

src/components/tasks/
  TaskCard.tsx          — badge "⚡ Từ hoạt động" nếu createdFrom; badge overdue
  TaskModal.tsx         — tạo task thủ công
```
