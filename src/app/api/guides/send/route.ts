import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function POST(req: NextRequest) {
  const { guide_id, client_id } = await req.json();
  if (!guide_id || !client_id) {
    return NextResponse.json({ error: 'guide_id and client_id required' }, { status: 400 });
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/guides/${guide_id}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id }),
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json(json, { status: res.status });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
