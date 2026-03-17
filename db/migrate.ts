// db/migrate.ts — Đọc data từ data/*.json và INSERT vào Neon Postgres
//
// Chạy 1 lần duy nhất sau khi đã tạo schema:
//   npx tsx db/migrate.ts
//
// Yêu cầu: POSTGRES_URL có trong .env.local
// Đảm bảo: schema đã được tạo trước (chạy db/schema.sql trên Neon SQL Editor)

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  console.error('❌ POSTGRES_URL chưa được set trong .env.local');
  process.exit(1);
}

const sql = postgres(process.env.POSTGRES_URL, { ssl: 'require' });

async function readJSON<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(path.join(process.cwd(), 'data', filename), 'utf-8');
  return JSON.parse(raw) as T;
}

async function main() {
  console.log('🚀 Starting migration...\n');

  // ── 1. users ──────────────────────────────────────────────────────────────
  const users = await readJSON<any[]>('users.json');
  for (const u of users) {
    await sql`
      INSERT INTO users (id, name, email, role, avatar, password_hash)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role}, ${u.avatar}, ${u.passwordHash})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`✅ users: ${users.length} rows`);

  // ── 2. clients ────────────────────────────────────────────────────────────
  const clients = await readJSON<any[]>('clients.json');
  for (const c of clients) {
    await sql`
      INSERT INTO clients (id, owner_id, name, company, avatar, email, phone, industry, country, website, tags, notes, created_at, archived_at)
      VALUES (
        ${c.id}, ${c.ownerId}, ${c.name}, ${c.company}, ${c.avatar},
        ${c.email ?? ''}, ${c.phone ?? ''}, ${c.industry ?? 'Unknown'},
        ${c.country ?? ''}, ${c.website ?? ''}, ${c.tags ?? []},
        ${c.notes ?? ''}, ${c.createdAt}, ${c.archivedAt ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`✅ clients: ${clients.length} rows`);

  // ── 3. opportunities ──────────────────────────────────────────────────────
  const opps = await readJSON<any[]>('opportunities.json');
  const oppIds = new Set(opps.map(o => o.id));

  for (const o of opps) {
    await sql`
      INSERT INTO opportunities (id, client_id, owner_id, title, value, status, confidence, date, notes, status_history)
      VALUES (
        ${o.id}, ${o.clientId}, ${o.ownerId}, ${o.title},
        ${o.value}, ${o.status}, ${o.confidence}, ${o.date},
        ${o.notes ?? null}, ${JSON.stringify(o.statusHistory ?? [])}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`✅ opportunities: ${opps.length} rows`);

  // ── 4. activities ─────────────────────────────────────────────────────────
  const activities = await readJSON<any[]>('activities.json');
  const clientIds  = new Set(clients.map(c => c.id));

  let actSkipped = 0;
  for (const a of activities) {
    // Bỏ qua activity nếu clientId không tồn tại (data inconsistency)
    if (!clientIds.has(a.clientId)) {
      console.warn(`  ⚠️  activity ${a.id} skip — clientId "${a.clientId}" không tồn tại`);
      actSkipped++;
      continue;
    }

    // opportunityId null hóa nếu opp đã bị hard delete — tránh FK violation
    const opportunityId = a.opportunityId && oppIds.has(a.opportunityId)
      ? a.opportunityId
      : null;

    if (a.opportunityId && !oppIds.has(a.opportunityId)) {
      console.warn(`  ⚠️  activity ${a.id} — opportunityId "${a.opportunityId}" không tồn tại, set null`);
    }

    await sql`
      INSERT INTO activities (id, client_id, opportunity_id, type, title, date, outcome, next_action, next_action_date, promote_opportunity_to, notes, created_at)
      VALUES (
        ${a.id}, ${a.clientId}, ${opportunityId}, ${a.type},
        ${a.title}, ${a.date}, ${a.outcome}, ${a.nextAction ?? ''},
        ${a.nextActionDate ?? null}, ${a.promoteOpportunityTo ?? null},
        ${a.notes ?? ''}, ${a.createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`✅ activities: ${activities.length - actSkipped} rows (${actSkipped} skipped)`);

  // ── 5. tasks ──────────────────────────────────────────────────────────────
  const tasks = await readJSON<any[]>('tasks.json');
  let taskSkipped = 0;

  for (const t of tasks) {
    if (!clientIds.has(t.clientId)) {
      console.warn(`  ⚠️  task ${t.id} skip — clientId "${t.clientId}" không tồn tại`);
      taskSkipped++;
      continue;
    }

    const opportunityId = t.opportunityId && oppIds.has(t.opportunityId)
      ? t.opportunityId
      : null;

    await sql`
      INSERT INTO tasks (id, client_id, opportunity_id, title, status, due_date, assigned_to, created_from, notes, created_at, completed_at)
      VALUES (
        ${t.id}, ${t.clientId}, ${opportunityId}, ${t.title},
        ${t.status ?? 'pending'}, ${t.dueDate ?? null}, ${t.assignedTo ?? null},
        ${t.createdFrom ?? null}, ${t.notes ?? null},
        ${t.createdAt}, ${t.completedAt ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`✅ tasks: ${tasks.length - taskSkipped} rows (${taskSkipped} skipped)`);

  // ── 6. documents ──────────────────────────────────────────────────────────
  const docs = await readJSON<any[]>('documents.json');
  let docSkipped = 0;

  for (const d of docs) {
    if (!clientIds.has(d.clientId)) {
      console.warn(`  ⚠️  document ${d.id} skip — clientId "${d.clientId}" không tồn tại`);
      docSkipped++;
      continue;
    }

    const opportunityId = d.opportunityId && oppIds.has(d.opportunityId)
      ? d.opportunityId
      : null;

    await sql`
      INSERT INTO documents (id, client_id, opportunity_id, uploaded_by, name, type, category, size, url, starred, uploaded_at)
      VALUES (
        ${d.id}, ${d.clientId}, ${opportunityId}, ${d.uploadedBy},
        ${d.name}, ${d.type}, ${d.category}, ${d.size ?? ''},
        ${d.url ?? null}, ${d.starred ?? false}, ${d.uploadedAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`✅ documents: ${docs.length - docSkipped} rows (${docSkipped} skipped)`);

  console.log('\n🎉 Migration hoàn tất!');
  await sql.end();
}

main().catch(err => {
  console.error('❌ Migration thất bại:', err);
  process.exit(1);
});
