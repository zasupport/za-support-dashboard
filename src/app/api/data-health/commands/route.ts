import { NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/agent/commands/summary`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ by_client: {}, _error: true });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ by_client: {}, _error: true });
  }
}
