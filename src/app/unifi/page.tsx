import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';
import { Network } from 'lucide-react';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

async function fetchUnifiOverview(): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/unifi/overview`, {
      headers: { 'X-API-Key': API_TOKEN, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data ?? [];
  } catch {
    return [];
  }
}

function WanBadge({ status }: { status?: string }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'online')
    return <span className="text-xs px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/30 font-medium">Online</span>;
  if (s === 'offline')
    return <span className="text-xs px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30 font-medium">Offline</span>;
  return <span className="text-xs px-2 py-0.5 rounded border bg-slate-600/40 text-slate-400 border-slate-600 font-medium">{status ?? 'Unknown'}</span>;
}

export default async function UnifiOverviewPage() {
  const clients = await fetchUnifiOverview();

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60000} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Network size={22} className="text-teal-400 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-white">Network Monitor</h1>
            <p className="text-slate-400 text-sm">UniFi networks across all clients</p>
          </div>
        </div>
        <span className="text-xs text-slate-500">Auto-refreshes every 60s</span>
      </div>

      {/* Summary cards */}
      {clients.length > 0 && (() => {
        const online  = clients.filter((c: any) => (c.wan_status ?? '').toLowerCase() === 'online').length;
        const offline = clients.filter((c: any) => (c.wan_status ?? '').toLowerCase() === 'offline').length;
        const unknown = clients.length - online - offline;
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{online}</p>
              <p className="text-slate-400 text-xs mt-1">Online</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{offline}</p>
              <p className="text-slate-400 text-xs mt-1">Offline</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-400">{unknown}</p>
              <p className="text-slate-400 text-xs mt-1">Unknown</p>
            </div>
          </div>
        );
      })()}

      {/* Clients table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">
            Monitored Networks ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Network size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No UniFi networks configured</p>
              <p className="text-slate-600 text-xs mt-1">Networks appear here when clients have UniFi equipment monitored by the backend.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">Client</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">WAN</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Devices</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Clients</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Last Polled</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c: any) => {
                    const lastPolled = c.last_polled ?? c.as_of ?? c.updated_at;
                    return (
                      <tr
                        key={c.client_id}
                        className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <p className="text-slate-200 font-medium">{c.client_name ?? c.client_id}</p>
                          <p className="text-slate-500 text-xs font-mono">{c.client_id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <WanBadge status={c.wan_status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-200">
                            {c.devices_online != null ? `${c.devices_online}` : '—'}
                            {c.devices_total != null ? `/${c.devices_total}` : ''}
                          </span>
                          {c.devices_total != null && (
                            <span className="text-slate-500 text-xs ml-1">online</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-200">{c.connected_clients ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 text-xs font-mono">
                            {lastPolled ? new Date(lastPolled).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/unifi/${c.client_id}`}
                            className="text-xs text-teal-400 hover:text-teal-300 whitespace-nowrap"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links for known clients */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {[
            { id: 'evan-shoul', label: 'Dr Evan Shoul' },
            { id: 'zoe-jewell', label: 'Zoe Jewell' },
          ].map(({ id, label }) => (
            <Link
              key={id}
              href={`/unifi/${id}`}
              className="text-xs px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors border border-slate-600"
            >
              {label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
