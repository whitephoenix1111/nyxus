# HLD (2/2) — Conventions, Design System & Auth

> File trước: `HLD-1-architecture.md`

---

## 1. Coding Conventions

- **Components không gọi fetch trực tiếp** — chỉ qua store actions
- **Selectors dùng `useMemo`** — đặt trong file store, không trong component
- **Optimistic update** cho PATCH/DELETE; **pessimistic** cho POST (đợi response có id)
- **Join data runtime** — không denormalize vào JSON (ngoại trừ `clientName`/`company` trong Activity để tránh join ngược)
- **`statusHistory` append-only** — không edit, không xóa
- **Stores không import lẫn nhau** — tránh circular dependency. Selectors cần cross-store data nhận tham số. Ví dụ: `useStaleLeads(activities: Activity[])`, không import `useActivityStore` bên trong `useOpportunityStore`

---

## 2. Auth & Session

- JWT trong `httpOnly` cookie (`nyxus_session`, TTL 8h)
- `middleware.ts` guard tất cả routes — redirect `/login` nếu chưa đăng nhập
- `requireSession()` / `requireRole('manager')` trong API routes
- **Demo accounts**: `sale@nyxus.vn / sale123` · `manager@nyxus.vn / manager123`
- `passwordHash` — plain-text trong dev, nâng bcrypt khi prod

---

## 3. Nguyên tắc Ownership & Phân quyền

> **Ownership nằm ở Client, không phải resource con.**
> Sales A phụ trách client → thấy và thao tác được mọi opp/activity/task/document của client đó.
> Manager bypass toàn bộ — thấy và làm được mọi thứ.

| Thao tác | Sales (owner) | Sales (non-owner) | Manager |
|---|:---:|:---:|:---:|
| View resource | ✅ | ❌ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit | ✅ | ❌ | ✅ |
| Delete client (soft) | ❌ | ❌ | ✅ |
| Assign Lead | ❌ | ❌ | ✅ |

**Document guard đặc biệt**: Mutate (PATCH/DELETE) kiểm tra `client.ownerId`, không phải `document.ownerId`.

---

## 4. Design System

### Nền & Accent
- **Nền**: `#000000` tuyệt đối
- **Accent**: `#DFFF00` (lime) — chỉ dùng cho 1 element quan trọng nhất mỗi vùng
- Tokens định nghĩa đầy đủ trong `globals.css` block `@theme inline`. Xem `3-lld/lld-tokens.md`.

### Typography
| Font | Variable | Dùng cho |
|---|---|---|
| **Syne** | `--font-display` | Headings, nav labels, số liệu lớn |
| **Geist** | `--font-body` | Body text, descriptions |
| **DM Mono** | `--font-mono` | Giá tiền, IDs, data values, % |

### Status Colors

| Status | Text | Background | Border |
|---|---|---|---|
| Lead | `#AAAAAA` | `#1A1A1A` | `#333333` |
| Qualified | `#5BA3F5` | `#0D1B2A` | `#1A3A5C` |
| Proposal | `#F5A742` | `#1A1000` | `#3A2500` |
| Negotiation | `#F5C842` | `#1A1400` | `#3A3000` |
| Won | `#DFFF00` | `#DFFF0015` | `#DFFF0044` |
| Lost | `#EF4444` | `#1C0505` | `#7f1d1d` |

Tailwind classes có sẵn: `.badge-lead` · `.badge-qualified` · `.badge-proposal` · `.badge-negotiation` · `.badge-won` · `.badge-lost`

### Utility Classes

| Class | Effect |
|---|---|
| `.card` | Surface bg + border + border-radius + hover transition |
| `.card-brand` | Lime bg + black text (active StatCard) |
| `.btn-primary` | Lime button — CTA |
| `.btn-ghost` | Transparent button với border |
| `.input-base` | Input field base style |
| `.select-base` | Select field base style |
| `.focus-ring` | Lime outline on focus-visible |

---

## 5. Component Architecture tổng thể

```
RootLayout
└── TopNav
    ├── Logo (lime dot grid)
    ├── NavLinks: Home · Leads · Opportunities · Clients · Forecast · Activities · Documents
    ├── UserAvatar + logout (confirm dialog trước khi logout)
    └── (Search — planned)

src/components/ui/
  TopNav.tsx            — Nav + logout confirm dialog
  OwnerBadge.tsx        — Avatar inline, chỉ hiện với manager
  OwnerFilter.tsx       — Dropdown lọc theo sales, chỉ hiện với manager
  TagBadge.tsx          — isComputed=true → style ⚡
  ToastContainer.tsx    — Render toast stack, bottom-right, auto-dismiss
  ConfirmDialog.tsx     — Reusable confirm, variant: danger / warning / info

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
