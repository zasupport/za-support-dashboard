import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || '';
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  const page = req.nextUrl.searchParams.get('page') || '1';
  const params = new URLSearchParams({ page, per_page: '50' });
  if (status) params.set('status', status);
  if (client_id) params.set('client_id', client_id);
  try {
    const res = await fetch(
      `${API_URL}/api/v1/workshop/jobs?${params}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json({ data: [], meta: {} });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}
