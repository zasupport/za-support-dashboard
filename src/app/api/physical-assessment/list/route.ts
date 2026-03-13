import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id') || '';
  const page     = req.nextUrl.searchParams.get('page') || '1';
  const qs = new URLSearchParams({ page, per_page: '20' });
  if (clientId) qs.set('client_id', clientId);
  try {
    const res = await fetch(`${API_URL}/api/v1/physical-assessment/?${qs}`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [], meta: { total: 0 } }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 } });
  }
}
