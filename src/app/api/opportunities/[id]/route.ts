import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Opportunity, Client, Task } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const opps = await readJSON<Opportunity[]>('opportunities.json');
    const idx = opps.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    opps[idx] = { ...opps[idx], ...body };
    await writeJSON('opportunities.json', opps);

    // Nếu promote → Won thì activate Client (isProspect = false)
    if (body.status === 'Won') {
      const clients = await readJSON<Client[]>('clients.json');
      const clientIdx = clients.findIndex(c => c.id === opps[idx].clientId);
      if (clientIdx !== -1 && clients[clientIdx].isProspect) {
        clients[clientIdx].isProspect = false;
        await writeJSON('clients.json', clients);
      }
    }

    return NextResponse.json(opps[idx]);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [opps, clients, tasks] = await Promise.all([
      readJSON<Opportunity[]>('opportunities.json'),
      readJSON<Client[]>('clients.json'),
      readJSON<Task[]>('tasks.json'),
    ]);

    const deletedOpp = opps.find(o => o.id === id);
    const filteredOpps = opps.filter((o) => o.id !== id);

    await writeJSON('opportunities.json', filteredOpps);

    // Nếu đây là opportunity cuối của prospect → cascade xóa client
    if (deletedOpp) {
      const remaining = filteredOpps.filter(o => o.clientId === deletedOpp.clientId);
      const client = clients.find(c => c.id === deletedOpp.clientId);

      if (remaining.length === 0 && client?.isProspect) {
        await Promise.all([
          // Xóa client
          writeJSON('clients.json', clients.filter(c => c.id !== deletedOpp.clientId)),
          // Activities: giữ lại toàn bộ (log lịch sử là bất biến)
          // Tasks: xóa pending, giữ done
          writeJSON('tasks.json', tasks.filter(
            (t) => t.clientId !== deletedOpp.clientId || t.status === 'done'
          )),
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
