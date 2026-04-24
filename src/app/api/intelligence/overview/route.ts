import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET(req: NextRequest) {
  const days = req.nextUrl.searchParams.get('period_days') || '7';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/app-intelligence/overview?period_days=${days}`,
      { headers: { 'X-API-Key': API_TOKEN }, cache: 'no-store' },
    );
    if (!res.ok) {
      return NextResponse.json(
        { period_days: Number(days), totals: {}, top_apps: [], recent_devices: [] },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({
      period_days: Number(days),
      totals: {},
      top_apps: [],
      recent_devices: [],
    });
  }
}
