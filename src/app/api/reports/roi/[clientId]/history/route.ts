import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const res = await fetch(
    `${process.env.ZA_API_URL}/api/v1/reports/roi/${clientId}/history`,
    {
      headers: { Authorization: `Bearer ${process.env.ZA_API_TOKEN}` },
      cache: 'no-store',
    },
  );
  if (!res.ok) return NextResponse.json({ periods: [] }, { status: res.status });
  return NextResponse.json(await res.json());
}
