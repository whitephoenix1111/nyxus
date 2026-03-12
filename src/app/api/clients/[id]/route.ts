import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Client, Opportunity, Task } from '@/types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const clients = await readJSON<Client[]>('clients.json');
    const client = clients.find((c) => c.id === id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: 'Failed to read client' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const clients = await readJSON<Client[]>('clients.json');

    const idx = clients.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    clients[idx] = { ...clients[idx], ...body };
    await writeJSON('clients.json', clients);

    return NextResponse.json(clients[idx]);
  } catch {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE — cascade theo quy tắc:
//   ✅ Giữ: activities (log đã xảy ra), tasks đã done
//   ❌ Xóa: opportunities, tasks đang pending
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [clients, opportunities, tasks] = await Promise.all([
      readJSON<Client[]>('clients.json'),
      readJSON<Opportunity[]>('opportunities.json'),
      readJSON<Task[]>('tasks.json'),
    ]);

    const clientExists = clients.some((c) => c.id === id);
    if (!clientExists) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await Promise.all([
      writeJSON('clients.json',       clients.filter((c) => c.id !== id)),
      writeJSON('opportunities.json', opportunities.filter((o) => o.clientId !== id)),
      // Activities: giữ lại toàn bộ (log lịch sử là bất biến)
      // Tasks: xóa pending, giữ done
      writeJSON('tasks.json', tasks.filter(
        (t) => t.clientId !== id || t.status === 'done'
      )),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
