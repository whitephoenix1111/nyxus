// PATCH /api/leads/[id]/assign
// Manager only — đổi ownerId của Client + tất cả Opportunity liên quan
// Body: { ownerId: string }  (userId của salesperson mới)

import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Client, Opportunity, UserRecord } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(['manager']);
    const { id } = await params;
    const { ownerId: newOwnerId } = await request.json();

    if (!newOwnerId) {
      return NextResponse.json({ error: 'ownerId là bắt buộc' }, { status: 400 });
    }

    // Xác nhận user mới tồn tại và là salesperson
    const users = await readJSON<UserRecord[]>('users.json');
    const newOwner = users.find(u => u.id === newOwnerId);
    if (!newOwner) {
      return NextResponse.json({ error: 'User không tồn tại' }, { status: 404 });
    }
    if (newOwner.role !== 'salesperson') {
      return NextResponse.json({ error: 'Chỉ có thể assign cho salesperson' }, { status: 400 });
    }

    const [clients, opportunities] = await Promise.all([
      readJSON<Client[]>('clients.json'),
      readJSON<Opportunity[]>('opportunities.json'),
    ]);

    // Cập nhật ownerId trên Client
    const clientIdx = clients.findIndex(c => c.id === id);
    if (clientIdx === -1) {
      return NextResponse.json({ error: 'Client không tồn tại' }, { status: 404 });
    }
    clients[clientIdx].ownerId = newOwnerId;

    // Cập nhật ownerId trên tất cả Opportunity của client này
    const updatedOpps = opportunities.map(o =>
      o.clientId === id ? { ...o, ownerId: newOwnerId } : o
    );

    await Promise.all([
      writeJSON('clients.json', clients),
      writeJSON('opportunities.json', updatedOpps),
    ]);

    return NextResponse.json({
      success: true,
      assignedTo: { id: newOwner.id, name: newOwner.name },
    });
  } catch (err) {
    console.error('[PATCH /api/leads/[id]/assign]', err);
    return NextResponse.json({ error: 'Failed to assign lead' }, { status: 500 });
  }
}
