// src/lib/db.ts — Neon Postgres client
//
// Setup:
//   1. vercel env pull .env.local  (sau khi link Neon trên Vercel dashboard)
//   2. POSTGRES_URL sẽ có sẵn tự động
//
// Dùng `postgres` (postgres.js) thay vì @vercel/postgres để có
// tagged-template syntax gọn hơn và không bị vendor lock.
import postgres from 'postgres';

// Neon yêu cầu SSL — postgres.js tự detect qua connection string
const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
  // Connection pool nhỏ — phù hợp với serverless (mỗi function instance độc lập)
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
