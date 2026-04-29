import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const IMPORTER_TOKEN = process.env.ZA_IMPORTER_TOKEN || '';

type ImportRow = {
  client_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  service_type: string;
  billable: boolean;
  created_at: string;
  notes: string;
  external_ref: string;
  // Pieterse paper job-card extension (migration_157, 29/04/2026) — all optional
  time_in?: string;            // HH:MM
  time_out?: string;           // HH:MM
  total_hours?: number;
  engineer?: string;
  engineer_initials?: string;
  requested_by?: string;
  location?: string;           // Room / Area
  work_performed?: string;
  parts_used?: string;
  client_signoff?: boolean;
  signoff_date?: string;       // ISO date
};

type RowResult = {
  external_ref: string;
  ok: boolean;
  upstream_status: number;
  upstream_id?: string;
  error?: string;
};

export async function POST(req: NextRequest) {
  if (!IMPORTER_TOKEN) {
    return NextResponse.json(
      { error: 'ZA_IMPORTER_TOKEN not configured' },
      { status: 503 },
    );
  }
  if (req.headers.get('x-importer-token') !== IMPORTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  let body: { rows?: ImportRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rows = body.rows ?? [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'rows[] required' }, { status: 400 });
  }
  if (rows.length > 200) {
    return NextResponse.json({ error: 'max 200 rows per call' }, { status: 413 });
  }

  const results: RowResult[] = [];
  for (const row of rows) {
    try {
      const res = await fetch(`${API_URL}/api/v1/workshop/jobs`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_TOKEN,
          'Content-Type': 'application/json',
          'X-External-Ref': row.external_ref,
        },
        body: JSON.stringify(row),
      });
      const data = await res.json().catch(() => ({}));
      results.push({
        external_ref: row.external_ref,
        ok: res.ok,
        upstream_status: res.status,
        upstream_id: data?.id,
        error: res.ok ? undefined : (data?.error ?? data?.detail ?? 'upstream error'),
      });
    } catch (e) {
      results.push({
        external_ref: row.external_ref,
        ok: false,
        upstream_status: 0,
        error: e instanceof Error ? e.message : 'fetch failed',
      });
    }
  }

  const okCount = results.filter(r => r.ok).length;
  const status = okCount === rows.length ? 200 : okCount === 0 ? 502 : 207;
  return NextResponse.json(
    { imported: okCount, total: rows.length, results },
    { status },
  );
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'import-pieterse',
    method: 'POST',
    auth: 'X-Importer-Token header (env: ZA_IMPORTER_TOKEN)',
    body: '{ "rows": ImportRow[] }',
    upstream: `${API_URL}/api/v1/workshop/jobs`,
  });
}
