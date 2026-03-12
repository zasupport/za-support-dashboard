import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const search   = req.nextUrl.searchParams.get('search')   || '';
  const per_page = req.nextUrl.searchParams.get('per_page') || '50';
  const params   = new URLSearchParams({ per_page });
  if (search) params.set('search', search);
  const res = await fetch(`${API_URL}/api/v1/diagnostics/devices?${params}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json([]);
  return NextResponse.json(await res.json(), {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate' },
  });
}
