import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.ZA_API_URL || 'https://api.zasupport.com'
const AGENT_TOKEN = process.env.ZA_API_TOKEN || ''

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params
  try {
    const res = await fetch(`${API_BASE}/api/v1/agent/config?client_id=${client_id}`, {
      headers: { 'X-API-Key': AGENT_TOKEN },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch SLA config', sla_active: false, mode: 'diagnostic' },
      { status: 200 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params
  const body = await req.json()
  const { action, tier_code } = body

  const endpoint =
    action === 'activate' ? '/api/v1/agent/sla/activate' : '/api/v1/agent/sla/deactivate'

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': AGENT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id, tier_code }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, error: 'SLA update failed' }, { status: 500 })
  }
}
