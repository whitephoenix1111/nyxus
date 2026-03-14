// src/app/api/opportunities/[id]/route.ts — PATCH và DELETE cho một opportunity
//
// Ownership guard: dùng opp.ownerId (copy từ client khi tạo).
// Manager bypass toàn bộ guard.
import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Opportunity, Client, Task, UserRole } from '@/types';

/** Sales chỉ được sửa/xóa deal mình phụ trách; manager bypass. */
function canModify(sessionId: string, sessionRole: UserRole, ownerId: string): boolean {
  if (sessionRole === 'manager') return true;
  return sessionId === ownerId;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── PATCH /api/opportunities/[id] ────────────────────────────────────────────
// Body: Partial<Opportunity> — thường là { status, confidence } từ PromoteModal.
// confidence reset về default của stage mới khi promote (do store gửi lên).
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const { id }  = await params;
    const body    = await request.json();

    const opps = await readJSON<Opportunity[]>('opportunities.json');
    const idx  = opps.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!canModify(session.id, session.role, opps[idx].ownerId)) {
      return NextResponse.json(
        { error: 'Forbidden: bạn không phải owner của deal này' },
        { status: 403 }
      );
    }

    opps[idx] = { ...opps[idx], ...body };
    await writeJSON('opportunities.json', opps);

    return NextResponse.json(opps[idx]);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// ── DELETE /api/opportunities/[id] ───────────────────────────────────────────
// Side effect: nếu xóa opp cuối của client và client không có opp Won nào
// → cascade xóa tasks pending của client đó.
// Activities luôn được giữ lại — log lịch sử là bất biến.
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const { id }  = await params;

    const [opps, tasks] = await Promise.all([
      readJSON<Opportunity[]>('opportunities.json'),
      readJSON<Task[]>('tasks.json'),
    ]);

    const deletedOpp = opps.find(o => o.id === id);
    if (!deletedOpp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!canModify(session.id, session.role, deletedOpp.ownerId)) {
      return NextResponse.json(
        { error: 'Forbidden: bạn không phải owner của deal này' },
        { status: 403 }
      );
    }

    const filteredOpps = opps.filter((o) => o.id !== id);
    const remaining    = filteredOpps.filter(o => o.clientId === deletedOpp.clientId);

    const writes: Promise<void>[] = [
      writeJSON('opportunities.json', filteredOpps),
    ];

    // Nếu client không còn opp nào → dọn tasks pending
    if (remaining.length === 0) {
      writes.push(
        writeJSON('tasks.json', tasks.filter(
          t => t.clientId !== deletedOpp.clientId || t.status === 'done'
        ))
      );
    }

    await Promise.all(writes);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
