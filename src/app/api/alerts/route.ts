import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get('limit') ?? '20';
  try {
    const res = await fetch(`${API_URL}/api/v1/alerts?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
