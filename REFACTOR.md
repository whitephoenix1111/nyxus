# Nyxus CRM — Kế hoạch phát triển

## 🚀 PROMPT KHỞI ĐỘNG CHO NEW CHAT

```
Bạn là assistant giúp tôi phát triển CRM nội bộ tên Nyxus.
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

---

## Phân vai trang (Role-based UX — Auth chưa implement)

| Trang | Dành cho | Quyền |
|-------|----------|-------|
| `/leads` | Salesperson (làm việc hàng ngày) | Xem, tạo, sửa, thăng stage, xóa lead |
| `/opportunities` | Manager (quan sát pipeline) | Xem, filter, sort — **read-only hoàn toàn** |
| `/activities` | Salesperson | Log activity, tạo task |
| `/clients` | Cả hai | Xem clients đã Won |
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
- `Client.isProspect = false` → chỉ set khi `Opportunity.status = Won`
- Trang **Leads**: `isProspect=true` + status ∈ {Lead, Qualified, Proposal, Negotiation}
- Tab **Lưu trữ**: `isProspect=true` + `status=Lost`
- Trang **Clients**: `isProspect=false`
- Xóa Opportunity cuối của prospect → cascade xóa Client
- `Activity` = việc đã xảy ra (log thủ công)
- `Task` = việc cần làm, có `status: pending|done`, `assignedTo`
- Task có `createdFrom: activityId` nếu tạo từ step 2 confirm trong AddActivityModal

**Quy tắc cascade delete (Phase 4):**
- Xóa Client (hoặc cascade từ xóa Opportunity cuối):
  - ✅ Giữ: `activities.json` — log lịch sử là bất biến, không xóa
  - ✅ Giữ: tasks có `status=done` — đã hoàn thành = lịch sử
  - ❌ Xóa: `opportunities.json` liên kết
  - ❌ Xóa: tasks có `status=pending` — việc chưa làm, không còn ai thực hiện

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
- **Không có button Thêm, không có xóa** — Opportunity không tồn tại độc lập, luôn sinh ra từ flow tạo Lead
- Mọi thay đổi stage phải thực hiện từ `/leads` (LeadCard → PromoteModal)

---

## Cơ chế Activities

- **Không có activity tự sinh** — toàn bộ là log thủ công
- Tạo lead chỉ tạo Client + Opportunity, không tạo activity nào
- LeadModal có section "Lên lịch liên hệ đầu tiên" (optional) → tạo **task**, không phải activity
- Trang Leads hiện **tất cả stage** (Lead/Qualified/Proposal/Negotiation) của prospect — không lọc theo %

---

## Cấu trúc file

```
data/
  clients.json · opportunities.json · activities.json · tasks.json

src/types/index.ts
src/store/
  useClientStore.ts       — fetchClients, addClient, addLead, updateClient, deleteClient
  useOpportunityStore.ts  — fetchOpportunities, updateStatus, updateOpportunity, deleteOpportunity
  useActivityStore.ts     — fetchActivities, addActivity (→ Activity|null), updateActivity, deleteActivity
  useTaskStore.ts         — fetchTasks, addTask, toggleDone, updateTask, deleteTask
                            selectors: usePendingTasks, useOverdueTasks, useTasksForClient, useTasksForOpportunity

src/app/api/
  clients/[id]    — GET, POST, PATCH, DELETE (cascade: xóa opps + tasks pending, giữ activities + tasks done)
  leads/          — POST (tạo Client prospect + Opportunity cùng lúc)
  opportunities/[id] — GET, POST, PATCH, DELETE (cascade xóa client nếu prospect + hết opp; xóa tasks pending, giữ activities + tasks done)
  activities/     — GET (filter: type/outcome/clientId/search), POST (side effects: lastContactDate, promote opp, isProspect→Won khi Won)
  tasks/          — GET (filter: clientId/opportunityId/status/assignedTo), POST
  tasks/[id]      — PATCH (auto set/clear completedAt), DELETE

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
```

---

## Workflow

### Leads (`/leads`) — Salesperson workspace
- Tạo lead → `POST /api/leads` → Client(isProspect=true) + Opportunity(status=Lead)
- Nếu user điền firstTask trong LeadModal → FE gọi thêm `POST /api/tasks`
- LeadCard hiện badge cam nếu client không có pending task
- **Thăng stage** → nút "Thăng ↑" trên LeadCard → PromoteModal → `PATCH /api/opportunities/[id]`
- Promote lên Won → `client.isProspect=false` → biến mất khỏi Leads, xuất hiện ở Clients
- Xóa opp cuối → cascade xóa client prospect + tasks pending (giữ activities + tasks done)
- **Ngày tạo không được chỉnh sửa** — tự gắn `new Date()` lúc tạo

### Opportunities (`/opportunities`) — Manager overview (read-only)
- Hiển thị toàn bộ Opportunity ở tất cả stage
- Sort/filter theo: stage, giá trị, confidence, ngày
- **Không có EditRow, không có nút Thăng/Giáng**
- **Không có action nào** — thuần quan sát

### Clients (`/clients`)
- Hiển thị `isProspect=false`

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
