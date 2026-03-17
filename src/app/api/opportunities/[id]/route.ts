// src/app/api/opportunities/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getOpportunityById, updateOpportunity, deleteOpportunity, getTasks, deleteTask } from '@/lib/queries';
import type { UserRole } from '@/types';

function canModify(sessionId: string, sessionRole: UserRole, ownerId: string): boolean {
  if (sessionRole === 'manager') return true;
  return sessionId === ownerId;
}

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const { id }  = await params;
    const body    = await request.json();

    const opp = await getOpportunityById(id);
    if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canModify(session.id, session.role, opp.ownerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await updateOpportunity(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const { id }  = await params;

    const opp = await getOpportunityById(id);
    if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canModify(session.id, session.role, opp.ownerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteOpportunity(id);

    // Nếu client không còn opp nào → dọn tasks pending của client đó
    const { getOpportunities } = await import('@/lib/queries');
    const remaining = (await getOpportunities()).filter(o => o.clientId === opp.clientId);
    if (remaining.length === 0) {
      const tasks = await getTasks({ clientId: opp.clientId, status: 'pending' });
      await Promise.all(tasks.map(t => deleteTask(t.id)));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
