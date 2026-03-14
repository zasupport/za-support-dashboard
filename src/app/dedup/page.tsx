export const revalidate = 300; // ISR: dedup data changes infrequently

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const h = { 'X-API-Key': API_TOKEN };

// Known client IDs — scans per client
const CLIENT_IDS = ['gillian-pearson', 'evan-shoul', 'charles-chemel', 'anton-meyberg'];

async function fetchSummary(clientId: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/deduplication/${clientId}/latest`, { headers: h, cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export default async function DedupPage() {
  const summaries = await Promise.all(CLIENT_IDS.map(id => fetchSummary(id)));
  const valid = summaries.filter(Boolean);

  const totalRecoverable = valid.reduce((s: number, d: any) => s + (d?.recoverable_gb || 0), 0);
  const totalPhotoGb = valid.reduce((s: number, d: any) => s + (d?.photo_gb || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Deduplication</h1>
        <p className="text-slate-400 text-sm">Duplicate file tracking · recoverable storage · photo cleanup</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-teal-400 mb-1">{totalRecoverable.toFixed(1)} GB</div>
          <div className="text-slate-400 text-xs">Total Recoverable (all clients)</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">{totalPhotoGb.toFixed(1)} GB</div>
          <div className="text-slate-400 text-xs">Duplicate Photos</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">{valid.filter((d: any) => d?.recoverable_gb > 1).length}</div>
          <div className="text-slate-400 text-xs">Clients with {'>'}1 GB to recover</div>
        </div>
      </div>

      {/* Per-client cards */}
      <div className="space-y-3">
        {CLIENT_IDS.map((clientId, i) => {
          const d = summaries[i];
          if (!d) return (
            <div key={clientId} className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
              <span className="text-slate-400 text-sm">{clientId}</span>
              <span className="text-slate-600 text-xs">No scan data</span>
            </div>
          );

          return (
            <div key={clientId} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-white font-medium">{clientId}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{d.duplicate_sets} duplicate sets</div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${d.recoverable_gb >= 1 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {d.recoverable_gb.toFixed(1)} GB
                  </div>
                  <div className="text-slate-500 text-xs">recoverable</div>
                </div>
              </div>
              <p className="text-slate-400 text-xs">{d.client_facing_summary}</p>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="text-slate-400 text-xs font-medium mb-2">HOW TO RUN A SCAN</div>
        <ol className="text-slate-500 text-xs space-y-1 list-decimal list-inside">
          <li>Install <code className="text-teal-400">rmlint</code> or <code className="text-teal-400">jdupes</code> on client machine</li>
          <li>Run: <code className="text-teal-400">rmlint ~/Pictures ~/Documents --output=json:scan.json</code></li>
          <li>POST results to <code className="text-teal-400">POST /api/v1/dedup/scans/</code></li>
          <li>Review items — set action to keep/delete — <strong>NEVER auto-delete</strong></li>
        </ol>
      </div>
    </div>
  );
}
