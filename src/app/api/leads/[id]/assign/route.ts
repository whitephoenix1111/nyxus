// src/app/api/leads/[id]/assign/route.ts
// PATCH — Manager only: đổi ownerId của Client + tất cả Opportunity liên quan
// Body: { ownerId: string }
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getClientById, getUserById, updateClient } from '@/lib/queries';
import sql from '@/lib/db';
import type postgres from 'postgres';

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(['manager']);
    const { id }               = await params;
    const { ownerId: newOwner } = await request.json();

    if (!newOwner) {
      return NextResponse.json({ error: 'ownerId là bắt buộc' }, { status: 400 });
    }

    // Xác nhận user tồn tại và là salesperson
    const user = await getUserById(newOwner);
    if (!user)                     return NextResponse.json({ error: 'User không tồn tại' }, { status: 404 });
    if (user.role !== 'salesperson') return NextResponse.json({ error: 'Chỉ có thể assign cho salesperson' }, { status: 400 });

    const client = await getClientById(id);
    if (!client) return NextResponse.json({ error: 'Client không tồn tại' }, { status: 404 });

    // Cập nhật client.ownerId + tất cả opp.ownerId trong 1 transaction
    // Transaction atomic: update client + tất cả opps cùng lúc
    // Cast tx sang Sql vì Omit<Sql> trong TransactionSql làm mất call signatures (TS limitation)
    await sql.begin(async (tx) => {
      const t = tx as unknown as postgres.Sql;
      await t`UPDATE clients       SET owner_id = ${newOwner} WHERE id = ${id}`;
      await t`UPDATE opportunities SET owner_id = ${newOwner} WHERE client_id = ${id}`;
    });

    return NextResponse.json({ success: true, assignedTo: { id: user.id, name: user.name } });
  } catch (err) {
    console.error('[PATCH /api/leads/:id/assign]', err);
    return NextResponse.json({ error: 'Failed to assign lead' }, { status: 500 });
  }
}
