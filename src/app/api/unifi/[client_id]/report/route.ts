import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params;
  const url = `${API_URL}/api/v1/unifi/${encodeURIComponent(client_id)}/report`;
  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    const contentType = res.headers.get('content-type') ?? 'application/pdf';
    const disposition = res.headers.get('content-disposition') ?? `attachment; filename="Network_Report_${client_id}.pdf"`;
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Report generation failed' }, { status: 503 });
  }
}
