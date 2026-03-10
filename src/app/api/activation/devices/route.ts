import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// GET /api/activation/devices — list all device tokens
export async function GET(req: NextRequest) {
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  const url = client_id
    ? `${API_URL}/api/v1/agent/device-tokens?client_id=${encodeURIComponent(client_id)}`
    : `${API_URL}/api/v1/agent/device-tokens`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [] });
  }
}
