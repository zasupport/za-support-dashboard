import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const params = new URLSearchParams();
  const status = req.nextUrl.searchParams.get('status');
  const client_id = req.nextUrl.searchParams.get('client_id');
  const device_id = req.nextUrl.searchParams.get('device_id');
  const page = req.nextUrl.searchParams.get('page') || '1';
  const per_page = req.nextUrl.searchParams.get('per_page') || '20';

  params.set('page', page);
  params.set('per_page', per_page);
  if (status) params.set('status', status);
  if (client_id) params.set('client_id', client_id);
  if (device_id) params.set('device_id', device_id);

  try {
    const res = await fetch(`${API_URL}/api/v1/agent/commands?${params}`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [], meta: { total: 0, page: 1, per_page: 20 } }, { status: res.status });
    // Backend returns { commands: [...], count: N } — normalize to { data, meta }.
    const body = await res.json();
    const data = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.commands)
        ? body.commands
        : [];
    const total = typeof body?.count === 'number' ? body.count : data.length;
    return NextResponse.json({
      data,
      meta: { total, page: Number(page), per_page: Number(per_page) },
    });
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0, page: 1, per_page: 20 } }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/v1/agent/commands`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to queue command' }, { status: 503 });
  }
}
