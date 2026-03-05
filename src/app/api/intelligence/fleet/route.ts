import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const client_id = req.nextUrl.searchParams.get('client_id') || '';
  const period_days = req.nextUrl.searchParams.get('period_days') || '7';
  const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
  const API_TOKEN = process.env.ZA_API_TOKEN || '';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/app-intelligence/clients/${encodeURIComponent(client_id)}/fleet-health?period_days=${period_days}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json([]);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
