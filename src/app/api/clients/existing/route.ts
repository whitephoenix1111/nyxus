// src/app/api/clients/existing/route.ts
// POST — import khách hàng đã hợp tác trước đây (không qua pipeline Lead)
// Tạo Client + Opportunity Won đồng thời
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { createClient, createOpportunity } from '@/lib/queries';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['salesperson', 'manager']);
    const body    = await request.json();
    const { name, company, value } = body;

    if (!name || !company || !value) {
      return NextResponse.json({ error: 'name, company, value là bắt buộc' }, { status: 400 });
    }

    // Manager có thể chỉ định ownerId; salesperson luôn dùng session.id
    const ownerId = session.role === 'manager' && body.ownerId
      ? body.ownerId
      : session.id;

    const today  = new Date().toISOString().slice(0, 10);
    const avatar = name.split(' ').slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');

    const client = await createClient({
      ownerId,
      name,
      company,
      avatar,
      email:     body.email     ?? '',
      phone:     body.phone     ?? '',
      industry:  body.industry  ?? 'Unknown',
      country:   body.country   ?? '',
      website:   body.website   ?? '',
      tags:      body.tags      ?? [],
      notes:     body.notes     ?? '',
      createdAt: today,
    });

    // Opportunity Won — confidence cố định 100%, statusHistory rỗng (không có pipeline)
    const opp = await createOpportunity({
      clientId:      client.id,
      ownerId,
      title:         body.title || `Import — ${company}`,
      value:         Number(value),
      status:        'Won',
      confidence:    STAGE_DEFAULT_CONFIDENCE['Won'], // 100
      date:          body.contractDate || today,
      notes:         body.notes,
      statusHistory: [],
    });

    return NextResponse.json({ client, opportunity: opp }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/clients/existing]', err);
    return NextResponse.json({ error: 'Failed to create existing client' }, { status: 500 });
  }
}
