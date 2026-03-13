import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';
import { fetchClientNetwork, fetchClientNetworkHistory } from '@/lib/api';
import { LatencyChart } from './LatencyChart';
import { Network, Wifi, WifiOff, Router, Monitor, Clock } from 'lucide-react';

async function fetchNetworkSnapshots(client_id: string, hours = 24): Promise<any[]> {
  const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
  const API_TOKEN = process.env.ZA_API_TOKEN || '';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/unifi/snapshots/${encodeURIComponent(client_id)}?limit=10`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );
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
    return (
      <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/30 font-medium">
        <Wifi size={14} /> WAN Online
      </span>
    );
  if (s === 'offline')
    return (
      <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/30 font-medium">
        <WifiOff size={14} /> WAN Offline
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-slate-600/40 text-slate-400 border-slate-600 font-medium">
      <Network size={14} /> WAN Unknown
    </span>
  );
}

export default async function UnifiClientPage({
  params,
}: {
  params: Promise<{ client_id: string }>;
}) {
  const { client_id } = await params;

  const [network, history, snapshots] = await Promise.all([
    fetchClientNetwork(client_id),
    fetchClientNetworkHistory(client_id, 24),
    fetchNetworkSnapshots(client_id),
  ]);

  const historyArr: any[] = Array.isArray(history) ? history : [];
  const snapshotsArr: any[] = Array.isArray(snapshots) ? snapshots : [];

  // Use history for chart if snapshots endpoint isn't wired yet
  const chartData = snapshotsArr.length > 0 ? snapshotsArr : historyArr;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60000} />

      {/* Header */}
      <div>
        <Link href="/unifi" className="text-slate-400 text-xs hover:text-white block mb-2">
          ← Network Monitor
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Router size={22} className="text-teal-400 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{client_id}</h1>
              <p className="text-slate-400 text-sm">
                {network?.site_name ? `Site: ${network.site_name}` : 'UniFi Network Detail'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <WanBadge status={network?.wan_status} />
            {network?.stale && (
              <span className="text-xs px-2 py-1 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                Stale data
              </span>
            )}
            <a
              href={`/api/unifi/${client_id}/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
            >
              Download Network Report
            </a>
          </div>
        </div>
      </div>

      {!network ? (
        <div className="rounded-md border border-slate-700 bg-slate-800/50 px-6 py-10 text-center">
          <Network size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No network data available for this client.</p>
          <p className="text-slate-600 text-xs mt-1">
            Data appears here when a UniFi controller is configured for this client in the backend.
          </p>
          <Link href={`/clients/${client_id}`} className="inline-block mt-4 text-xs text-teal-400 hover:text-teal-300">
            View client profile →
          </Link>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-500 text-xs mb-1">WAN IP</p>
              <p className="text-slate-200 text-xs font-mono">{network.wan_ip ?? '—'}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-500 text-xs mb-1">Devices</p>
              <p className="text-white text-xl font-bold">
                {network.devices_online ?? '—'}
                {network.devices_total != null && (
                  <span className="text-slate-500 text-sm font-normal">/{network.devices_total}</span>
                )}
              </p>
              <p className="text-slate-500 text-xs">online</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-500 text-xs mb-1">Clients</p>
              <p className="text-white text-xl font-bold">{network.connected_clients ?? '—'}</p>
              {(network.wireless_clients != null || network.wired_clients != null) && (
                <p className="text-slate-500 text-xs">{network.wireless_clients ?? 0}W + {network.wired_clients ?? 0}E</p>
              )}
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-500 text-xs mb-1">Uptime</p>
              <p className="text-slate-200 text-sm font-mono">
                {network.uptime_hours != null ? `${network.uptime_hours}h` : '—'}
              </p>
            </div>
          </div>

          {/* Throughput */}
          {(network.wan_rx_mbps != null || network.wan_tx_mbps != null) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-3">
                <span className="text-green-400 text-sm font-semibold">↓ RX</span>
                <span className="text-slate-200 text-sm font-mono">
                  {network.wan_rx_mbps != null ? `${network.wan_rx_mbps.toFixed(2)} Mbps` : '—'}
                </span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-3">
                <span className="text-indigo-400 text-sm font-semibold">↑ TX</span>
                <span className="text-slate-200 text-sm font-mono">
                  {network.wan_tx_mbps != null ? `${network.wan_tx_mbps.toFixed(2)} Mbps` : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Latency / throughput chart */}
          {chartData.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Network Telemetry — Last 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <LatencyChart snapshots={chartData} />
              </CardContent>
            </Card>
          )}

          {/* Device list */}
          {network.devices && (network.devices as any[]).length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Monitor size={14} className="text-teal-400" />
                  Network Devices ({(network.devices as any[]).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">Device</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Type</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">IP</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Firmware</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(network.devices as any[]).map((d: any) => (
                        <tr
                          key={d.mac ?? d.name}
                          className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors"
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                              <div>
                                <p className="text-slate-200">{d.name || d.model || d.mac}</p>
                                {d.mac && <p className="text-slate-500 text-xs font-mono">{d.mac}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-400 text-xs uppercase font-mono">{d.type ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-300 text-xs font-mono">{d.ip ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-400 text-xs font-mono">{d.firmware_version ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${d.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                              {d.status ?? 'unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent snapshots */}
          {snapshotsArr.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock size={14} className="text-teal-400" />
                  Recent Snapshots (last 10)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">Time</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">WAN</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Devices</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Clients</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Latency</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">RX / TX</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshotsArr.map((s: any, i: number) => {
                        const ts = s.collected_at ?? s.created_at;
                        return (
                          <tr
                            key={s.id ?? i}
                            className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="px-6 py-3">
                              <span className="text-slate-300 text-xs font-mono">
                                {ts ? new Date(ts).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium ${
                                (s.wan_status ?? '').toLowerCase() === 'online' ? 'text-green-400'
                                : (s.wan_status ?? '').toLowerCase() === 'offline' ? 'text-red-400'
                                : 'text-slate-400'
                              }`}>
                                {s.wan_status ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-slate-300 text-xs">
                                {s.devices_online != null ? `${s.devices_online}` : '—'}
                                {s.devices_total != null ? `/${s.devices_total}` : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-slate-300 text-xs">{s.connected_clients ?? '—'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-slate-400 text-xs font-mono">
                                {s.wan_latency_ms != null ? `${s.wan_latency_ms}ms` : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-slate-400 text-xs font-mono">
                                {s.wan_rx_mbps != null ? `↓${s.wan_rx_mbps.toFixed(1)}` : ''}
                                {s.wan_rx_mbps != null && s.wan_tx_mbps != null ? ' ' : ''}
                                {s.wan_tx_mbps != null ? `↑${s.wan_tx_mbps.toFixed(1)}` : ''}
                                {s.wan_rx_mbps == null && s.wan_tx_mbps == null ? '—' : ' Mbps'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last polled footer */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Last polled: {network.as_of ? new Date(network.as_of).toLocaleString('en-ZA') : '—'}
              {network.source ? ` · Source: ${network.source}` : ''}
            </span>
            <Link href={`/clients/${client_id}`} className="text-teal-500 hover:text-teal-400">
              View client profile →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
