'use client';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MetricRow = {
  time: string;
  battery_health_pct?: number | null;
  battery_cycle_count?: number | null;
  disk_used_pct?: number | null;
  risk_score?: number | null;
};

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
  } catch { return ts; }
}

export function TrendCharts({ serial }: { serial: string }) {
  const [data, setData]   = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/devices/${serial}/metrics`)
      .then(r => r.json())
      .then((rows: MetricRow[]) => {
        // Reverse so oldest first on chart; limit to 30 points
        const sorted = [...rows].reverse().slice(-30);
        setData(sorted.map(r => ({ ...r, time: fmt(r.time) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [serial]);

  if (loading) return <p className="text-slate-500 text-xs py-4">Loading trends…</p>;
  if (data.length === 0) return <p className="text-slate-600 text-xs py-4">No metric history yet — run a Scout diagnostic with --push.</p>;

  const hasBattery = data.some(d => d.battery_health_pct != null);
  const hasDisk    = data.some(d => d.disk_used_pct != null);
  const hasRisk    = data.some(d => d.risk_score != null);

  const chartClass = "w-full h-44";
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="#334155" />;
  const axis = (domain?: [number, number]) => (
    <>
      <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
      <YAxis domain={domain} tick={{ fill: '#64748b', fontSize: 10 }} />
    </>
  );
  const tip = (
    <Tooltip
      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
      labelStyle={{ color: '#94a3b8', fontSize: 11 }}
      itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
    />
  );

  return (
    <div className="space-y-4">
      {hasBattery && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Battery Health (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}
                  {axis([50, 100])}
                  {tip}
                  <Line type="monotone" dataKey="battery_health_pct" name="Health %" stroke="#0FEA7A" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hasDisk && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Disk Used (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}
                  {axis([0, 100])}
                  {tip}
                  <Line type="monotone" dataKey="disk_used_pct" name="Disk %" stroke="#f97316" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hasRisk && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}
                  {axis([0, 10])}
                  {tip}
                  <Line type="monotone" dataKey="risk_score" name="Risk" stroke="#ef4444" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
