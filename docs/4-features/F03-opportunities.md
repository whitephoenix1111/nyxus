# F03 — Opportunities Page

> **Route**: `/opportunities`
> **Accessible by**: Salesperson (ownerId === me) · Manager (tất cả)

---

## Mục tiêu

Overview toàn bộ pipeline — tất cả stages, read-only. Không có action button — chỉ xem và filter.
Promote / edit thực hiện tại trang Leads hoặc qua Activities.

---

## Hiển thị & Lọc

- Table view
- Filter tabs: All · Lead · Qualified · Proposal · Negotiation · Won · Lost
- Sort by: Value (desc mặc định) · Date · LastContactDate
- `<OwnerFilter />` — chỉ hiện với Manager
- Status badge có màu theo stage (`.badge-lead`, `.badge-won`, ...)

---

## Columns

| Column | Ghi chú |
|---|---|
| Client Name | — |
| Company | — |
| Value | Format tiền tệ |
| Confidence | % — format DM Mono |
| Status | Badge màu theo stage |
| Last Contact | ISO date, highlight đỏ nếu > 30 ngày |
| Owner | `<OwnerBadge />` — chỉ hiện với Manager |

---

## Acceptance Criteria

- [x] Table hiển thị tất cả opportunities của user (filter theo ownerId)
- [x] Manager thấy tất cả + OwnerFilter
- [x] Filter tabs đúng status
- [x] Status badge màu đúng theo stage
- [x] Không có nút Edit / Delete / Promote trên trang này
- [x] Sort by value desc mặc định
