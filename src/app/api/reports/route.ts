import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// GET /api/reports?client_id=xxx  → report history
export async function GET(req: NextRequest) {
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  if (!client_id) return NextResponse.json([]);
  try {
    const res = await fetch(
      `${API_URL}/api/v1/reports/history/${encodeURIComponent(client_id)}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json([]);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/reports  body: { client_id, snapshot_id? }  → streams PDF
export async function POST(req: NextRequest) {
  const { client_id, snapshot_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

  const params = new URLSearchParams();
  if (snapshot_id) params.set('snapshot_id', String(snapshot_id));

  const url = `${API_URL}/api/v1/reports/cyberpulse/${encodeURIComponent(client_id)}${params.size ? `?${params}` : ''}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') || 'inline; filename="report.pdf"';
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': cd,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
