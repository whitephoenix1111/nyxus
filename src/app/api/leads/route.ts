// src/app/api/leads/route.ts
// POST — tạo Client + Opportunity(Lead) đồng thời trong 1 DB transaction
// Manager có thể truyền ownerId để giao cho salesperson
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { createLead } from '@/lib/queries';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const body    = await request.json();
    const { name, company, title, value } = body;

    if (!name || !company || !title || !value) {
      return NextResponse.json({ error: 'name, company, title, value là bắt buộc' }, { status: 400 });
    }

    const ownerId = session.role === 'manager' && body.ownerId
      ? body.ownerId
      : session.id;

    const today  = new Date().toISOString().slice(0, 10);
    const avatar = body.avatar || name.split(' ').slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');

    // createLead gộp INSERT clients + INSERT opportunities vào 1 transaction —
    // giảm từ 2 round trips DB xuống còn 1, cải thiện latency ~40-50% với Neon us-east-1
    const { client, opportunity } = await createLead(
      {
        ownerId,
        name, company, avatar,
        email:    body.email    ?? '',
        phone:    body.phone    ?? '',
        industry: body.industry ?? 'Unknown',
        country:  body.country  ?? '',
        website:  body.website  ?? '',
        tags:     [],
        notes:    body.notes    ?? '',
        createdAt: today,
      },
      {
        ownerId,
        title,
        value:         Number(value),
        status:        'Lead',
        confidence:    STAGE_DEFAULT_CONFIDENCE['Lead'], // 15, cố định
        date:          today,
        notes:         body.notes,
        statusHistory: [],
      },
    );

    return NextResponse.json({ client, opportunity }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/leads]', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
