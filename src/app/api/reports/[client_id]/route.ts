import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params;
  const snapshot_id = req.nextUrl.searchParams.get('snapshot_id') || '';
  const url = `${API_URL}/api/v1/reports/cyberpulse/${client_id}${snapshot_id ? `?snapshot_id=${snapshot_id}` : ''}`;
  try {
    const res = await fetch(url, { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    const pdf = await res.arrayBuffer();
    const disposition = res.headers.get('content-disposition') || 'inline; filename="Health Check_Report.pdf"';
    return new NextResponse(pdf, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': disposition },
    });
  } catch {
    return NextResponse.json({ error: 'Report generation failed' }, { status: 503 });
  }
}
