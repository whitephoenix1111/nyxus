# Nyxus CRM — Kế hoạch phát triển

## 🚀 PROMPT KHỞI ĐỘNG CHO NEW CHAT

```
Bạn là claude desktop.
Trước khi làm bất cứ việc gì, hãy đọc toàn bộ file D:\nyxus\REFACTOR.md —
có ngữ cảnh kiến trúc, tiến độ từng bước (✅ = done, 🔲 = chưa làm).
Sau khi đọc xong, tìm bước 🔲 đầu tiên và hỏi tôi có muốn bắt đầu không.
```

---

## Trạng thái

| Phase | Mô tả | Trạng thái |
|-------|-------|------------|
| Phase 1 | Refactor Lead → Client (isProspect) | ✅ |
| Phase 2 | Redesign Activities + hệ thống Task | ✅ |
| Phase 3 | Activity-based workflow (logic cứng) | ✅ |
| Phase 4 | Fix cascade delete (tasks mồ côi) | ✅ |
| Phase 5 | Phân vai trang Leads vs Cơ hội, read-only Opportunities | ✅ |
| Phase 6 | Soft delete client, confirm dialog, khách hàng hiện có | ✅ |

---

## Phân vai trang (Role-based UX — Auth chưa implement)

| Trang | Dành cho | Quyền |
|-------|----------|-------|
| `/leads` | Salesperson (làm việc hàng ngày) | Xem, tạo, sửa, thăng stage, xóa lead |
| `/opportunities` | Manager (quan sát pipeline) | Xem, filter, sort — **read-only hoàn toàn** |
| `/activities` | Salesperson | Log activity, tạo task |
| `/clients` | Cả hai | Xem clients đã Won; thêm khách hàng hiện có |
| `/forecast` | Manager | Xem dự báo doanh thu |

> ⚠️ Auth chưa có — phân vai đang ở tầng UI (ẩn/hiện button). API chưa enforce role.
> Khi implement auth: thêm `currentUser.role` vào session store, bọc guard ở API route.

---

## Kiến trúc

**Stack:** Next.js App Router · JSON file DB · Zustand stores  
**Paths:** `data/*.json` · `src/app/api/` · `src/store/` · `src/app/` · `src/components/`

**Data model:**
```
clients.json
  └─ opportunities.json  (clientId FK)
       └─ activities.json (clientId + opportunityId FK)
            └─ tasks.json  (clientId + opportunityId FK)
```

**Quy tắc nghiệp vụ:**
- `Client.isProspect = true` → hiển thị ở trang **Leads**
- `Client.isProspect = false` → set khi `Opportunity.status = Won` **hoặc** khi import qua flow "Khách hàng hiện có"
- Trang **Leads**: `isProspect=true` + status ∈ {Lead, Qualified, Proposal, Negotiation}
- Tab **Lưu trữ**: `isProspect=true` + `status=Lost`
- Trang **Clients**: `isProspect=false` **và** `archivedAt` không có (chưa bị archive)
- Xóa Opportunity cuối của prospect → cascade xóa Client
- `Activity` = việc đã xảy ra (log thủ công)
- `Task` = việc cần làm, có `status: pending|done`, `assignedTo`
- Task có `createdFrom: activityId` nếu tạo từ step 2 confirm trong AddActivityModal

**Quy tắc soft delete (Phase 6):**
- Không có hard delete client — nút "Xóa" thực chất là **lưu trữ** (archive)
- Khi archive client: set `archivedAt = today` trong `clients.json`
- Cascade kèm theo:
  - ✅ Giữ: `activities.json` — log lịch sử bất biến
  - ✅ Giữ: tasks có `status=done` — lịch sử hoàn thành
  - ✅ Giữ: opportunities có `status=Won` — lịch sử doanh thu
  - ❌ Xóa: opportunities chưa Won (đang mở)
  - ❌ Xóa: tasks có `status=pending`
- Client có `archivedAt` bị lọc ra khỏi selector `useClientsWithStats` → ẩn khỏi mọi UI
- **Chưa có trang "Khôi phục"** — archived client hiện chỉ tồn tại trong DB

**Quy tắc confirm dialog khi archive (Phase 6):**
- Nếu client có opportunity đang mở (status ∉ {Won, Lost}): hiện dialog cảnh báo với số lượng deal cụ thể
- Nếu không có deal mở: archive thẳng không hỏi
- Dialog nằm trong `DetailPanel.tsx`, dùng state `showConfirm`

---

## Confidence (%)

Gắn cứng với stage, không tự tính từ hành vi:

