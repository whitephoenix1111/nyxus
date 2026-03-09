# F02 — Leads Page

> **Status**: Phase 2  
> **Route**: `/leads`

---

## Mục tiêu

Quản lý danh sách leads — xem, thêm, sửa, chuyển trạng thái.

## Acceptance Criteria

- [ ] Table hiển thị tất cả opportunities có `status === 'Lead'`
- [ ] Columns: Client Name, Company, Value, Date, Last Contact, Actions
- [ ] Button "Add Lead" → mở modal form
- [ ] Form fields: clientName, company, value, date, confidence (slider 0-100)
- [ ] Inline action: "Promote to Proposal" → gọi `updateStatus(id, 'Proposal')`
- [ ] Row highlight nếu stale (lastContactDate > 3 ngày)
- [ ] Search/filter theo tên hoặc công ty

## Modal Form

```
┌─────────────────────────────┐
│  Add New Lead               │
│  ─────────────────────      │
│  Client Name  [________]    │
│  Company      [________]    │
│  Value ($)    [________]    │
│  Date         [date picker] │
│  Confidence   [slider 0-100]│
│                             │
│  [Cancel]       [Add Lead]  │
└─────────────────────────────┘
```
