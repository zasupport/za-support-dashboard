import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/v1/clients/intake`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || '';
  const page   = req.nextUrl.searchParams.get('page')   || '1';
  const search = req.nextUrl.searchParams.get('search') || '';
  const per_page = req.nextUrl.searchParams.get('per_page') || '50';
  const params = new URLSearchParams({ page, per_page });
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  try {
    const res = await fetch(
      `${API_URL}/api/v1/clients?${params}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json({ data: [], meta: {} });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: {} });
  }
}
