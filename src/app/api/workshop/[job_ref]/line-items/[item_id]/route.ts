import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function DELETE(_req: NextRequest, { params }: { params: { job_ref: string; item_id: string } }) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/workshop/jobs/${params.job_ref}/line-items/${params.item_id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    return new NextResponse(null, { status: res.status });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
