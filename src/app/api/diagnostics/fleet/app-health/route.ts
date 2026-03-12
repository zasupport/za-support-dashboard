import { NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/diagnostics/fleet/app-health`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({}, { status: res.status });
    return NextResponse.json(await res.json(), {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate' },
    });
  } catch {
    return NextResponse.json({});
  }
}
