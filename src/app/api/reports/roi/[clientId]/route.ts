import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const res = await fetch(`${process.env.ZA_API_URL}/api/v1/reports/roi/${clientId}/summary`, {
    headers: { 'X-API-Key': (process.env.ZA_API_TOKEN || '') },
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const res = await fetch(`${process.env.ZA_API_URL}/api/v1/reports/roi/${clientId}/calculate`, {
    method: 'POST',
    headers: { 'X-API-Key': (process.env.ZA_API_TOKEN || '') },
  });
  if (!res.ok) return NextResponse.json({ error: 'Failed' }, { status: res.status });
  return NextResponse.json(await res.json());
}
