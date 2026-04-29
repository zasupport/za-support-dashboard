import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/job-cards/export?client=<client_id>[&format=json|xlsx]
 *
 * Reverse-sync of /api/workshop/import-pieterse — the dashboard is canonical
 * (per §321 quick-tool-with-infra-reconcile + the 29.4.26 schema-diff decision)
 * and this endpoint exports the dashboard's workshop_jobs rows back into a
 * shape the on-site Excel register can absorb.
 *
 * Auth: X-Importer-Token header (same token as the import endpoint, set on
 * Render + Vercel as ZA_IMPORTER_TOKEN — see §289 manual-pieterse-importer-token-remote-env).
 *
 * Format default: JSON. XLSX TODO — emit via openpyxl bridge or sheetjs once
 * Brett confirms the round-trip flow with two real rows.
 *
 * Created: 29/04/2026 — pairs with src/app/api/workshop/import-pieterse/route.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.ZA_API_URL ?? 'https://api.zasupport.com';
const ZA_API_TOKEN = process.env.ZA_API_TOKEN ?? '';
const IMPORTER_TOKEN = process.env.ZA_IMPORTER_TOKEN ?? '';

// Excel-aligned field set — matches the on-site register's 17 columns plus
// the 11 dashboard extension columns from migration_157.
const EXPORT_FIELDS = [
  'job_ref',
  'created_at',
  'time_in',
  'time_out',
  'total_hours',
  'engineer',
  'engineer_initials',
  'requested_by',
  'location',
  'title',
  'description',
  'work_performed',
  'parts_used',
  'notes',
  'client_signoff',
  'signoff_date',
  'status',
] as const;

type ExportRow = Partial<Record<typeof EXPORT_FIELDS[number], unknown>>;

export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const client = url.searchParams.get('client');
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();
  const provided = req.headers.get('x-importer-token') ?? '';

  if (!IMPORTER_TOKEN) {
    return NextResponse.json(
      { error: 'ZA_IMPORTER_TOKEN not configured on dashboard' },
      { status: 500 },
    );
  }
  if (provided !== IMPORTER_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!client) {
    return NextResponse.json(
      { error: 'missing required query param: client=<client_id>' },
      { status: 400 },
    );
  }
  if (format !== 'json' && format !== 'xlsx') {
    return NextResponse.json(
      { error: `format must be json or xlsx (got: ${format})` },
      { status: 400 },
    );
  }
  if (format === 'xlsx') {
    return NextResponse.json(
      { error: 'xlsx format not yet wired — request format=json for now' },
      { status: 501 },
    );
  }

  const upstream = `${BACKEND_URL}/api/v1/workshop/jobs?client_id=${encodeURIComponent(client)}`;
  let res: Response;
  try {
    res = await fetch(upstream, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ZA_API_TOKEN}`,
        'Accept':        'application/json',
      },
      signal: AbortSignal.timeout(15_000),
      cache:  'no-store',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'upstream fetch failed', detail: String(err) },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return NextResponse.json(
      { error: 'upstream non-2xx', status: res.status, detail: body.slice(0, 500) },
      { status: 502 },
    );
  }

  const upstreamJson = await res.json().catch(() => null);
  const jobs: ExportRow[] = Array.isArray(upstreamJson)
    ? upstreamJson
    : Array.isArray((upstreamJson as { jobs?: unknown })?.jobs)
      ? ((upstreamJson as { jobs: ExportRow[] }).jobs)
      : [];

  // Project to the Excel-aligned field set so consumers can pivot directly into the register.
  const rows = jobs.map((j) =>
    Object.fromEntries(EXPORT_FIELDS.map((f) => [f, j[f] ?? null])),
  );

  return NextResponse.json(
    {
      client,
      count: rows.length,
      generated_at: new Date().toISOString(),
      fields: EXPORT_FIELDS,
      rows,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
