# F07 — Activities Page

> **Route**: `/activities`
> **Accessible by**: Salesperson (client.ownerId === me) · Manager (tất cả)

---

## Mục tiêu

Nhật ký sales — ghi lại mọi tương tác với khách hàng. Đây là nguồn dữ liệu cho Reminders Widget, `lastContactDate`, và promote pipeline.

---

## Hiển thị & Lọc

- Timeline grouped by month — mới nhất trước
- `<KpiBar />` trên cùng: tổng hoạt động, tỷ lệ positive, breakdown outcome
- `<OwnerFilter />` — Manager only (filter qua `ownerClientIds` Set)
- Filter: type (call/email/meeting/demo/note) · outcome (positive/neutral/negative) · search

---

## Activity Card

- Expand → xem notes + nextAction + nextActionDate
- `nextActionDate` badge:
  - Vàng: còn thời gian (pending)
  - Đỏ: đã quá hạn (overdue)
- Badge "⚡ Đã thăng stage" nếu activity có `promoteOpportunityTo`

---

## Thêm Activity — `<AddActivityModal />`

**Bước 1 — Log activity:**
```
Fields: type · title · date · clientId · opportunityId (optional)
        outcome · nextAction · nextActionDate · promoteOpportunityTo (optional)
        notes
```

**Bước 2 — Confirm task (nếu nextAction có giá trị):**
```
"Tạo task follow-up?"
  → deadline = nextActionDate
  → POST /api/tasks { title: nextAction, clientId, opportunityId, dueDate: nextActionDate, createdFrom: activityId }
```

---

## POST /api/activities — side effects

```
1. Lưu activity
2. PATCH opportunity.lastContactDate = activity.date
3. Nếu promoteOpportunityTo:
   → PATCH opportunity.status + confidence (mặc định stage mới)
   → Append statusHistory { from, to, date, activityId }
   → Nếu → Qualified: PATCH client.isProspect = false
```

---

## KpiBar

Tính trên `visibleActivities` (đã filter theo owner):

| Metric | Tính |
|---|---|
| Tổng hoạt động | count |
| Tỷ lệ tích cực | positive / total × 100% |
| Breakdown outcome | progress bar 3 màu: positive (lime) · neutral (xám) · negative (đỏ) |

---

## Acceptance Criteria

- [x] Timeline grouped theo tháng, sort mới nhất trước
- [x] KpiBar tính đúng trên visibleActivities (filter owner)
- [x] Filter theo type + outcome + search hoạt động
- [x] Expand card hiển thị notes + nextAction + nextActionDate badge
- [x] nextActionDate badge: vàng (pending) / đỏ (overdue)
- [x] AddActivityModal 2 bước: log → confirm task follow-up
- [x] POST side effects: lastContactDate cập nhật, promote đúng nếu có promoteOpportunityTo
- [x] Promote qua activity → confidence tự nhảy về mặc định stage mới
- [x] Promote → Qualified → client.isProspect = false
- [x] Manager thấy OwnerFilter + activities của tất cả
