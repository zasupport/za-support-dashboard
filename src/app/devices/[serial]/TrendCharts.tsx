'use client';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MetricRow = {
  time: string;
  battery_health_pct?: number | null;
  battery_cycle_count?: number | null;
  disk_used_pct?: number | null;
  risk_score?: number | null;
  ram_pressure_pct?: number | null;
  swap_used_mb?: number | null;
  // Phase 24 — coconutBattery gaps
  macos_health_pct?: number | null;
  nvme_data_written_tb?: number | null;
  nvme_critical_warning?: number | null;
  charger_watts?: number | null;
  // Phase 25 — Macs Fan Control gaps
  max_smc_temp_c?: number | null;
  sensors_above_80c?: number | null;
  fan_0_target_rpm?: number | null;
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
        const sorted = [...rows].reverse().slice(-30);
        setData(sorted.map(r => ({ ...r, time: fmt(r.time) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [serial]);

  if (loading) return <p className="text-slate-500 text-xs py-4">Loading trends…</p>;
  if (data.length === 0) return <p className="text-slate-600 text-xs py-4">No metric history yet — run a Scout diagnostic with --push.</p>;

  const has = (key: keyof MetricRow) => data.some(d => d[key] != null);

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
      {has('battery_health_pct') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Battery Health (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([50, 100])}{tip}
                  <Line type="monotone" dataKey="battery_health_pct" name="Health %" stroke="#0FEA7A" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('macos_health_pct') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">macOS Battery Health — Extended (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([50, 100])}{tip}
                  <Line type="monotone" dataKey="macos_health_pct" name="macOS Health %" stroke="#34d399" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('disk_used_pct') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Disk Used (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([0, 100])}{tip}
                  <Line type="monotone" dataKey="disk_used_pct" name="Disk %" stroke="#f97316" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('nvme_data_written_tb') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">NVMe Lifetime Writes (TB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="nvme_data_written_tb" name="TB Written" stroke="#fb923c" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('max_smc_temp_c') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Peak Thermal Sensor (°C)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="max_smc_temp_c" name="Max °C" stroke="#f43f5e" dot={false} strokeWidth={2} />
                  {has('sensors_above_80c') && (
                    <Line type="monotone" dataKey="sensors_above_80c" name="Sensors >80°C" stroke="#fbbf24" dot={false} strokeWidth={1} strokeDasharray="4 2" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('risk_score') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([0, 100])}{tip}
                  <Line type="monotone" dataKey="risk_score" name="Risk" stroke="#ef4444" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('ram_pressure_pct') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">RAM Pressure (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([0, 100])}{tip}
                  <Line type="monotone" dataKey="ram_pressure_pct" name="RAM %" stroke="#a78bfa" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('swap_used_mb') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Swap Used (MB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="swap_used_mb" name="Swap MB" stroke="#60a5fa" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('fan_0_target_rpm') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Fan Target RPM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="fan_0_target_rpm" name="Fan 0 RPM" stroke="#38bdf8" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
