// src/app/api/activities/route.ts
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getActivities, createActivity, getOpportunityById, updateOpportunity } from '@/lib/queries';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';
import type { OpportunityStatus } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activities = await getActivities({
      type:      searchParams.get('type') ?? undefined,
      outcome:   searchParams.get('outcome') ?? undefined,
      clientId:  searchParams.get('clientId') ?? undefined,
      search:    searchParams.get('search') ?? undefined,
    });
    return NextResponse.json(activities);
  } catch {
    return NextResponse.json({ error: 'Failed to read activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(['salesperson', 'manager']);
    const body = await request.json();

    const today = new Date().toISOString().slice(0, 10);
    const activity = await createActivity({ ...body, createdAt: today });

    // Side effect: promote opp nếu có promoteOpportunityTo
    if (activity.opportunityId && activity.promoteOpportunityTo) {
      const opp = await getOpportunityById(activity.opportunityId);
      if (opp) {
        const newStatus = activity.promoteOpportunityTo as OpportunityStatus;
        const history   = [...(opp.statusHistory ?? []), {
          from:       opp.status,
          to:         newStatus,
          date:       activity.date,
          activityId: activity.id,
        }];
        await updateOpportunity(activity.opportunityId, {
          status:        newStatus,
          confidence:    STAGE_DEFAULT_CONFIDENCE[newStatus],
          statusHistory: history,
        });
      }
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    console.error('[POST /api/activities]', err);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