| Stage | Default | Fine-tune range |
|-------|---------|-----------------|
| Lead | 15% | ❌ Cố định |
| Qualified | 35% | ±15% (20–50%) |
| Proposal | 60% | ±15% (45–75%) |
| Negotiation | 80% | ±10% (70–90%) |
| Won | 100% | ❌ Cố định |
| Lost | 0% | ❌ Cố định |

- Promote stage → confidence reset về default của stage mới
- Range được định nghĩa trong `STAGE_CONFIDENCE_RANGE` (types/index.ts) nhưng **chỉ FE enforce**, API không validate
- Dùng cho Forecast: `value × confidence / 100`

---

## Quy tắc trang Cơ hội (read-only)

- Trang `/opportunities` **không có EditRow**, không có nút Thăng/Giáng
- Chỉ hiển thị: bảng tất cả Opportunity, sort/filter theo stage/giá trị/confidence/ngày
- **Không có button Thêm, không có xóa** — Opportunity không tồn tại độc lập
- Opportunity sinh ra từ 2 nguồn:
  1. Flow tạo Lead (`/leads` → LeadModal → `POST /api/leads`)
  2. Import khách hàng hiện có (`/clients` → ExistingClientModal → `POST /api/clients/existing`)
- Mọi thay đổi stage phải thực hiện từ `/leads` (LeadCard → PromoteModal)

---

## Cơ chế Activities

- **Không có activity tự sinh** — toàn bộ là log thủ công
- Tạo lead chỉ tạo Client + Opportunity, không tạo activity nào
- LeadModal có section "Lên lịch liên hệ đầu tiên" (optional) → tạo **task**, không phải activity
- Trang Leads hiện **tất cả stage** (Lead/Qualified/Proposal/Negotiation) của prospect — không lọc theo %

---

## Workflow "Khách hàng hiện có" (Phase 6)

Dành cho khách hàng đã hợp tác trước đây, **không qua pipeline Lead**. Đây là tính năng import/migration dữ liệu, không phải workflow bán hàng hàng ngày.

**Flow:**
1. User click button **"Khách hàng hiện có"** (btn-primary) ở góc phải header trang `/clients`
2. Modal `ExistingClientModal` mở — có thêm 2 field so với form thường:
   - `value` (USD) — **bắt buộc** — giá trị hợp đồng
   - `contractDate` — optional — ngày ký (nếu bỏ trống dùng ngày hôm nay)
3. Submit → `POST /api/clients/existing`
4. API tạo đồng thời:
   - `Client` với `isProspect: false` (xuất hiện ngay ở trang Clients)
   - `Opportunity` với `status: Won`, `confidence: 100` (xuất hiện ở trang Cơ hội)
5. Store gọi `fetchOpportunities()` sau khi save để sync trang Cơ hội

**Tại sao phải tạo Opportunity kèm theo:**
- Mọi client `isProspect=false` phải có ít nhất 1 opportunity Won để dữ liệu nhất quán
- Không có Opportunity → client không có giá trị trong Forecast và bị "mồ côi"
- Trang Cơ hội ghi nhận Won 100% — đúng với thực tế (đã ký hợp đồng)

**Files liên quan:**
- `src/app/api/clients/existing/route.ts` — API endpoint mới
- `src/app/clients/_components/ExistingClientModal.tsx` — modal mới
- `src/store/useClientStore.ts` — thêm action `addExistingClient`
- `src/app/clients/page.tsx` — wire button + modal

---

## Cấu trúc file

