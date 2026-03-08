import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const per_page  = req.nextUrl.searchParams.get('per_page')  || '100';
  const client_id = req.nextUrl.searchParams.get('client_id') || '';

  let url = `${API_URL}/api/v1/sales/repair-sequences/?per_page=${per_page}`;
  if (client_id) url += `&client_id=${encodeURIComponent(client_id)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [], meta: {} }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: {} });
  }
}
