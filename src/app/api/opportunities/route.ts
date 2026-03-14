// src/app/api/opportunities/route.ts — GET và POST danh sách opportunities
//
// Auth: middleware đã inject x-user-* headers, nhưng route này không gọi
// requireRole() — intentional decision: GET/POST opportunities chỉ được gọi
// từ client-side store sau khi đã đăng nhập (guard ở middleware page level).
// Ownership filtering (sales chỉ thấy opp của mình) được xử lý ở Zustand
// store/selector phía client, không filter tại API — đơn giản hóa query.
//
// Nếu cần tăng cường bảo mật API level: thêm requireRole() và filter
// theo session.id ở GET handler.
import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Opportunity, Client } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

// ── GET /api/opportunities ────────────────────────────────────────────────────
// Query params:
//   ?status=Lead|Qualified|Proposal|Negotiation|Won|Lost  → filter theo stage
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const [opps, clients] = await Promise.all([
      readJSON<Opportunity[]>('opportunities.json'),
      readJSON<Client[]>('clients.json'),
    ]);

    // Loại bỏ opps thuộc client đã archived — client soft-deleted không còn hiển thị
    // ở bất kỳ trang nào, opps Won được giữ trong DB (lịch sử doanh thu)
    // nhưng không nên xuất hiện trên UI sau khi client bị xóa.
    const archivedClientIds = new Set(
      clients.filter(c => c.archivedAt).map(c => c.id)
    );

    let result = opps.filter(o => !archivedClientIds.has(o.clientId));
    if (statusFilter) result = result.filter(o => o.status === statusFilter);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// ── POST /api/opportunities ───────────────────────────────────────────────────
// Body: { clientId, title, value, status, confidence, notes? }
// ownerId tự động copy từ client.ownerId tại đây — caller không cần truyền.
// Dùng cho AddDealModal (deal thứ 2, 3... cho client đã tồn tại).
export async function POST(request: Request) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const body    = await request.json();

    if (!body.clientId || !body.title || !body.value) {
      return NextResponse.json(
        { error: 'clientId, title, value là bắt buộc' },
        { status: 400 }
      );
    }

    // Lấy ownerId từ client — không tin vào body
    const clients   = await readJSON<Client[]>('clients.json');
    const client    = clients.find(c => c.id === body.clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const opps   = await readJSON<Opportunity[]>('opportunities.json');
    const newOpp: Opportunity = {
      id:         `opp-${crypto.randomUUID().slice(0, 8)}`,
      ownerId:    client.ownerId,  // copy từ client, không nhận từ body
      clientId:   body.clientId,
      title:      body.title,
      value:      Number(body.value),
      status:     body.status     ?? 'Lead',
      confidence: body.confidence ?? STAGE_DEFAULT_CONFIDENCE[body.status ?? 'Lead'],
      date:       body.date       ?? new Date().toISOString().split('T')[0],
      notes:      body.notes,
      statusHistory: [],
    };

    opps.push(newOpp);
    await writeJSON('opportunities.json', opps);
    return NextResponse.json(newOpp, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
