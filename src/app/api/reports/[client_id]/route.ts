import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  req: NextRequest,
  { params }: { params: { client_id: string } }
) {
  const snapshot_id = req.nextUrl.searchParams.get('snapshot_id') || '';
  const url = `${API_URL}/api/v1/reports/cyberpulse/${params.client_id}${snapshot_id ? `?snapshot_id=${snapshot_id}` : ''}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const pdf = await res.arrayBuffer();
    const disposition = res.headers.get('content-disposition') || 'inline; filename="CyberPulse_Report.pdf"';
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Report generation failed' }, { status: 503 });
  }
}
