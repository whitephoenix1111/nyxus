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
| Phase 1 | Refactor Lead → Client (isProspect) | ✅ Hoàn thành |
| Phase 2 | Redesign Activities + hệ thống Task | 🔲 Bước 11–18 |

**Bước tiếp theo: Bước 11** — Định nghĩa `Task` type + tạo `tasks.json`

---

## Kiến trúc đã chốt (bất biến)

**Stack:** Next.js App Router · JSON file DB · Zustand stores
**Paths:** `data/*.json` · `src/app/api/` · `src/store/` · `src/app/` · `src/components/`

**Data model:**
```
clients.json
  └─ opportunities.json  (clientId FK)
       └─ activities.json (clientId + opportunityId FK)
            └─ tasks.json  (clientId + opportunityId FK) ← MỚI Phase 2
```

**Nghiệp vụ Lead → Client (Phase 1 — đã xong):**
- `Client.isProspect = true` → prospect chưa Won, hiện ở trang Leads
- `Client.isProspect = false` → client thật, chỉ set khi Opportunity.status = **Won**
- Trang **Leads**: `isProspect=true` + status ∈ {Lead, Qualified, Proposal, Negotiation}
- Trang **Clients**: `isProspect=false`
- Tab **Lưu trữ** (trong Leads): `isProspect=true` + `status=Lost`
- Xóa Opportunity cuối của prospect → tự xóa cascade Client đó

---

## Phase 2 — Redesign Activities + Task

**Quyết định thiết kế đã chốt:**
- Quy mô target: 5–50 người dùng
- `Activity` = việc đã xảy ra, log thủ công, luôn gắn với client/opportunity thật
- `Task` = việc cần làm, entity độc lập, có `status: pending|done`, có `assignedTo`
- Khi lưu Activity có `nextAction` → API tự tạo Task (`createdFrom: activityId`)
- `AddActivityModal` dùng combobox chọn từ clients thật, không nhập tay
- **Bug cần fix:** `POST /api/activities` đang set `isProspect=false` khi promote lên
  `Qualified` → SAI, chỉ set khi `Won`

**File sẽ thêm/sửa:**
```
data/tasks.json                              — tạo mới []
src/types/index.ts                           — thêm Task, TaskStatus
src/app/api/tasks/route.ts                   — GET + POST
src/app/api/tasks/[id]/route.ts              — PATCH + DELETE
src/app/api/activities/route.ts              — fix bug + auto-create Task
src/store/useTaskStore.ts                    — store mới
src/components/activities/AddActivityModal.tsx — combobox client thật
src/components/tasks/TaskCard.tsx            — mới
src/components/tasks/TaskModal.tsx           — mới
src/app/activities/page.tsx                  — layout 2 cột
```

---

### 🔲 BƯỚC 11 — Task type + tasks.json

**`src/types/index.ts`** — thêm vào cuối:
```ts
export type TaskStatus = 'pending' | 'done';
export interface Task {
  id: string;
  title: string;
  clientId: string; clientName: string; company: string;
  opportunityId?: string;
  dueDate?: string;
  status: TaskStatus;
  assignedTo?: string;    // text tự do, chưa có auth
  createdFrom?: string;   // activityId nếu auto-created
  notes?: string;
  createdAt: string;
  completedAt?: string;
}
```
**`data/tasks.json`** — tạo mới `[]`

---

### 🔲 BƯỚC 12 — API tasks CRUD

**`src/app/api/tasks/route.ts`**
- GET: đọc tasks.json, filter by `clientId` / `status` / `assignedTo` qua query param
- POST: tạo task, id = `tsk-${uuid.slice(0,8)}`

**`src/app/api/tasks/[id]/route.ts`**
- PATCH: update field, nếu `status→done` thì set `completedAt = today`
- DELETE: xóa task

---

### 🔲 BƯỚC 13 — useTaskStore

**`src/store/useTaskStore.ts`**
```ts
interface TaskStore {
  tasks: Task[]; isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (data: Omit<Task, 'id'|'createdAt'>) => Promise<Task>;
  toggleDone: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}
```
Selectors: `usePendingTasks()` · `useOverdueTasks()` · `useTasksForClient(clientId)`

---

### 🔲 BƯỚC 14 — Fix bug isProspect trong POST /api/activities

**`src/app/api/activities/route.ts`** — sửa:
```ts
// SAI (hiện tại):
if (newStatus === 'Qualified') { clients[i].isProspect = false; }

// ĐÚNG:
if (newStatus === 'Won') { clients[i].isProspect = false; }
```

---

### 🔲 BƯỚC 15 — Auto-create Task từ nextAction

**`src/app/api/activities/route.ts`** — thêm vào cuối POST, sau writeJSON:
```ts
if (newActivity.nextAction?.trim()) {
  const tasks = await readJSON<Task[]>('tasks.json');
  tasks.push({
    id: `tsk-${crypto.randomUUID().slice(0,8)}`,
    title: newActivity.nextAction.trim(),
    clientId: newActivity.clientId,
    clientName: newActivity.clientName,
    company: newActivity.company,
    opportunityId: newActivity.opportunityId,
    dueDate: newActivity.nextActionDate,
    status: 'pending',
    createdFrom: newActivity.id,
    notes: '',
    createdAt: new Date().toISOString().split('T')[0],
  });
  await writeJSON('tasks.json', tasks);
}
```

---

### 🔲 BƯỚC 16 — AddActivityModal: combobox client thật

**`src/components/activities/AddActivityModal.tsx`**
- Bỏ field nhập tay `clientName`, `company`, `opportunityId`, `promoteOpportunityTo`
- Thêm combobox: gõ tên → filter `clients` store → chọn → tự fill `clientId/clientName/company`
- Thêm dropdown `opportunityId`: chỉ hiện opportunities của client vừa chọn
- Giữ nguyên: type, title, date, outcome, nextAction, nextActionDate, notes

---

### 🔲 BƯỚC 17 — TaskCard + TaskModal

**`src/components/tasks/TaskCard.tsx`**
- Hiện: title, clientName, dueDate badge (vàng/đỏ nếu overdue)
- Badge nhỏ "auto" nếu `createdFrom` có giá trị
- Checkbox toggle done · nút xóa

**`src/components/tasks/TaskModal.tsx`**
- Form tạo task thủ công: title, client combobox, opportunity dropdown, dueDate, assignedTo, notes

---

### 🔲 BƯỚC 18 — Redesign trang Activities: layout 2 cột

**`src/app/activities/page.tsx`**
- Cột trái (~65%): timeline Activity như hiện tại
- Cột phải (~35%): Task panel — header + badge pending + nút Thêm, tabs Pending/Hoàn thành,
  list TaskCard sort by dueDate, overdue lên đầu highlight đỏ
- Mobile: tab switch Activity / Task

---

## Thứ tự làm (Phase 2)

| Bước | Việc | File chính |
|------|------|------------|
| 11 | Task type + tasks.json | `types/index.ts`, `data/tasks.json` |
| 12 | API CRUD tasks | `api/tasks/` |
| 13 | useTaskStore + selectors | `store/useTaskStore.ts` |
| 14 | Fix bug isProspect Qualified→Won | `api/activities/route.ts` |
| 15 | Auto-create Task từ nextAction | `api/activities/route.ts` |
| 16 | AddActivityModal combobox | `components/activities/AddActivityModal.tsx` |
| 17 | TaskCard + TaskModal | `components/tasks/` |
| 18 | Redesign trang Activities | `app/activities/page.tsx` |
