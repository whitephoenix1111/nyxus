# VISION (2/2) — Workflow & Trạng thái Goals

> File trước: `VISION-1-goals.md`

---

## 1. Workflow end-to-end

```
[NGUỒN VÀO] LinkedIn / hội nghị / referral / web form
     │
     │  Sales Rep nhập: tên + email + công ty + deal value
     ▼
POST /api/leads
  ┌─────────────────────────────────────────────────────────────┐
  │  CLIENT (isProspect: true)   ──FK──   OPPORTUNITY (Lead)    │
  │    id: "cli-xxx"                        clientId: "cli-xxx" │
  │    ownerId: currentUser.id              status: "Lead"      │
  │                                         confidence: 15%     │
  └─────────────────────────────────────────────────────────────┘
     │
     │  Nhân viên ghi ACTIVITY
     │    type: call / email / meeting / demo / note
     │    outcome: positive / neutral / negative
     │    nextAction: "Gửi proposal trước thứ 6"
     │    nextActionDate: "2026-03-15"   ← due date thật → Task
     │    promoteOpportunityTo?: "Qualified"  ← tuỳ chọn
     ▼
POST /api/activities  [side effects]
  1. Lưu activity
  2. PATCH opportunity.lastContactDate = activity.date
  3. Nếu có promoteOpportunityTo:
       PATCH opportunity.status + confidence (mặc định stage mới)
       Append statusHistory
       Nếu → Qualified: PATCH client.isProspect = false

  ┌────────────────────────────────────────────────────────────┐
  │           PROMOTE qua PromoteModal (thủ công)              │
  │  Lead → Qualified → Proposal → Negotiation → Won / Lost    │
  │                │                                           │
  │         isProspect = false                                 │
  │         Client xuất hiện ở /clients                        │
  └────────────────────────────────────────────────────────────┘
     │
     │  Won: client.isProspect = false, biến mất khỏi /leads
     │  Lost: giữ lại để phân tích, không xóa
```

---

## 2. Soft Delete Client

```
DELETE /api/clients/[id]  (Manager only)
  → archivedAt = today  (soft delete)
  → Cascade xóa: opportunities chưa Won + tasks pending
  → Giữ lại: activities, tasks done, opportunities Won
  → Confirm dialog nếu có deal đang mở
```

---

## 3. Import khách hàng cũ

```
POST /api/clients/existing
  → Client (isProspect: false) + Opportunity (Won, confidence: 100%)
  → Dùng cho onboarding — nhập lại base khách hàng đã có
```

---

## 4. Reminders Widget — 3 loại cảnh báo proactive

| Loại | Điều kiện |
|---|---|
| `overdue_task` | `activity.nextActionDate < hôm nay` và opportunity chưa có activity mới hơn |
| `stale_deal` | `opportunity.lastContactDate > 3 ngày`, status ∈ [Lead, Qualified, Proposal], không có pending task |
| `expiring_proposal` | `status = Proposal`, `lastContactDate > 14 ngày` |

Reminders hiển thị ở Dashboard Home — cảnh báo proactive, không cần nhân viên nhớ.

---

## 5. Smart Tags

Computed khi render — không lưu DB:

| Tag | Điều kiện |
|---|---|
| `new-lead` | `client.createdAt` < 7 ngày trước |
| `warm` | `opp.lastContactDate` < 14 ngày trước |
| `cold` | `opp.lastContactDate` > 30 ngày VÀ không phải `new-lead` |
| `priority` | Tổng value tất cả opp > $50,000 |

Tags thủ công `enterprise`, `mid-market` lưu trong DB — không bị override bởi computed tags.

---

## 6. Forecast

- Đọc tất cả opportunities trừ Lost
- Weighted revenue = `SUM(value × confidence / 100)`
- Confidence = mặc định theo stage + fine-tune của nhân viên
- Trang Forecast — Manager only — hoàn toàn read-only, không thay đổi data nào

---

## 7. Trạng thái Goals

- [x] Dashboard Home: Stats, KPI Chart, Reminders Widget, Top Clients
- [x] Opportunities page: table, filter, status badge
- [x] Leads page: card view, smart tags, PromoteModal
- [x] Clients page: grid + detail panel + modal
- [x] Forecast page: weighted revenue, confidence breakdown — Manager only
- [x] Activities page: timeline theo tháng, KPI bar, add/delete
- [x] Documents page: metadata-only, upload modal, owner filter
- [x] Auth: JWT cookie, middleware guard, role-based UI
- [x] `Client.isProspect` — tạo Lead → sinh Client liên kết
- [x] `Activity.nextActionDate` — due date thật, Reminders đọc overdue
- [x] Confidence theo stage — promote → tự nhảy về mặc định
- [x] Tasks: tạo thủ công hoặc auto từ nextAction
- [ ] Search toàn cục
