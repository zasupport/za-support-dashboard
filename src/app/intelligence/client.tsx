'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import Link from 'next/link';

type Client = { client_id: string; first_name: string; last_name: string };
type DeviceData = {
  device_id: string;
  avg_app_health?: number | null;
  avg_cpu?: number | null;
  total_crashes?: number | null;
};

const chartStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6 },
  labelStyle: { color: '#94a3b8', fontSize: 11 },
  itemStyle: { color: '#e2e8f0', fontSize: 11 },
};

function healthColor(score: number) {
  if (score >= 80) return '#0FEA7A';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

type FleetOverview = {
  period_days: number;
  totals: {
    devices_reporting?: number;
    unique_apps?: number;
    sample_count?: number;
  };
  top_apps: Array<{
    app_name: string;
    avg_cpu_pct: number | null;
    avg_memory_mb: number | null;
    device_count: number;
    samples: number;
  }>;
  recent_devices: Array<{
    device_id: string;
    client_id: string;
    last_report: string;
    samples_last_week: number;
  }>;
};

function FleetOverviewCard() {
  const [data, setData] = useState<FleetOverview | null>(null);
  useEffect(() => {
    fetch('/api/intelligence/overview?period_days=7', { cache: 'no-store' })
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  if (!data) return null;
  const t = data.totals ?? {};
  const hasData = (t.sample_count ?? 0) > 0;
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">Fleet overview · last {data.period_days}d</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <div className="text-2xl font-bold text-teal-400">{t.devices_reporting ?? 0}</div>
            <div className="text-slate-400 text-xs">Devices reporting</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{t.unique_apps ?? 0}</div>
            <div className="text-slate-400 text-xs">Unique apps tracked</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{(t.sample_count ?? 0).toLocaleString()}</div>
            <div className="text-slate-400 text-xs">Resource samples</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.top_apps.length}</div>
            <div className="text-slate-400 text-xs">Top apps ranked</div>
          </div>
        </div>
        {!hasData && (
          <p className="text-xs text-slate-500">
            No app-intelligence samples in the last {data.period_days} days — PKG module
            emits on a slower cadence than heartbeat. Data appears as agents sample.
          </p>
        )}
        {data.top_apps.length > 0 && (
          <div className="space-y-1">
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Top apps by avg CPU</div>
            {data.top_apps.slice(0, 5).map(a => (
              <div key={a.app_name} className="flex justify-between text-xs text-slate-300">
                <span className="truncate">{a.app_name}</span>
                <span className="text-teal-300">{a.avg_cpu_pct ?? '—'}% · {a.device_count} dev</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AppIntelligenceClient() {
  const [clients, setClients]   = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [data, setData]         = useState<DeviceData[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch('/api/clients?per_page=100')
      .then(r => r.json())
      .then(j => setClients(j.data ?? []))
      .catch(() => {});
  }, []);

  async function load(id: string) {
    if (!id) return;
    setClientId(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/intelligence/fleet?client_id=${encodeURIComponent(id)}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } finally {
      setLoading(false);
    }
  }

  const healthData = data.map(d => ({
    device: d.device_id?.slice(-8) ?? '?',
    health: d.avg_app_health ? Math.round(d.avg_app_health) : 0,
    cpu: d.avg_cpu ? Number(d.avg_cpu.toFixed(1)) : 0,
    crashes: d.total_crashes ?? 0,
  }));

  return (
    <div className="space-y-6">
      <FleetOverviewCard />
      <div className="flex items-center gap-3">
        <select
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white w-64 focus:outline-none focus:border-teal-400"
          value={clientId}
          onChange={e => load(e.target.value)}
        >
          <option value="">Select client…</option>
          {clients.map(c => (
            <option key={c.client_id} value={c.client_id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
        {clientId && (
          <Link href={`/clients/${clientId}`} className="text-xs text-teal-400 hover:text-teal-300">
            View profile →
          </Link>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}

      {!loading && data.length === 0 && clientId && (
        <p className="text-slate-500 text-sm">No app intelligence data for this client yet.</p>
      )}

      {data.length > 0 && (
        <>
          {/* App health bar chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle className="text-white text-sm">App Health Score by Device (higher is better)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="device" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip {...chartStyle} />
                    <Bar dataKey="health" name="App Health" radius={[3, 3, 0, 0]}>
                      {healthData.map((entry, i) => (
                        <Cell key={i} fill={healthColor(entry.health)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CPU chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle className="text-white text-sm">Average CPU Usage % by Device</CardTitle></CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="device" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip {...chartStyle} />
                    <Bar dataKey="cpu" name="CPU %" fill="#f97316" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.map((device, i) => {
              const unhealthy = (device.avg_app_health ?? 100) < 70;
              return (
                <Card key={i} className={`bg-slate-800 border-slate-700 ${unhealthy ? 'border-orange-500/40' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white font-mono">{device.device_id}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>App Health</span>
                      <span className={unhealthy ? 'text-orange-400 font-semibold' : 'text-green-400'}>
                        {device.avg_app_health?.toFixed(0) ?? '—'} / 100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg CPU</span>
                      <span className={(device.avg_cpu ?? 0) > 80 ? 'text-red-400' : 'text-slate-300'}>
                        {device.avg_cpu?.toFixed(1) ?? '—'}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crashes (7d)</span>
                      <span className={(device.total_crashes ?? 0) > 0 ? 'text-red-400' : 'text-slate-500'}>
                        {device.total_crashes ?? 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
