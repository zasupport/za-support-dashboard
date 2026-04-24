import { NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/ai-profiling/clusters`, {
      headers: { 'X-API-Key': API_TOKEN },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ data: [] }, { status: res.status });
    const body = await res.json();
    const raw: any[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    // Backend returns { cluster_label, avg_risk, avg_backup_pct, avg_roi, client_count }.
    // Dashboard expects { segment, avg_risk_score, avg_device_age, top_os, backup_compliance_pct, clients }.
    const LABEL_TO_SEGMENT: Record<string, string> = {
      'new / sparse data': 'new_sparse',
      'healthy — low risk': 'low',
      'healthy - low risk': 'low',
      'moderate risk': 'moderate',
      'high risk — needs attention': 'high',
      'high risk - needs attention': 'high',
      'medical practice': 'medical_practice',
    };
    const data = raw.map((c: any) => {
      const label: string = (c.cluster_label || c.segment || '').toString();
      const segKey = LABEL_TO_SEGMENT[label.toLowerCase()]
        || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') : 'unknown');
      return {
        cluster_id: c.cluster_id,
        segment: segKey,
        segment_label: label,
        client_count: c.client_count ?? 0,
        avg_risk_score: c.avg_risk_score ?? c.avg_risk ?? null,
        avg_device_age: c.avg_device_age ?? null,
        top_os: c.top_os ?? null,
        backup_compliance_pct: c.backup_compliance_pct ?? c.avg_backup_pct ?? null,
        avg_roi: c.avg_roi ?? null,
        clients: Array.isArray(c.clients) ? c.clients : [],
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
