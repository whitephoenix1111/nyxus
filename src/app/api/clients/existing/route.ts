import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';
import type { Client, Opportunity } from '@/types';
import { STAGE_DEFAULT_CONFIDENCE } from '@/types';

// POST /api/clients/existing
// Dành cho khách hàng đã hợp tác trước đây — không qua pipeline Lead
// Body: { name, company, email?, phone?, industry?, country?, website?, notes?, tags?, value, contractDate? }
// Returns: { client: Client, opportunity: Opportunity }
// Side effects: tạo Client (isProspect: false) + Opportunity (Won, confidence: 100%)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      company,
      email = '',
      phone = '',
      industry = 'Unknown',
      country = '',
      website = '',
      notes = '',
      tags = [],
      value,
      contractDate,
    } = body;

    if (!name || !company || !value) {
      return NextResponse.json(
        { error: 'name, company, value là bắt buộc' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const clientId = `cli-${crypto.randomUUID().slice(0, 8)}`;
    const oppId    = `opp-${crypto.randomUUID().slice(0, 8)}`;

    const avatar = name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('');

    // Client đã Won — isProspect: false ngay từ đầu
    const newClient: Client = {
      id:         clientId,
      name,
      company,
      avatar,
      email,
      phone,
      industry,
      country,
      website,
      tags,
      notes,
      isProspect: false,
      createdAt:  today,
    };

    // Opportunity Won — confidence cố định 100%, không qua pipeline
    const newOpportunity: Opportunity = {
      id:              oppId,
      clientId,
      clientName:      name,
      company,
      avatar,
      value:           Number(value),
      status:          'Won',
      date:            contractDate || today,
      lastContactDate: today,
      confidence:      STAGE_DEFAULT_CONFIDENCE['Won'], // 100
      notes,
      statusHistory:   [], // không có lịch sử promote — đây là import
    };

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
    console.error('[POST /api/clients/existing]', err);
    return NextResponse.json({ error: 'Failed to create existing client' }, { status: 500 });
  }
}
