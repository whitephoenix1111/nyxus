import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Opportunity } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const opps = await readJSON<Opportunity[]>('opportunities.json');
    const result = statusFilter
      ? opps.filter((o) => o.status === statusFilter)
      : opps;
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const opps = await readJSON<Opportunity[]>('opportunities.json');
    const newOpp: Opportunity = {
      ...body,
      id: `opp-${crypto.randomUUID().slice(0, 8)}`,
    };
    opps.push(newOpp);
    await writeJSON('opportunities.json', opps);
    return NextResponse.json(newOpp, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
