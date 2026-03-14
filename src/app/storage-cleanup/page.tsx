import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';
import Link from 'next/link';

export const revalidate = 120;

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const h = { 'X-API-Key': API_TOKEN };

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved:  'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-slate-600/40 text-slate-400 border-slate-600',
  none:      'bg-slate-700/40 text-slate-500 border-slate-700',
};

interface FleetRow {
  client_id: string;
  client_name: string;
  pending_requests: number;
  total_gb: number;
  status: string;
}

async function fetchFleetSummary(): Promise<FleetRow[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/storage-cleanup/fleet-summary`, {
      headers: h,
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? json ?? [];
  } catch {
    return [];
  }
}

export default async function StorageCleanupPage() {
  const rows = await fetchFleetSummary();

  const totalGb          = rows.reduce((s, r) => s + (r.total_gb ?? 0), 0);
  const pendingCount     = rows.filter(r => r.pending_requests > 0).length;
  const approvedCount    = rows.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={120000} />

      <div>
        <h1 className="text-2xl font-bold text-white">Storage Cleanup</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Categorised cleanup requests · client approval tracking · recoverable storage fleet view
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-teal-400 mb-1">{totalGb.toFixed(1)} GB</div>
          <div className="text-slate-400 text-xs">Total recoverable (all clients)</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400 mb-1">{pendingCount}</div>
          <div className="text-slate-400 text-xs">Clients with pending requests</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400 mb-1">{approvedCount}</div>
          <div className="text-slate-400 text-xs">Approved — ready to action</div>
        </div>
      </div>

      {/* Fleet table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">
            {rows.length} client{rows.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-slate-400 text-sm px-6 py-6">
              No storage cleanup data yet. Run a Scout diagnostic to populate this view.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Pending requests</th>
                  <th className="text-left px-4 py-3 font-medium">Total GB</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const status    = row.status?.toLowerCase() ?? 'none';
                  const badgeCls  = STATUS_STYLE[status] ?? STATUS_STYLE.none;

                  return (
                    <tr
                      key={row.client_id}
                      className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/clients/${row.client_id}`}
                          className="text-slate-200 font-medium hover:text-teal-400 transition-colors"
                        >
                          {row.client_name || row.client_id}
                        </Link>
                        <p className="text-slate-500 font-mono mt-0.5">{row.client_id}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`font-semibold ${row.pending_requests > 0 ? 'text-yellow-300' : 'text-slate-500'}`}>
                          {row.pending_requests ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`font-semibold ${(row.total_gb ?? 0) >= 1 ? 'text-teal-400' : 'text-slate-400'}`}>
                          {(row.total_gb ?? 0).toFixed(1)} GB
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${badgeCls}`}>
                          {(row.status ?? 'none').toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/storage-cleanup/${row.client_id}`}
                          className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
