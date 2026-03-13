import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.ZA_API_URL || 'https://api.zasupport.com'
const AGENT_TOKEN = process.env.ZA_API_TOKEN || ''

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params
  try {
    const res = await fetch(`${API_BASE}/api/v1/clients/${client_id}/sla`, {
      headers: { 'X-API-Key': AGENT_TOKEN },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch SLA status' }, { status: 500 })
  }
}
