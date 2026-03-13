import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/cybershield/reports/${client_id}/generate${qs}`,
      { headers: { 'X-API-Key': API_TOKEN } }
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({ detail: 'Failed' }));
      return NextResponse.json(json, { status: res.status });
    }
    const pdf = await res.arrayBuffer();
    const cd = res.headers.get('Content-Disposition') || `inline; filename="CyberShield_${client_id}.pdf"`;
    return new NextResponse(pdf, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': cd },
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}
