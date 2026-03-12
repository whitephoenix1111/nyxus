import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import { getSession, requireRole } from '@/lib/session';
import type { Client, Opportunity } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

// POST /api/leads
// Body: { name, company, email?, phone?, avatar?, value, notes? }
// Returns: { client: Client, opportunity: Opportunity }
// Side effects: tạo đồng thời Client (isProspect: true) + Opportunity (Lead, confidence: 15%)

export async function POST(request: Request) {
  try {
    const session = await requireRole(['salesperson']);
    const body = await request.json();
    const { name, company, email = '', phone = '', avatar, value, notes = '' } = body;

    if (!name || !company || !value) {
      return NextResponse.json(
        { error: 'name, company, value là bắt buộc' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const clientId = `cli-${crypto.randomUUID().slice(0, 8)}`;
    const oppId    = `opp-${crypto.randomUUID().slice(0, 8)}`;

    // Tạo initials avatar nếu không có
    const generatedAvatar = avatar || name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('');

    // 1. Tạo Client với isProspect: true
    const newClient: Client = {
      id:        clientId,
      ownerId:   session.id,   // ← gán owner = người tạo
      name,
      company,
      avatar:    generatedAvatar,
      email,
      phone,
      industry:  'Unknown',
      country:   '',
      website:   '',
      tags:      ['new-lead'],
      notes,
      isProspect: true,
      createdAt: today,
    };

    // 2. Tạo Opportunity: Lead, confidence = 15% (cố định, không nhập)
    const newOpportunity: Opportunity = {
      id:              oppId,
      ownerId:         session.id,   // ← gán owner = người tạo
      clientId,
      clientName:      name,
      company,
      avatar:          generatedAvatar,
      value:           Number(value),
      status:          'Lead',
      date:            today,
      lastContactDate: today,
      confidence:      STAGE_DEFAULT_CONFIDENCE['Lead'], // 15
      notes,
      statusHistory:   [],
    };

    // 3. Ghi vào JSON files
    const [clients, opportunities] = await Promise.all([
      readJSON<Client[]>('clients.json'),
      readJSON<Opportunity[]>('opportunities.json'),
    ]);

    clients.push(newClient);
    opportunities.push(newOpportunity);

    await Promise.all([
      writeJSON('clients.json', clients),
      writeJSON('opportunities.json', opportunities),
    ]);

    return NextResponse.json({ client: newClient, opportunity: newOpportunity }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/leads]', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
