import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Activity, Opportunity, Client } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type     = searchParams.get('type');
    const outcome  = searchParams.get('outcome');
    const clientId = searchParams.get('clientId');
    const search   = searchParams.get('search')?.toLowerCase();

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

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(activities);
  } catch {
    return NextResponse.json({ error: 'Failed to read activities' }, { status: 500 });
  }
}

// POST /api/activities
// Side effects (atomic):
//   1. Lưu activity mới
//   2. PATCH opportunity.lastContactDate = activity.date
//   3. Nếu promoteOpportunityTo:
//      - PATCH opportunity.status + confidence (default stage mới)
//      - append statusHistory
//      - nếu newStatus === 'Won': PATCH client.isProspect = false
// NOTE: Auto-create Task đã được bỏ — FE xử lý có confirm ở Step 2 (Bước 3.2)

export async function POST(request: Request) {
  try {
    await requireRole(['salesperson']);
    const body = await request.json();

    const newActivity: Activity = {
      ...body,
      id:        `act-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const [activities, opportunities, clients] = await Promise.all([
      readJSON<Activity[]>('activities.json'),
      readJSON<Opportunity[]>('opportunities.json'),
      readJSON<Client[]>('clients.json'),
    ]);

    // 1. Lưu activity
    activities.push(newActivity);

    // 2 & 3. Side effects trên opportunity
    if (newActivity.opportunityId) {
      const oppIndex = opportunities.findIndex(o => o.id === newActivity.opportunityId);

      if (oppIndex !== -1) {
        const opp = opportunities[oppIndex];

        // 2. Cập nhật lastContactDate
        opp.lastContactDate = newActivity.date;

        // 3. Promote nếu có
        if (newActivity.promoteOpportunityTo) {
          const newStatus = newActivity.promoteOpportunityTo;
          const oldStatus = opp.status;

          opp.statusHistory = opp.statusHistory ?? [];
          opp.statusHistory.push({
            from:       oldStatus,
            to:         newStatus,
            date:       newActivity.date,
            activityId: newActivity.id,
          });

          opp.status     = newStatus;
          opp.confidence = STAGE_DEFAULT_CONFIDENCE[newStatus];

          // Nếu promote lên Won → activate client
          if (newStatus === 'Won') {
            const clientIndex = clients.findIndex(c => c.id === opp.clientId);
            if (clientIndex !== -1) {
              clients[clientIndex].isProspect = false;
            }
          }
        }

        opportunities[oppIndex] = opp;
      }
    }

    await Promise.all([
      writeJSON('activities.json', activities),
      writeJSON('opportunities.json', opportunities),
      writeJSON('clients.json', clients),
    ]);

    return NextResponse.json(newActivity, { status: 201 });
  } catch (err) {
    console.error('[POST /api/activities]', err);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
