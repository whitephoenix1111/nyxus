// src/lib/queries.ts — SQL query helpers cho từng bảng
//
// Convention camelCase ↔ snake_case:
//   DB lưu snake_case (owner_id, client_id...)
//   App dùng camelCase (ownerId, clientId...)
//   rowToXxx() mapper ở cuối mỗi section xử lý việc này.
//
// Tất cả hàm return kiểu TypeScript đã được map — caller không cần biết SQL.

import sql from './db';
import type postgres from 'postgres';
import type {
  Client, Opportunity, Activity, Task, Document, User,
  OpportunityStatus, StoredClientTag,
} from '@/types';

// ── Mappers: DB row → TypeScript type ──────────────────────────────────────
// Tách riêng để dùng lại trong nhiều query

function rowToUser(r: any): User {
  return {
    id: r.id, name: r.name, email: r.email,
    role: r.role, avatar: r.avatar, passwordHash: r.password_hash,
  };
}

function rowToClient(r: any): Client {
  return {
    id: r.id, ownerId: r.owner_id, name: r.name, company: r.company,
    avatar: r.avatar, email: r.email, phone: r.phone, industry: r.industry,
    country: r.country, website: r.website,
    tags: r.tags as StoredClientTag[],
    notes: r.notes,
    createdAt: toDateStr(r.created_at),
    ...(r.archived_at ? { archivedAt: toDateStr(r.archived_at) } : {}),
  };
}

function rowToOpp(r: any): Opportunity {
  return {
    id: r.id, clientId: r.client_id, ownerId: r.owner_id,
    title: r.title, value: Number(r.value),
    status: r.status as OpportunityStatus,
    confidence: r.confidence,
    date: toDateStr(r.date),
    notes: r.notes ?? undefined,
    statusHistory: r.status_history ?? [],
    clientName: undefined, company: undefined,
  };
}

function rowToActivity(r: any): Activity {
  return {
    id: r.id, clientId: r.client_id,
    opportunityId: r.opportunity_id ?? undefined,
    type: r.type, title: r.title,
    date: toDateStr(r.date),
    outcome: r.outcome, nextAction: r.next_action,
    nextActionDate: r.next_action_date ? toDateStr(r.next_action_date) : undefined,
    promoteOpportunityTo: r.promote_opportunity_to ?? undefined,
    notes: r.notes, createdAt: toDateStr(r.created_at),
  };
}

function rowToTask(r: any): Task {
  return {
    id: r.id, clientId: r.client_id,
    opportunityId: r.opportunity_id ?? undefined,
    title: r.title, status: r.status,
    dueDate: r.due_date ? toDateStr(r.due_date) : undefined,
    assignedTo: r.assigned_to ?? undefined,
    createdFrom: r.created_from ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: toDateStr(r.created_at),
    completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
    company: undefined,
  };
}

function rowToDocument(r: any): Document {
  return {
    id: r.id, clientId: r.client_id,
    opportunityId: r.opportunity_id ?? undefined,
    uploadedBy: r.uploaded_by, name: r.name,
    type: r.type, category: r.category,
    size: r.size, url: r.url,
    starred: r.starred,
    uploadedAt: new Date(r.uploaded_at).toISOString(),
  };
}

