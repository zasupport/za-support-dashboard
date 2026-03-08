import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// POST /api/reports/demo  body: { client_id, days_valid? }
// Generates a demo PDF + share link for clients with no Scout data
export async function POST(req: NextRequest) {
  const { client_id, days_valid = 30 } = await req.json();
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

  const url = `${API_URL}/api/v1/reports/demo/${encodeURIComponent(client_id)}?share=true&days_valid=${days_valid}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') || 'inline; filename="report.pdf"';
    const shareUrl = res.headers.get('X-Share-URL') || '';
    const expiresAt = res.headers.get('X-Expires-At') || '';
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': cd,
        'X-Share-URL': shareUrl,
        'X-Expires-At': expiresAt,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
