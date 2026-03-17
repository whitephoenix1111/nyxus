// src/app/api/opportunities/route.ts
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getOpportunities, createOpportunity, getClientById } from '@/lib/queries';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';
import type { OpportunityStatus } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const opps = await getOpportunities(searchParams.get('status') ?? undefined);
    return NextResponse.json(opps);
  } catch {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(['salesperson', 'manager']);
    const body = await request.json();

    if (!body.clientId || !body.title || !body.value) {
      return NextResponse.json({ error: 'clientId, title, value là bắt buộc' }, { status: 400 });
    }

    const client = await getClientById(body.clientId);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const status: OpportunityStatus = body.status ?? 'Lead';
    const opp = await createOpportunity({
      clientId:      body.clientId,
      ownerId:       client.ownerId, // copy từ client, không nhận từ body
      title:         body.title,
      value:         Number(body.value),
      status,
      confidence:    body.confidence ?? STAGE_DEFAULT_CONFIDENCE[status],
      date:          body.date ?? new Date().toISOString().slice(0, 10),
      notes:         body.notes,
      statusHistory: [],
    });

    return NextResponse.json(opp, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
