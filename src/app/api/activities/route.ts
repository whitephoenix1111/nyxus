import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { requireRole } from '@/lib/session';
import type { Activity, Opportunity, Client } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

// GET /api/activities
// Query params: type, outcome, clientId, search
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
    // search chỉ còn trên title và notes — clientName/company đã xóa khỏi schema
    if (search)   activities = activities.filter(a =>
      a.title.toLowerCase().includes(search) ||
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
//   1. Lưu activity mới vào activities.json
//   2. Nếu promoteOpportunityTo:
//      - PATCH opportunity.status + confidence (default stage mới)
//      - append statusHistory
// NOTE: lastContactDate đã xóa khỏi schema — tính động bằng useLastContactDate()
// NOTE: isProspect đã xóa khỏi schema — trạng thái client derive từ useClientStatus()
// NOTE: Auto-create Task xử lý ở FE (Step 2 confirm), không tạo ở đây
export async function POST(request: Request) {
  try {
    // manager cũng được phép tạo activity
    await requireRole(['salesperson', 'manager']);
    const body = await request.json();

    console.log('[POST /api/activities] body received:', JSON.stringify(body));

    const newActivity: Activity = {
      ...body,
      id:        `act-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    console.log('[POST /api/activities] newActivity:', newActivity.id, '| clientId:', newActivity.clientId);

    const [activities, opportunities] = await Promise.all([
      readJSON<Activity[]>('activities.json'),
      readJSON<Opportunity[]>('opportunities.json'),
    ]);

    // 1. Lưu activity
    activities.push(newActivity);

    // 2. Promote opportunity nếu có promoteOpportunityTo
    if (newActivity.opportunityId && newActivity.promoteOpportunityTo) {
      const oppIndex = opportunities.findIndex(o => o.id === newActivity.opportunityId);

      if (oppIndex !== -1) {
        const opp       = opportunities[oppIndex];
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

        console.log('[POST /api/activities] promote opp', opp.id, oldStatus, '→', newStatus);
        opportunities[oppIndex] = opp;
      } else {
        console.warn('[POST /api/activities] opportunityId', newActivity.opportunityId, 'not found — skip promote');
      }
    }

    await Promise.all([
      writeJSON('activities.json', activities),
      writeJSON('opportunities.json', opportunities),
    ]);

    console.log('[POST /api/activities] saved OK, total activities:', activities.length);
    return NextResponse.json(newActivity, { status: 201 });
  } catch (err) {
    console.error('[POST /api/activities] ERROR:', err);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
