import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const days  = req.nextUrl.searchParams.get('days')  || '7';
  const limit = req.nextUrl.searchParams.get('limit') || '20';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/sales/recommendations/recent?days=${days}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ recommendations: [], count: 0, total_pipeline_value: 0 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ recommendations: [], count: 0, total_pipeline_value: 0 });
  }
}
