import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Client, Opportunity, Activity } from '@/types';

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

// DELETE — cascade xóa opportunities và activities liên kết
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [clients, opportunities, activities] = await Promise.all([
      readJSON<Client[]>('clients.json'),
      readJSON<Opportunity[]>('opportunities.json'),
      readJSON<Activity[]>('activities.json'),
    ]);

    const clientExists = clients.some((c) => c.id === id);
    if (!clientExists) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Lấy danh sách opportunityId liên kết để xóa activities
    const linkedOppIds = new Set(
      opportunities.filter((o) => o.clientId === id).map((o) => o.id)
    );

    await Promise.all([
      writeJSON('clients.json',      clients.filter((c) => c.id !== id)),
      writeJSON('opportunities.json', opportunities.filter((o) => o.clientId !== id)),
      writeJSON('activities.json',    activities.filter(
        (a) => a.clientId !== id && !(a.opportunityId && linkedOppIds.has(a.opportunityId))
      )),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
