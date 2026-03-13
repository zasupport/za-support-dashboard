import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// POST /api/workshop/[job_ref]/analyse — proxy to backend Claude analysis
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ job_ref: string }> }
) {
  const { job_ref } = await params;
  try {
    const res = await fetch(
      `${API_URL}/api/v1/workshop/jobs/${encodeURIComponent(job_ref)}/analyse`,
      {
        method: 'POST',
        headers: { 'X-API-Key': API_TOKEN },
        // Claude analysis may take up to 30s — no body needed
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ detail: 'Network error' }, { status: 500 });
  }
}
