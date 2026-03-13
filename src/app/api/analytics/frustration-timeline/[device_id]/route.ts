import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ device_id: string }> }
) {
  const { device_id } = await params;
  const { searchParams } = new URL(req.url);
  const days = searchParams.get('days') || '30';
  const end = new Date().toISOString();
  const start = new Date(Date.now() - Number(days) * 86400000).toISOString();
  try {
    const res = await fetch(
      `${API_URL}/api/v1/interaction-analytics/devices/${encodeURIComponent(device_id)}/frustration-timeline?start=${start}&end=${end}`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json([]);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
