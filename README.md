# Nyxus Sales CRM

> Pipeline clarity. Revenue velocity.

CRM dashboard cho team sales B2B — quản lý leads, pipeline, activities, forecast và tài liệu trong một giao diện.

---

## Yêu cầu

- **Node.js** 18.17 trở lên
- **npm** (đi kèm Node.js)
- **Neon Postgres** — tạo DB tại [neon.tech](https://neon.tech), khuyến nghị region `ap-southeast-1` (Singapore)

---

## Cài đặt

```bash
# 1. Clone hoặc giải nén project
cd nyxus

# 2. Cài dependencies
npm install

# 3. Tạo file biến môi trường
cp .env.example .env.local
# Điền POSTGRES_URL từ Neon dashboard vào .env.local

# 4. Tạo schema trên Neon
# Vào Neon dashboard → SQL Editor → paste nội dung db/schema.sql → Run

# 5. Seed dữ liệu demo
npx tsx db/migrate.ts
```

---

## Biến môi trường

Tạo file `.env.local` ở root với nội dung:

```env
POSTGRES_URL=postgresql://<user>:<password>@<host>-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Lấy connection string tại: Neon dashboard → project → **Connection string** → chọn **Pooled connection**.

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
| Migrate | `npx tsx db/migrate.ts` | Seed dữ liệu demo vào DB (chạy 1 lần, idempotent) |

---

## Cấu trúc dự án

```
nyxus/
├── db/
│   ├── schema.sql           # Schema Postgres — chạy trên Neon SQL Editor
│   └── migrate.ts           # Seed dữ liệu demo (idempotent, ON CONFLICT DO NOTHING)
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
│   ├── lib/
│   │   ├── db.ts            # Neon client (postgres.js, SSL, connection pool)
│   │   ├── queries.ts       # Toàn bộ SQL helpers — caller không viết raw SQL
│   │   └── session.ts       # JWT auth helpers
│   └── types/               # TypeScript interfaces
│
├── middleware.ts             # JWT auth guard — bảo vệ tất cả routes
└── REFACTOR.md              # Kiến trúc hệ thống chi tiết (đọc trước khi code)
```

---

## Database

Project dùng **Neon Postgres** (serverless Postgres). Không cần cài database local.

- **Client:** `postgres.js` với SSL required — config tại `src/lib/db.ts`
- **Queries:** tất cả SQL tập trung tại `src/lib/queries.ts` — không viết raw SQL ở nơi khác
- **Schema:** `db/schema.sql` — tạo một lần trên Neon SQL Editor
- **Naming:** DB dùng `snake_case`, app dùng `camelCase` — mapper `rowToXxx()` trong `queries.ts` xử lý

> 💡 **Region:** Dùng `ap-southeast-1` (Singapore) để giảm latency khi dev từ Việt Nam.
> Region `us-east-1` thêm ~400-600ms mỗi request so với Singapore.

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
