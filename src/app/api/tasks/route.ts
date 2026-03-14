import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Task } from '@/types';

// GET /api/tasks
// Query params: clientId, opportunityId, status, assignedTo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId      = searchParams.get('clientId');
    const opportunityId = searchParams.get('opportunityId');
    const status        = searchParams.get('status');
    const assignedTo    = searchParams.get('assignedTo');

    let tasks = await readJSON<Task[]>('tasks.json');

    if (clientId)      tasks = tasks.filter(t => t.clientId === clientId);
    if (opportunityId) tasks = tasks.filter(t => t.opportunityId === opportunityId);
    if (status)        tasks = tasks.filter(t => t.status === status);
    if (assignedTo)    tasks = tasks.filter(t => t.assignedTo === assignedTo);

    // Overdue lên đầu, sau đó sort theo dueDate tăng dần
    tasks.sort((a, b) => {
      const today = new Date().toISOString().split('T')[0];
      const aOverdue = a.status === 'pending' && a.dueDate && a.dueDate < today;
      const bOverdue = b.status === 'pending' && b.dueDate && b.dueDate < today;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: 'Failed to read tasks' }, { status: 500 });
  }
}

// POST /api/tasks
// Side effect: nếu caller là salesperson và body không truyền assignedTo,
// tự động set assignedTo = session.id — task của sales luôn có chủ rõ ràng.
// Manager tạo task: dùng assignedTo từ body (có thể undefined nếu không chọn).
export async function POST(request: Request) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const body    = await request.json();

    // Auto-assign cho salesperson: đảm bảo task luôn có assignedTo
    // dù form không gửi field này (sales không thấy field assignedTo trong UI).
    // Manager giữ nguyên giá trị từ body — có thể có hoặc không.
    const assignedTo = session.role === 'salesperson'
      ? (body.assignedTo ?? session.id)
      : (body.assignedTo ?? undefined);

    const newTask: Task = {
      ...body,
      assignedTo,
      id:        `tsk-${crypto.randomUUID().slice(0, 8)}`,
      status:    body.status ?? 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const tasks = await readJSON<Task[]>('tasks.json');
    tasks.push(newTask);
    await writeJSON('tasks.json', tasks);

    return NextResponse.json(newTask, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
