import { NextRequest, NextResponse } from 'next/server';

const API_URL   = process.env.ZA_API_URL   || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ job_ref: string }> }
) {
  const { job_ref } = await params;
  const send = req.nextUrl.searchParams.get('send') === 'true';

  try {
    const res = await fetch(
      `${API_URL}/api/v1/workshop/jobs/${job_ref}/invoice${send ? '?send=true' : ''}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );

    if (!res.ok) return NextResponse.json({ error: 'Invoice failed' }, { status: res.status });

    const pdfBytes = await res.arrayBuffer();
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ZA_Support_Invoice_${job_ref}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invoice unavailable' }, { status: 503 });
  }
}
