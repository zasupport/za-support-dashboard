import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const days = req.nextUrl.searchParams.get('days') || '7';
  const limit = req.nextUrl.searchParams.get('limit') || '20';

  try {
    const res = await fetch(
      `${API_URL}/api/v1/clients/portal-views/recent?days=${days}&limit=${limit}`,
      {
        headers: { 'X-API-Key': API_TOKEN },
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ views: [], count: 0, error: text }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ views: [], count: 0 }, { status: 200 });
  }
}
