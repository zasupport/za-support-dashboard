import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || '';
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  const params = new URLSearchParams({ limit: '50', offset: '0' });
  if (status) params.set('status', status);
  if (client_id) params.set('client_id', client_id);
  try {
    const res = await fetch(
      `${API_URL}/api/v1/forensics/investigations?${params}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json([]);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
