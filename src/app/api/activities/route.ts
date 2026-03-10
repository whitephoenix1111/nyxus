import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Activity } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type      = searchParams.get('type');
    const outcome   = searchParams.get('outcome');
    const clientId  = searchParams.get('clientId');
    const search    = searchParams.get('search')?.toLowerCase();

    let activities = await readJSON<Activity[]>('activities.json');

    if (type)     activities = activities.filter(a => a.type === type);
    if (outcome)  activities = activities.filter(a => a.outcome === outcome);
    if (clientId) activities = activities.filter(a => a.clientId === clientId);
    if (search)   activities = activities.filter(a =>
      a.title.toLowerCase().includes(search) ||
      a.clientName.toLowerCase().includes(search) ||
      a.company.toLowerCase().includes(search) ||
      a.notes.toLowerCase().includes(search)
    );

    // Sort mới nhất trước
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(activities);
  } catch {
    return NextResponse.json({ error: 'Failed to read activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const activities = await readJSON<Activity[]>('activities.json');

    const newActivity: Activity = {
      ...body,
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    activities.push(newActivity);
    await writeJSON('activities.json', activities);

    return NextResponse.json(newActivity, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
