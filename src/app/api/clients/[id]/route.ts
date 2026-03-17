// src/app/api/clients/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getClientById, updateClient, softDeleteClient, cascadeDeleteClientResources } from '@/lib/queries';
import type { UserRole } from '@/types';

function canModify(sessionId: string, sessionRole: UserRole, ownerId: string): boolean {
  if (sessionRole === 'manager') return true;
  return sessionId === ownerId;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await getClientById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: 'Failed to read client' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const { id } = await params;
    const body = await request.json();

    const existing = await getClientById(id);
    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    if (!canModify(session.id, session.role, existing.ownerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // null = xóa field (dùng cho restore archivedAt)
    const updated = await updateClient(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const { id } = await params;

    const client = await getClientById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    if (!canModify(session.id, session.role, client.ownerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().slice(0, 10);
    // Soft delete + cascade — 2 query chạy song song, đều là DELETE/UPDATE đơn giản
    await Promise.all([
      softDeleteClient(id, today),
      cascadeDeleteClientResources(id),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
