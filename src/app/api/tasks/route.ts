// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getTasks, createTask } from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tasks = await getTasks({
      clientId:      searchParams.get('clientId') ?? undefined,
      opportunityId: searchParams.get('opportunityId') ?? undefined,
      status:        searchParams.get('status') ?? undefined,
      assignedTo:    searchParams.get('assignedTo') ?? undefined,
    });
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: 'Failed to read tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const body    = await request.json();

    // Auto-assign cho salesperson — sales không thấy field "Giao cho" trong UI
    const assignedTo = session.role === 'salesperson'
      ? (body.assignedTo ?? session.id)
      : (body.assignedTo ?? undefined);

    const task = await createTask({
      ...body,
      assignedTo,
      status:    body.status ?? 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