```
data/
  clients.json · opportunities.json · activities.json · tasks.json

src/types/index.ts
  Client.archivedAt?: string   ← thêm Phase 6, soft delete

src/store/
  useClientStore.ts
    — fetchClients
    — addClient         (dùng nội bộ, không expose ra UI)
    — addLead           → POST /api/leads
    — addExistingClient → POST /api/clients/existing  ← thêm Phase 6
    — updateClient
    — deleteClient      → soft delete (set archivedAt), không xóa DB  ← đổi Phase 6
    selector useClientsWithStats: lọc isProspect=false && !archivedAt  ← đổi Phase 6
  useOpportunityStore.ts  — fetchOpportunities, updateStatus, updateOpportunity, deleteOpportunity
  useActivityStore.ts     — fetchActivities, addActivity (→ Activity|null), updateActivity, deleteActivity
  useTaskStore.ts         — fetchTasks, addTask, toggleDone, updateTask, deleteTask
                            selectors: usePendingTasks, useOverdueTasks, useTasksForClient, useTasksForOpportunity

src/app/api/
  clients/[id]         — GET, PATCH
                         DELETE → soft delete: set archivedAt, xóa opps chưa Won, xóa tasks pending  ← đổi Phase 6
  clients/existing/    — POST (tạo Client isProspect=false + Opportunity Won 100%)  ← thêm Phase 6
  leads/               — POST (tạo Client isProspect=true + Opportunity Lead 15%)
  opportunities/[id]   — GET, POST, PATCH, DELETE
  activities/          — GET (filter: type/outcome/clientId/search), POST (side effects: lastContactDate, promote opp, isProspect→false khi Won)
  tasks/               — GET (filter: clientId/opportunityId/status/assignedTo), POST
  tasks/[id]           — PATCH (auto set/clear completedAt), DELETE

src/app/clients/_components/
  ClientCard.tsx
  DetailPanel.tsx
    — nút "Xóa" → handleDeleteClick() → kiểm tra openOpps  ← đổi Phase 6
    — showConfirm dialog nếu có deal đang mở  ← thêm Phase 6
  ClientFormModal.tsx   — dùng cho chỉnh sửa client (mode="edit")
  ExistingClientModal.tsx  ← thêm Phase 6, import khách hàng cũ
  FilterBar.tsx · _atoms.tsx · _constants.ts

src/components/
  activities/
    ActivityCard.tsx
    AddActivityModal.tsx  — step 1: log activity; step 2: confirm task follow-up nếu có nextAction
    KpiBar.tsx · constants.ts
  tasks/
    TaskCard.tsx   — badge "⚡ Từ hoạt động" nếu createdFrom có giá trị; badge overdue; hover-delete
    TaskModal.tsx  — tạo task thủ công
  leads/
    LeadModal.tsx  — prop showFirstTask=true khi tạo mới, hiện section lên lịch liên hệ đầu tiên
    LeadCard.tsx   — badge cam "⚠ Chưa có task nào đang chờ" khi hasPendingTask=false
    LostCard.tsx · PromoteModal.tsx
  dashboard/ · forecast/ · opportunities/ · ui/

src/app/
  leads/page.tsx        — fetch tasks, tính pendingClientIds, truyền hasPendingTask vào LeadCard
  activities/page.tsx   — 2 cột: timeline trái + TaskPanel phải; mobile: tab switch
  clients/page.tsx      — button "Khách hàng hiện có" (btn-primary) mở ExistingClientModal
```

---

## Workflow

### Leads (`/leads`) — Salesperson workspace
- Tạo lead → `POST /api/leads` → Client(isProspect=true) + Opportunity(status=Lead, confidence=15%)
- Nếu user điền firstTask trong LeadModal → FE gọi thêm `POST /api/tasks`
- LeadCard hiện badge cam nếu client không có pending task
- **Thăng stage** → nút "Thăng ↑" trên LeadCard → PromoteModal → `PATCH /api/opportunities/[id]`
- Promote lên Won → `client.isProspect=false` → biến mất khỏi Leads, xuất hiện ở Clients
- Xóa opp cuối → cascade xóa client prospect + tasks pending (giữ activities + tasks done)
- **Ngày tạo không được chỉnh sửa** — tự gắn `new Date()` lúc tạo

### Opportunities (`/opportunities`) — Manager overview (read-only)
- Hiển thị toàn bộ Opportunity ở tất cả stage (kể cả Won từ import)
- Sort/filter theo: stage, giá trị, confidence, ngày
- **Không có action nào** — thuần quan sát

### Clients (`/clients`)
- Hiển thị `isProspect=false` và `!archivedAt`
- Button **"Khách hàng hiện có"** (btn-primary, góc phải) → `ExistingClientModal` → `POST /api/clients/existing`
- Nút Xóa trong DetailPanel → soft delete (archivedAt), có confirm dialog nếu có deal đang mở

### Activities (`/activities`)
- Thêm activity → AddActivityModal:
  - Step 1: điền thông tin → `POST /api/activities`
  - Nếu nextAction có nội dung → Step 2 inline: confirm title/dueDate/assignedTo → `POST /api/tasks` với `createdFrom=activityId`
  - Nút "Bỏ qua" để thoát không tạo task
- Thêm task thủ công → TaskModal → `POST /api/tasks`
- Toggle task → `PATCH /api/tasks/[id]` → auto set/clear `completedAt`

### Dashboard (`/`)
- KPI từ opportunities + activities
- Widget: overdue tasks, stale deals, expiring proposals

### Forecast (`/forecast`)
- `opportunity.value * confidence / 100`
- Bao gồm cả opportunities Won từ import "Khách hàng hiện có" (confidence=100%)