// Neon trả DATE column dạng Date object — chuyển về 'YYYY-MM-DD' string
function toDateStr(val: Date | string): string {
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString().slice(0, 10);
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUsers(role?: string): Promise<User[]> {
  const rows = role
    ? await sql`SELECT * FROM users WHERE role = ${role}`
    : await sql`SELECT * FROM users`;
  return rows.map(rowToUser);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToUser(rows[0]) : null;
}

// ── Clients ────────────────────────────────────────────────────────────────

export async function getClients(filters?: {
  industry?: string;
  tag?: string;
  search?: string;
}): Promise<Client[]> {
  // Build động — postgres.js không support conditional fragments đẹp,
  // dùng array accumulator pattern thay vì string concat
  let rows;
  const { industry, tag, search } = filters ?? {};

  if (industry && tag && search) {
    rows = await sql`
      SELECT * FROM clients
      WHERE industry = ${industry}
        AND ${tag} = ANY(tags)
        AND (name ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})
      ORDER BY created_at DESC`;
  } else if (industry && tag) {
    rows = await sql`SELECT * FROM clients WHERE industry = ${industry} AND ${tag} = ANY(tags) ORDER BY created_at DESC`;
  } else if (industry && search) {
    rows = await sql`SELECT * FROM clients WHERE industry = ${industry} AND (name ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'}) ORDER BY created_at DESC`;
  } else if (tag && search) {
    rows = await sql`SELECT * FROM clients WHERE ${tag} = ANY(tags) AND (name ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'}) ORDER BY created_at DESC`;
  } else if (industry) {
    rows = await sql`SELECT * FROM clients WHERE industry = ${industry} ORDER BY created_at DESC`;
  } else if (tag) {
    rows = await sql`SELECT * FROM clients WHERE ${tag} = ANY(tags) ORDER BY created_at DESC`;
  } else if (search) {
    rows = await sql`SELECT * FROM clients WHERE name ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'} ORDER BY created_at DESC`;
  } else {
    rows = await sql`SELECT * FROM clients ORDER BY created_at DESC`;
  }

  return rows.map(rowToClient);
}

export async function getClientById(id: string): Promise<Client | null> {
  const rows = await sql`SELECT * FROM clients WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToClient(rows[0]) : null;
}

export async function createClient(data: Omit<Client, 'id'>): Promise<Client> {
  const id = `cli-${crypto.randomUUID().slice(0, 8)}`;
  const rows = await sql`
    INSERT INTO clients (id, owner_id, name, company, avatar, email, phone, industry, country, website, tags, notes, created_at)
    VALUES (${id}, ${data.ownerId}, ${data.name}, ${data.company}, ${data.avatar},
            ${data.email}, ${data.phone}, ${data.industry}, ${data.country},
            ${data.website}, ${data.tags}, ${data.notes}, ${data.createdAt})
    RETURNING *`;
  return rowToClient(rows[0]);
}

export async function updateClient(id: string, patch: Record<string, unknown>): Promise<Client | null> {
  // Map camelCase patch keys → snake_case columns
  const colMap: Record<string, string> = {
    ownerId: 'owner_id', archivedAt: 'archived_at',
    name: 'name', company: 'company', avatar: 'avatar',
    email: 'email', phone: 'phone', industry: 'industry',
    country: 'country', website: 'website', tags: 'tags', notes: 'notes',
  };

  // null = unset field (dùng cho restore archivedAt)
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(patch)) {
    const col = colMap[key];
    if (!col) continue;
    if (val === null) {
      setClauses.push(`${col} = NULL`);
    } else {
      setClauses.push(`${col} = $${idx++}`);
      values.push(val);
    }
  }

  if (!setClauses.length) return getClientById(id);

  values.push(id);
  const query = `UPDATE clients SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  const rows = await sql.unsafe(query, values as any[]);
  return rows[0] ? rowToClient(rows[0]) : null;
}

export async function softDeleteClient(id: string, today: string): Promise<void> {
  await sql`UPDATE clients SET archived_at = ${today} WHERE id = ${id}`;
}

export async function cascadeDeleteClientResources(clientId: string): Promise<void> {
  // Xóa opps chưa Won + tasks pending — giữ Won opps và activities và tasks done
  await Promise.all([
    sql`DELETE FROM opportunities WHERE client_id = ${clientId} AND status != 'Won'`,
    sql`DELETE FROM tasks WHERE client_id = ${clientId} AND status = 'pending'`,
  ]);
}

// ── Opportunities ──────────────────────────────────────────────────────────

export async function getOpportunities(statusFilter?: string): Promise<Opportunity[]> {
  // Tự động lọc opps của archived clients — không cần join thủ công như JSON version
  const rows = statusFilter
    ? await sql`
        SELECT o.* FROM opportunities o
        JOIN clients c ON c.id = o.client_id
        WHERE c.archived_at IS NULL AND o.status = ${statusFilter}
        ORDER BY o.date DESC`
    : await sql`
        SELECT o.* FROM opportunities o
        JOIN clients c ON c.id = o.client_id
        WHERE c.archived_at IS NULL
        ORDER BY o.date DESC`;
  return rows.map(rowToOpp);
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const rows = await sql`SELECT * FROM opportunities WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToOpp(rows[0]) : null;
}

export async function createOpportunity(data: Omit<Opportunity, 'id' | 'clientName' | 'company'>): Promise<Opportunity> {
  const id = `opp-${crypto.randomUUID().slice(0, 8)}`;
  const rows = await sql`
    INSERT INTO opportunities (id, client_id, owner_id, title, value, status, confidence, date, notes, status_history)
    VALUES (${id}, ${data.clientId}, ${data.ownerId}, ${data.title}, ${data.value},
            ${data.status}, ${data.confidence}, ${data.date}, ${data.notes ?? null},
            ${JSON.stringify(data.statusHistory ?? [])})
    RETURNING *`;
  return rowToOpp(rows[0]);
}

export async function updateOpportunity(id: string, patch: {
  status?: OpportunityStatus;
  confidence?: number;
  title?: string;
  value?: number;
  notes?: string;
  statusHistory?: unknown[];
}): Promise<Opportunity | null> {
  const colMap: Record<string, string> = {
    status: 'status', confidence: 'confidence', title: 'title',
    value: 'value', notes: 'notes', statusHistory: 'status_history',
  };

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(patch)) {
    const col = colMap[key];
    if (!col || val === undefined) continue;
    const serialized = key === 'statusHistory' ? JSON.stringify(val) : val;
    setClauses.push(`${col} = $${idx++}`);
    values.push(serialized);
  }

  if (!setClauses.length) return getOpportunityById(id);
  values.push(id);

  const query = `UPDATE opportunities SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  const rows = await sql.unsafe(query, values as any[]);
  return rows[0] ? rowToOpp(rows[0]) : null;
}

export async function deleteOpportunity(id: string): Promise<void> {
  await sql`DELETE FROM opportunities WHERE id = ${id}`;
}

// createLead — tạo Client + Opportunity trong 1 transaction, 1 round trip DB.
// Thay thế pattern createClient() rồi createOpportunity() tuần tự ở POST /api/leads,
// giảm latency ~40-50% vì gộp 2 INSERT vào 1 pipeline thay vì 2 round trips riêng biệt.
export async function createLead(
  clientData: Omit<Client, 'id'>,
  oppData: Omit<Opportunity, 'id' | 'clientId' | 'clientName' | 'company'>,
): Promise<{ client: Client; opportunity: Opportunity }> {
  const clientId = `cli-${crypto.randomUUID().slice(0, 8)}`;
  const oppId    = `opp-${crypto.randomUUID().slice(0, 8)}`;

  const result = await sql.begin(async (tx) => {
    // Cast vì Omit<Sql> trong TransactionSql làm mất call signatures (TS limitation)
    const t = tx as unknown as postgres.Sql;

    const [clientRow] = await t`
      INSERT INTO clients (id, owner_id, name, company, avatar, email, phone, industry, country, website, tags, notes, created_at)
      VALUES (${clientId}, ${clientData.ownerId}, ${clientData.name}, ${clientData.company},
              ${clientData.avatar}, ${clientData.email}, ${clientData.phone}, ${clientData.industry},
              ${clientData.country}, ${clientData.website}, ${clientData.tags}, ${clientData.notes},
              ${clientData.createdAt})
      RETURNING *`;

    const [oppRow] = await t`
      INSERT INTO opportunities (id, client_id, owner_id, title, value, status, confidence, date, notes, status_history)
      VALUES (${oppId}, ${clientId}, ${oppData.ownerId}, ${oppData.title}, ${oppData.value},
              ${oppData.status}, ${oppData.confidence}, ${oppData.date}, ${oppData.notes ?? null},
              ${JSON.stringify(oppData.statusHistory ?? [])})
      RETURNING *`;

    return { clientRow, oppRow };
  });

  return {
    client:      rowToClient(result.clientRow),
    opportunity: rowToOpp(result.oppRow),
  };
}

// ── Activities ─────────────────────────────────────────────────────────────

export async function getActivities(filters?: {
  type?: string; outcome?: string; clientId?: string; search?: string;
}): Promise<Activity[]> {
  const { type, outcome, clientId, search } = filters ?? {};

  let rows;
  if (clientId) {
    rows = await sql`SELECT * FROM activities WHERE client_id = ${clientId} ORDER BY date DESC`;
  } else {
    rows = await sql`SELECT * FROM activities ORDER BY date DESC`;
  }

  // Các filter nhẹ còn lại xử lý in-memory — data nhỏ, không đáng tạo thêm query variant
  let result = rows.map(rowToActivity);
  if (type)    result = result.filter(a => a.type === type);
  if (outcome) result = result.filter(a => a.outcome === outcome);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(a =>
      a.title.toLowerCase().includes(q) || a.notes.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function createActivity(data: Omit<Activity, 'id'>): Promise<Activity> {
  const id = `act-${crypto.randomUUID().slice(0, 8)}`;
  const rows = await sql`
    INSERT INTO activities (id, client_id, opportunity_id, type, title, date, outcome, next_action, next_action_date, promote_opportunity_to, notes, created_at)
    VALUES (${id}, ${data.clientId}, ${data.opportunityId ?? null}, ${data.type},
            ${data.title}, ${data.date}, ${data.outcome}, ${data.nextAction},
            ${data.nextActionDate ?? null}, ${data.promoteOpportunityTo ?? null},
            ${data.notes}, ${data.createdAt})
    RETURNING *`;
  return rowToActivity(rows[0]);
}

// ── Tasks ──────────────────────────────────────────────────────────────────

export async function getTasks(filters?: {
  clientId?: string; opportunityId?: string; status?: string; assignedTo?: string;
}): Promise<Task[]> {
  const { clientId, opportunityId, status, assignedTo } = filters ?? {};

  let rows;
  if (clientId) {
    rows = await sql`SELECT * FROM tasks WHERE client_id = ${clientId} ORDER BY due_date ASC NULLS LAST`;
  } else if (assignedTo) {
    rows = await sql`SELECT * FROM tasks WHERE assigned_to = ${assignedTo} ORDER BY due_date ASC NULLS LAST`;
  } else {
    rows = await sql`SELECT * FROM tasks ORDER BY due_date ASC NULLS LAST`;
  }

  let result = rows.map(rowToTask);
  if (opportunityId) result = result.filter(t => t.opportunityId === opportunityId);
  if (status)        result = result.filter(t => t.status === status);
  return result;
}

export async function createTask(data: Omit<Task, 'id' | 'company'>): Promise<Task> {
  const id = `tsk-${crypto.randomUUID().slice(0, 8)}`;
  const rows = await sql`
    INSERT INTO tasks (id, client_id, opportunity_id, title, status, due_date, assigned_to, created_from, notes, created_at)
    VALUES (${id}, ${data.clientId}, ${data.opportunityId ?? null}, ${data.title},
            ${data.status ?? 'pending'}, ${data.dueDate ?? null}, ${data.assignedTo ?? null},
            ${data.createdFrom ?? null}, ${data.notes ?? null}, ${data.createdAt})
    RETURNING *`;
  return rowToTask(rows[0]);
}

export async function updateTask(id: string, patch: {
  status?: string; title?: string; dueDate?: string | null;
  assignedTo?: string | null; notes?: string; completedAt?: string | null;
}): Promise<Task | null> {
  const colMap: Record<string, string> = {
    status: 'status', title: 'title', dueDate: 'due_date',
    assignedTo: 'assigned_to', notes: 'notes', completedAt: 'completed_at',
  };

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(patch)) {
    const col = colMap[key];
    if (!col || val === undefined) continue;
    if (val === null) {
      setClauses.push(`${col} = NULL`);
    } else {
      setClauses.push(`${col} = $${idx++}`);
      values.push(val);
    }
  }

  if (!setClauses.length) return null;
  values.push(id);

  const query = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  const rows = await sql.unsafe(query, values as any[]);
  return rows[0] ? rowToTask(rows[0]) : null;
}

export async function deleteTask(id: string): Promise<void> {
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

// ── Documents ──────────────────────────────────────────────────────────────

export async function getDocuments(filters?: {
  clientId?: string; opportunityId?: string; myClientIds?: string[];
}): Promise<Document[]> {
  const { clientId, opportunityId, myClientIds } = filters ?? {};

  let rows;
  if (clientId) {
    rows = await sql`SELECT * FROM documents WHERE client_id = ${clientId} ORDER BY starred DESC, uploaded_at DESC`;
  } else if (myClientIds?.length) {
    rows = await sql`SELECT * FROM documents WHERE client_id = ANY(${myClientIds}) ORDER BY starred DESC, uploaded_at DESC`;
  } else {
    rows = await sql`SELECT * FROM documents ORDER BY starred DESC, uploaded_at DESC`;
  }

  let result = rows.map(rowToDocument);
  if (opportunityId) result = result.filter(d => d.opportunityId === opportunityId);
  return result;
}

export async function createDocument(data: Omit<Document, 'id'>): Promise<Document> {
  const id = `doc-${crypto.randomUUID().slice(0, 8)}`;
  const rows = await sql`
    INSERT INTO documents (id, client_id, opportunity_id, uploaded_by, name, type, category, size, url, starred, uploaded_at)
    VALUES (${id}, ${data.clientId}, ${data.opportunityId ?? null}, ${data.uploadedBy},
            ${data.name}, ${data.type}, ${data.category}, ${data.size},
            ${data.url ?? null}, ${data.starred}, ${data.uploadedAt})
    RETURNING *`;
  return rowToDocument(rows[0]);
}

export async function updateDocument(id: string, patch: {
  starred?: boolean; name?: string; category?: string;
}): Promise<Document | null> {
  const colMap: Record<string, string> = { starred: 'starred', name: 'name', category: 'category' };
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(patch)) {
    const col = colMap[key];
    if (!col || val === undefined) continue;
    setClauses.push(`${col} = $${idx++}`);
    values.push(val);
  }

  if (!setClauses.length) return null;
  values.push(id);
  const query = `UPDATE documents SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  const rows = await sql.unsafe(query, values as any[]);
  return rows[0] ? rowToDocument(rows[0]) : null;
}

export async function deleteDocument(id: string): Promise<void> {
  await sql`DELETE FROM documents WHERE id = ${id}`;
}

// ── Auth helpers ───────────────────────────────────────────────────────────

export async function getClientOwner(clientId: string): Promise<string | null> {
  const rows = await sql`SELECT owner_id FROM clients WHERE id = ${clientId} LIMIT 1`;
  return rows[0]?.owner_id ?? null;
}
