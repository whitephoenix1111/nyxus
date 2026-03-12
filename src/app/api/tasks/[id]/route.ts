import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Task } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/tasks/[id]
// Nếu status → done: tự set completedAt = today
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(['salesperson', 'manager']);
    const { id } = await params;
    const body = await request.json();

    const tasks = await readJSON<Task[]>('tasks.json');
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated: Task = { ...tasks[idx], ...body };

    // Auto-set completedAt khi mark done
    if (body.status === 'done' && !updated.completedAt) {
      updated.completedAt = new Date().toISOString().split('T')[0];
    }

    // Clear completedAt nếu reopen về pending
    if (body.status === 'pending') {
      updated.completedAt = undefined;
    }

    tasks[idx] = updated;
    await writeJSON('tasks.json', tasks);

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/tasks/:id]', err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(['salesperson', 'manager']);
    const { id } = await params;
    const tasks = await readJSON<Task[]>('tasks.json');
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await writeJSON('tasks.json', filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
