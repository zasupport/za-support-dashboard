import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get('limit') || '15';
  const res = await fetch(`${API_URL}/api/v1/system/activity?limit=${limit}`, {
    headers: { 'X-API-Key': API_TOKEN },
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json({ data: [] }, { status: res.status });
  return NextResponse.json(await res.json());
}
