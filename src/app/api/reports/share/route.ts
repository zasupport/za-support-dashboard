import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// POST /api/reports/share  body: { client_id, days_valid? }
// Creates a shareable link for the latest report
export async function POST(req: NextRequest) {
  const { client_id, days_valid = 30 } = await req.json();
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

  const url = `${API_URL}/api/v1/reports/share/${encodeURIComponent(client_id)}?days_valid=${days_valid}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return NextResponse.json({ error: json.detail || 'Failed to create share link' }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET /api/reports/share?client_id=xxx
// List all share links for a client
export async function GET(req: NextRequest) {
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  if (!client_id) return NextResponse.json({ links: [] });

  try {
    const res = await fetch(
      `${API_URL}/api/v1/reports/share/list/${encodeURIComponent(client_id)}`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json({ links: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ links: [] });
  }
}
