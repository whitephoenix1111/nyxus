import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Opportunity, Client } from '@/types';

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

    // BƯỚC 2: Nếu promote → Won thì activate Client (isProspect = false)
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
    const opps = await readJSON<Opportunity[]>('opportunities.json');

    // BƯỚC 3: Lưu lại opportunity sắp xóa trước khi filter
    const deletedOpp = opps.find(o => o.id === id);
    const filtered = opps.filter((o) => o.id !== id);
    await writeJSON('opportunities.json', filtered);

    // Nếu đây là opportunity cuối cùng của một prospect → tự xóa Client
    if (deletedOpp) {
      const remaining = filtered.filter(o => o.clientId === deletedOpp.clientId);
      if (remaining.length === 0) {
        const clients = await readJSON<Client[]>('clients.json');
        const client = clients.find(c => c.id === deletedOpp.clientId);
        if (client?.isProspect) {
          await writeJSON('clients.json',
            clients.filter(c => c.id !== deletedOpp.clientId));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
