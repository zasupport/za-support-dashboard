/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Activity, Wifi, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(ts?: string | null): string {
  if (!ts) return '—';
  const diffMs = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function streamStatus(ts?: string | null): 'green' | 'yellow' | 'red' {
  if (!ts) return 'red';
  const diffMs = Date.now() - new Date(ts).getTime();
  const hours = diffMs / 3600000;
  if (hours < 1) return 'green';
  if (hours < 24) return 'yellow';
  return 'red';
}

function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const cls = {
    green:  'bg-green-500',
    yellow: 'bg-yellow-400',
    red:    'bg-red-500',
  }[status];
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls} shrink-0`} />
  );
}

function StatusBadge({ status }: { status: 'green' | 'yellow' | 'red' }) {
  if (status === 'green')  return <span className="text-xs px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/30 font-medium">Live</span>;
  if (status === 'yellow') return <span className="text-xs px-2 py-0.5 rounded border bg-yellow-400/10 text-yellow-400 border-yellow-400/30 font-medium">Stale</span>;
  return <span className="text-xs px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30 font-medium">No Data</span>;
}

// ─── main component ──────────────────────────────────────────────────────────

export default function DataHealthPage() {
  const [clients, setClients]     = useState<any[]>([]);
  const [commands, setCommands]   = useState<any>({});
  const [unifi, setUnifi]         = useState<any[]>([]);
  const [scheduler, setScheduler] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [cRes, cmdRes, uRes, sRes] = await Promise.all([
        fetch('/api/data-health/clients',   { cache: 'no-store' }),
        fetch('/api/data-health/commands',  { cache: 'no-store' }),
        fetch('/api/data-health/unifi',     { cache: 'no-store' }),
        fetch('/api/data-health/scheduler', { cache: 'no-store' }),
      ]);
      const [cJson, cmdJson, uJson, sJson] = await Promise.all([
        cRes.ok ? cRes.json() : { data: [] },
        cmdRes.ok ? cmdRes.json() : {},
        uRes.ok ? uRes.json() : [],
        sRes.ok ? sRes.json() : [],
      ]);
      setClients(Array.isArray(cJson.data) ? cJson.data : []);
      setCommands(cmdJson ?? {});
      setUnifi(Array.isArray(uJson) ? uJson : []);
      setScheduler(Array.isArray(sJson) ? sJson : []);
      setLastRefresh(new Date());
    } catch {
      // non-fatal — leave stale data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(), 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ── derived stats ──────────────────────────────────────────────────────────
  const activeClients = clients.filter(c => c.status !== 'inactive');
  const green  = activeClients.filter(c => streamStatus(c.last_seen) === 'green').length;
  const yellow = activeClients.filter(c => streamStatus(c.last_seen) === 'yellow').length;
  const red    = activeClients.filter(c => streamStatus(c.last_seen) === 'red').length;

  const failedJobs     = scheduler.filter((j: any) => (j.consecutive_failures ?? 0) > 0 || j.last_status === 'failed');
  const unifiOnline    = unifi.filter((u: any) => (u.wan_status ?? '').toLowerCase() === 'online').length;
  const pendingCmds: number = typeof commands.pending === 'number' ? commands.pending : 0;

  // ── pending commands per client (if API returns by_client breakdown) ───────
  const cmdByClient: Record<string, number> = commands.by_client ?? {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading data health...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Activity size={22} className="text-teal-400 shrink-0 mt-0.5" />
          <div>
            <h1 className="text-2xl font-bold text-white">Data Health</h1>
            <p className="text-slate-400 text-sm">Live data stream status for all client Macs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastRefresh && (
            <span className="text-xs text-slate-500 hidden sm:block">
              Updated {timeAgo(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── summary strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400 mb-1">Live (&lt;1h)</p>
            <p className="text-2xl font-bold text-green-400">{green}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400 mb-1">Stale (1-24h)</p>
            <p className={`text-2xl font-bold ${yellow > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>{yellow}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400 mb-1">No Data (&gt;24h)</p>
            <p className={`text-2xl font-bold ${red > 0 ? 'text-red-400' : 'text-slate-500'}`}>{red}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400 mb-1">Pending Commands</p>
            <p className={`text-2xl font-bold ${pendingCmds > 0 ? 'text-orange-400' : 'text-slate-400'}`}>{pendingCmds}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── client data stream table ────────────────────────────────────────── */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Database size={14} className="text-teal-400" />
            Client Data Streams ({activeClients.length} active)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeClients.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">No active clients found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3 w-6"></th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Client</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Last Seen</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Agent Version</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Pending Cmds</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Scout Last Run</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeClients.map((c: any, i: number) => {
                    const st = streamStatus(c.last_seen);
                    const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || `Client ${c.client_id}`;
                    const pending = cmdByClient[String(c.client_id)] ?? c.pending_commands ?? null;
                    const scoutTs = c.last_scout_run ?? c.scout_last_run ?? c.last_diagnostic_at ?? null;
                    return (
                      <tr
                        key={c.client_id}
                        className={`border-b border-slate-700/40 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-800/40'} ${st === 'red' ? 'bg-red-500/5' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <StatusDot status={st} />
                        </td>
                        <td className="px-4 py-3">
                          <a href={`/clients/${c.client_id}`} className="text-slate-200 hover:text-teal-400 font-medium transition-colors">
                            {name}
                          </a>
                          {c.business_name && (
                            <p className="text-xs text-slate-500">{c.business_name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(c.last_seen)}</td>
                        <td className="px-4 py-3 text-xs">
                          {c.agent_version ? (
                            <span className="font-mono text-slate-300">{c.agent_version}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {pending !== null && pending > 0 ? (
                            <span className="font-medium text-orange-400">{pending}</span>
                          ) : pending === 0 ? (
                            <span className="text-slate-500">0</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(scoutTs)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={st} />
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

      {/* ── UniFi section ──────────────────────────────────────────────────── */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Wifi size={14} className="text-teal-400" />
            UniFi Network Monitor ({unifi.length} site{unifi.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {unifi.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">No UniFi sites configured.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3 w-6"></th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Client</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">WAN</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Devices</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">WAN IP</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Last Polled</th>
                  </tr>
                </thead>
                <tbody>
                  {unifi.map((u: any, i: number) => {
                    const wanStatus = (u.wan_status ?? '').toLowerCase();
                    const isOnline  = wanStatus === 'online';
                    const pollDot   = isOnline ? 'green' : wanStatus === 'offline' ? 'red' : 'yellow';
                    const clientName = u.client_name ?? u.name ?? `Client ${u.client_id}`;
                    return (
                      <tr
                        key={u.client_id ?? i}
                        className={`border-b border-slate-700/40 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-800/40'} ${!isOnline && wanStatus !== '' ? 'bg-red-500/5' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <StatusDot status={pollDot} />
                        </td>
                        <td className="px-4 py-3 text-slate-200 font-medium">{clientName}</td>
                        <td className="px-4 py-3">
                          {isOnline
                            ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Online</span>
                            : wanStatus === 'offline'
                              ? <span className="text-xs text-red-400 flex items-center gap-1"><XCircle size={12} /> Offline</span>
                              : <span className="text-xs text-slate-400">Unknown</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {u.device_count != null ? u.device_count : '—'}
                          {u.client_count != null ? <span className="text-slate-600"> / {u.client_count} clients</span> : null}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">{u.wan_ip ?? u.cloud_wan_ip ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(u.last_polled ?? u.last_seen)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-slate-700/40 flex gap-4 text-xs text-slate-500">
                <span className="text-green-400 font-medium">{unifiOnline} online</span>
                <span className="text-red-400">{unifi.length - unifiOnline} offline/unknown</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Scheduler section ──────────────────────────────────────────────── */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Clock size={14} className="text-teal-400" />
            Scheduler Health
            {failedJobs.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30 font-medium flex items-center gap-1">
                <AlertTriangle size={11} /> {failedJobs.length} failing
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {scheduler.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">No scheduler data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5 w-6"></th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5">Job</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5">Schedule</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5">Last Run</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5">Status</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">Failures</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduler.map((j: any, i: number) => {
                    const failures = j.consecutive_failures ?? 0;
                    const failed   = failures > 0 || j.last_status === 'failed';
                    return (
                      <tr
                        key={j.job_id ?? i}
                        className={`border-b border-slate-700/40 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-800/40'} ${failed ? 'bg-red-500/5' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          {failed
                            ? <AlertTriangle size={12} className="text-red-400" />
                            : <CheckCircle   size={12} className="text-green-500/60" />
                          }
                        </td>
                        <td className="px-4 py-2.5">
                          <p className={`font-medium ${failed ? 'text-red-300' : 'text-slate-200'}`}>{j.name ?? j.job_id}</p>
                          {j.last_error && failed && (
                            <p className="text-red-400/70 text-[10px] mt-0.5 max-w-xs truncate" title={j.last_error}>{j.last_error}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{j.schedule ?? '—'}</td>
                        <td className="px-4 py-2.5 text-slate-400">{timeAgo(j.last_run)}</td>
                        <td className="px-4 py-2.5">
                          {j.last_status === 'success' && <span className="text-green-400">ok</span>}
                          {j.last_status === 'failed'  && <span className="text-red-400">failed</span>}
                          {!j.last_status              && <span className="text-slate-600">pending</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {failures > 0
                            ? <span className="text-red-400 font-bold">{failures}</span>
                            : <span className="text-slate-600">0</span>
                          }
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

      {/* auto-refresh notice */}
      <p className="text-center text-xs text-slate-600">Auto-refreshes every 30 seconds</p>
    </div>
  );
}
