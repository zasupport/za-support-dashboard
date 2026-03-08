import { NextResponse } from 'next/server';
const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/sales/pipeline/summary`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ pending_count: 0, pending_value_rand: 0, won_count: 0, won_revenue_rand: 0, by_category: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ pending_count: 0, pending_value_rand: 0, won_count: 0, won_revenue_rand: 0, by_category: [] });
  }
}
