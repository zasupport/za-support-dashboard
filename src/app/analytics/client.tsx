'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import Link from 'next/link';

type Client = { client_id: string; first_name: string; last_name: string };
type DeviceData = {
  device_id: string;
  avg_frustration_score?: number | null;
  avg_typing_speed_wpm?: number | null;
  total_rage_clicks?: number | null;
  sample_count?: number | null;
};
type TimelinePoint = { timestamp: string; frustration_score: number; rage_clicks?: number };

const chartStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6 },
  labelStyle: { color: '#94a3b8', fontSize: 11 },
  itemStyle: { color: '#e2e8f0', fontSize: 11 },
};

function FrustrationTimeline({ deviceId }: { deviceId: string }) {
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/analytics/frustration-timeline/${encodeURIComponent(deviceId)}?days=30`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setTimeline(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch(() => { if (!cancelled) { setTimeline([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [deviceId]);

  if (loading) return <p className="text-slate-500 text-xs mt-2">Loading timeline…</p>;
  if (!timeline.length) return <p className="text-slate-600 text-xs mt-2">No timeline data.</p>;

  const chartData = timeline.map(p => ({
    t: new Date(p.timestamp).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
    score: Math.round(p.frustration_score),
    rageClicks: p.rage_clicks ?? 0,
  }));

  return (
    <div className="mt-3 h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="t" tick={{ fill: '#475569', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} width={24} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 4, fontSize: 11 }}
          />
          <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="3 2" />
          <Area type="monotone" dataKey="score" name="Frustration" stroke="#f97316" fill="#f9731620" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InteractionClient() {
  const [clients, setClients]       = useState<Client[]>([]);
  const [clientId, setClientId]     = useState('');
  const [data, setData]             = useState<DeviceData[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expandedDevice, setExpanded] = useState<string | null>(null);

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
      const res = await fetch(`/api/analytics/fleet?client_id=${encodeURIComponent(id)}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } finally {
      setLoading(false);
    }
  }

  // Build bar-chart friendly data from device summaries
  const chartData = data.map(d => ({
    device: d.device_id?.slice(-8) ?? '?',
    frustration: d.avg_frustration_score ? Math.round(d.avg_frustration_score) : 0,
    typing: d.avg_typing_speed_wpm ? Math.round(d.avg_typing_speed_wpm) : 0,
    rage_clicks: d.total_rage_clicks ?? 0,
  }));

  return (
    <div className="space-y-6">
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
        <p className="text-slate-500 text-sm">No interaction analytics data for this client yet.</p>
      )}

      {data.length > 0 && (
        <>
          {/* Frustration chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle className="text-white text-sm">Average Frustration Score by Device (lower is better)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="device" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip {...chartStyle} />
                    <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'High', fill: '#ef4444', fontSize: 10 }} />
                    <Line type="monotone" dataKey="frustration" name="Frustration" stroke="#f97316" dot={{ r: 4 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.map((device, i) => {
              const frustrated = (device.avg_frustration_score ?? 0) > 60;
              const isExpanded = expandedDevice === device.device_id;
              return (
                <Card
                  key={i}
                  className={`bg-slate-800 border-slate-700 cursor-pointer transition-colors ${frustrated ? 'border-orange-500/40' : ''} ${isExpanded ? 'border-teal-500/40' : ''}`}
                  onClick={() => setExpanded(isExpanded ? null : device.device_id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white font-mono flex items-center justify-between">
                      <span>{device.device_id}</span>
                      <span className="text-xs text-slate-500 font-normal">{isExpanded ? '▲ collapse' : '▼ timeline'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Avg Frustration</span>
                      <span className={frustrated ? 'text-orange-400 font-semibold' : 'text-green-400'}>
                        {device.avg_frustration_score?.toFixed(0) ?? '—'} / 100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Typing Speed</span>
                      <span className="text-slate-300">{device.avg_typing_speed_wpm?.toFixed(0) ?? '—'} WPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rage Clicks</span>
                      <span className={(device.total_rage_clicks ?? 0) > 0 ? 'text-red-400' : 'text-slate-500'}>
                        {device.total_rage_clicks ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Samples</span>
                      <span>{device.sample_count ?? '—'}</span>
                    </div>
                    {isExpanded && <FrustrationTimeline deviceId={device.device_id} />}
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
