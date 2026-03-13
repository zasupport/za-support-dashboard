import { NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function POST() {
  try {
    const res = await fetch(`${API_URL}/api/v1/ai-profiling/run`, {
      method: 'POST',
      headers: { 'X-API-Key': API_TOKEN },
    });
    if (!res.ok) return NextResponse.json({ error: 'Run failed' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Run failed' }, { status: 500 });
  }
}
