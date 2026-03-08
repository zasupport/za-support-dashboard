import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL  || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days        = searchParams.get('days')        || '1';
  const limit       = searchParams.get('limit')       || '100';
  const action_type = searchParams.get('action_type') || '';

  const qs = new URLSearchParams({ days, limit });
  if (action_type) qs.set('action_type', action_type);

  try {
    const res = await fetch(
      `${API_URL}/api/v1/reports/interventions/fleet/recent?${qs.toString()}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return NextResponse.json({ interventions: [], count: 0, total_value_protected: 0 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ interventions: [], count: 0, total_value_protected: 0 });
  }
}
