import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    params.set('page', searchParams.get('page') || '1');
    params.set('per_page', '50');
    const journey_type = searchParams.get('journey_type');
    const status = searchParams.get('status');
    if (journey_type) params.set('journey_type', journey_type);
    if (status) params.set('status', status);

    const res = await fetch(`${API_URL}/api/v1/onboarding/sessions?${params}`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({ data: [], meta: { total: 0 } }));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 } }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/v1/onboarding/sessions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 });
  }
}
