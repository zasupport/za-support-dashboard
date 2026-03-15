import { NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/onboarding/journeys`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ data: [] }, { status: 503 });
  }
}
