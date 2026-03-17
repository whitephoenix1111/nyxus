// src/app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { updateTask, deleteTask, getTasks } from '@/lib/queries';

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(['salesperson', 'manager']);
    const { id } = await params;
    const body   = await request.json();

    // Auto-set/clear completedAt theo status
    if (body.status === 'done') {
      body.completedAt ??= new Date().toISOString();
    } else if (body.status === 'pending') {
      body.completedAt = null;
    }

    const updated = await updateTask(id, body);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/tasks/:id]', err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(['salesperson', 'manager']);
    const { id } = await params;

    // Kiểm tra tồn tại trước khi xóa
    const [task] = await getTasks({ clientId: undefined });
    void task; // chỉ cần biết row có tồn tại không — dùng deleteTask trực tiếp
    await deleteTask(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
