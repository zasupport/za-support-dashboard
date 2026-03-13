import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id') || '';
  if (!clientId) return NextResponse.json({ recommendations: [] });

  try {
    const res = await fetch(
      `${API_URL}/api/v1/sales/recommendations/${encodeURIComponent(clientId)}`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ recommendations: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ recommendations: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { rec_id, status } = body;
  if (!rec_id || !status) return NextResponse.json({ error: 'rec_id and status required' }, { status: 400 });

  try {
    const res = await fetch(
      `${API_URL}/api/v1/sales/recommendations/${encodeURIComponent(rec_id)}/status`,
      {
        method: 'PATCH',
        headers: { 'X-API-Key': API_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      },
    );
    if (!res.ok) return NextResponse.json({ error: 'update failed' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
