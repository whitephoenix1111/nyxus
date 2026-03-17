# Nyxus Sales CRM

> Pipeline clarity. Revenue velocity.

CRM dashboard cho team sales B2B — quản lý leads, pipeline, activities, forecast và tài liệu trong một giao diện.

---

## Yêu cầu

- **Node.js** 18.17 trở lên
- **npm** (đi kèm Node.js)

---

## Cài đặt

```bash
# 1. Clone hoặc giải nén project
cd nyxus

# 2. Cài dependencies
npm install
```

---

## Chạy môi trường dev

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## Tài khoản demo

| Role | Email | Mật khẩu |
|---|---|---|
| Sales Rep | `sale@nyxus.vn` | `sale123` |
| Manager | `manager@nyxus.vn` | `manager123` |

Hai role có giao diện và quyền khác nhau — nên thử cả hai để thấy sự khác biệt.

---

## Scripts

| Script | Lệnh | Mô tả |
|---|---|---|
| Dev server | `npm run dev` | Chạy local với hot-reload |
| Build | `npm run build` | Build production |
| Start | `npm run start` | Chạy bản đã build (cần chạy build trước) |
| Lint | `npm run lint` | Kiểm tra lỗi ESLint |

---

## Cấu trúc dự án

```
nyxus/
├── data/                    # Database — JSON files (đọc/ghi trực tiếp)
│   ├── users.json
│   ├── clients.json
│   ├── opportunities.json
│   ├── activities.json
│   ├── tasks.json
│   └── documents.json
│
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Dashboard (/)
│   │   ├── leads/           # /leads
│   │   ├── opportunities/   # /opportunities
│   │   ├── clients/         # /clients
│   │   ├── forecast/        # /forecast — Manager only
│   │   ├── activities/      # /activities
│   │   ├── documents/       # /documents
│   │   ├── login/           # /login
│   │   └── api/             # API routes
│   │
│   ├── store/               # Zustand stores + selectors
│   ├── components/          # React components
│   ├── lib/                 # json-db helper, auth utils
│   └── types/               # TypeScript interfaces
│
├── middleware.ts             # JWT auth guard — bảo vệ tất cả routes
├── REFACTOR.md              # Kiến trúc hệ thống (đọc trước khi code)
└── docs/                    # Tài liệu chi tiết
```

---

## Database

Project dùng **JSON files** làm database — không cần cài đặt database server.

Toàn bộ dữ liệu nằm trong thư mục `data/`. Đọc/ghi qua helper `src/lib/json-db.ts`.

> ⚠️ File JSON bị ghi đè trực tiếp khi gọi API. Không có migration hay transaction.
> Backup thư mục `data/` trước khi thực hiện thay đổi lớn.

**Reset về dữ liệu gốc:**
Khôi phục các file trong `data/` từ git hoặc từ bản backup.

---

## Auth

- Đăng nhập tại `/login` — nhận JWT lưu trong `httpOnly` cookie (`nyxus_session`, TTL 8h)
- Tất cả routes được bảo vệ bởi `middleware.ts` — tự động redirect về `/login` nếu chưa đăng nhập
- Hết session sau 8 giờ — đăng nhập lại để tiếp tục

---

## Phân quyền nhanh

| | Sales Rep | Manager |
|---|---|---|
| Xem data của mình | ✅ | ✅ (thấy tất cả) |
| Tạo lead / activity / task | ✅ | ✅ |
| Sửa / xóa client của mình | ✅ | ✅ |
| Xóa client người khác | ❌ | ✅ |
| Assign lead cho sales | ❌ | ✅ |
| Trang Forecast | ❌ (redirect) | ✅ |

---