import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ job_ref: string; item_id: string }> }
) {
  const { job_ref, item_id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs/${job_ref}/line-items/${item_id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    return new NextResponse(null, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 503 });
  }
}
