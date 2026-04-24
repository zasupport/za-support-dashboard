/* eslint-disable @typescript-eslint/no-explicit-any */
export const revalidate = 300; // ISR: dedup data changes infrequently

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const h = { 'X-API-Key': API_TOKEN };

type FleetSummary = {
  total_clients_scanned: number;
  total_recoverable_gb: number;
  upsell_candidates: number;
  clients: Array<{
    client_id: string;
    duplicate_gb_recoverable: number;
    duplicate_sets: number;
    last_scan: string | null;
    upsell_trigger: boolean;
    client_facing_summary?: string;
  }>;
};

async function fetchFleetSummary(): Promise<FleetSummary | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/deduplication/fleet/summary`, {
      headers: h,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as FleetSummary;
  } catch {
    return null;
  }
}

export default async function DedupPage() {
  const fleet = await fetchFleetSummary();
  const clients = fleet?.clients ?? [];
  const totalRecoverable = fleet?.total_recoverable_gb ?? 0;
  const scannedCount = fleet?.total_clients_scanned ?? 0;
  const upsells = fleet?.upsell_candidates ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Deduplication</h1>
        <p className="text-slate-400 text-sm">
          Duplicate file tracking · recoverable storage · photo cleanup
        </p>
      </div>

      {/* Fleet totals — real aggregate from backend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-teal-400 mb-1">
            {totalRecoverable.toFixed(1)} GB
          </div>
          <div className="text-slate-400 text-xs">
            Total recoverable across fleet
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">
            {scannedCount}
          </div>
          <div className="text-slate-400 text-xs">Clients scanned</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {upsells}
          </div>
          <div className="text-slate-400 text-xs">
            Upsell candidates (&gt;1 GB)
          </div>
        </div>
      </div>

      {/* Per-client breakdown — from fleet response, no hardcoded list */}
      <div className="space-y-3">
        {clients.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <p className="text-slate-400 text-sm">No dedup scans on record yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Run a scan on a client device to populate fleet data.
            </p>
          </div>
        ) : (
          clients
            .sort(
              (a, b) =>
                (b.duplicate_gb_recoverable || 0) -
                (a.duplicate_gb_recoverable || 0),
            )
            .map((c) => (
              <div key={c.client_id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-medium">{c.client_id}</div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {c.duplicate_sets} duplicate sets
                      {c.last_scan &&
                        ` · last scan ${new Date(c.last_scan).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${
                        c.duplicate_gb_recoverable >= 1
                          ? 'text-yellow-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {c.duplicate_gb_recoverable.toFixed(1)} GB
                    </div>
                    <div className="text-slate-500 text-xs">recoverable</div>
                  </div>
                </div>
                {c.client_facing_summary && (
                  <p className="text-slate-400 text-xs">{c.client_facing_summary}</p>
                )}
                {c.upsell_trigger && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30">
                    Upsell candidate
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">How scans ingest</h3>
        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
          <li>Client-side scan tool produces scan artefact</li>
          <li>POST results to <code className="text-teal-400">POST /api/v1/deduplication/ingest</code></li>
          <li>Review items — set action to keep/delete — <strong>NEVER auto-delete</strong></li>
        </ol>
      </div>
    </div>
  );
}
