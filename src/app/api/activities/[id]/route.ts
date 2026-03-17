// src/app/api/activities/[id]/route.ts
// GET · PATCH · DELETE activity theo id
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import sql from '@/lib/db';
import type postgres from 'postgres';

interface RouteParams { params: Promise<{ id: string }> }

// ── Mapper ─────────────────────────────────────────────────────────────────

function rowToActivity(r: any) {
  return {
    id: r.id,
    clientId: r.client_id,
    opportunityId: r.opportunity_id ?? undefined,
    type: r.type,
    title: r.title,
    date: typeof r.date === 'string' ? r.date.slice(0, 10) : r.date.toISOString().slice(0, 10),
    outcome: r.outcome,
    nextAction: r.next_action,
    nextActionDate: r.next_action_date
      ? (typeof r.next_action_date === 'string' ? r.next_action_date.slice(0, 10) : r.next_action_date.toISOString().slice(0, 10))
      : undefined,
    promoteOpportunityTo: r.promote_opportunity_to ?? undefined,
    notes: r.notes,
    createdAt: typeof r.created_at === 'string' ? r.created_at.slice(0, 10) : r.created_at.toISOString().slice(0, 10),
  };
}

// ── GET /api/activities/[id] ───────────────────────────────────────────────

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requireSession();
    const { id } = await params;
    const rows = await sql`SELECT * FROM activities WHERE id = ${id} LIMIT 1`;
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToActivity(rows[0]));
  } catch {
    return NextResponse.json({ error: 'Failed to read activity' }, { status: 500 });
  }
}

// ── PATCH /api/activities/[id] ─────────────────────────────────────────────

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();

    const colMap: Record<string, string> = {
      type: 'type', title: 'title', date: 'date',
      outcome: 'outcome', nextAction: 'next_action',
      nextActionDate: 'next_action_date', notes: 'notes',
      promoteOpportunityTo: 'promote_opportunity_to',
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(body)) {
      const col = colMap[key];
      if (!col || val === undefined) continue;
      if (val === null) {
        setClauses.push(`${col} = NULL`);
      } else {
        setClauses.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (!setClauses.length) {
      const rows = await sql`SELECT * FROM activities WHERE id = ${id} LIMIT 1`;
      if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(rowToActivity(rows[0]));
    }

    values.push(id);
    const query = `UPDATE activities SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const rows = await sql.unsafe(query, values as any[]);
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToActivity(rows[0]));
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// ── DELETE /api/activities/[id] ────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await requireSession();
    const { id } = await params;
    const rows = await sql`DELETE FROM activities WHERE id = ${id} RETURNING id`;
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
