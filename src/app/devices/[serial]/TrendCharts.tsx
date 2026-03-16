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
  // migration_148 — extended Scout fields
  load_avg_1m?: number | null;
  load_avg_5m?: number | null;
  load_avg_15m?: number | null;
  uptime_seconds?: number | null;
  battery_voltage_mv?: number | null;
  battery_temp_c?: number | null;
  gatekeeper_on?: boolean | null;
  nvme_pct_used?: number | null;
  nvme_power_on_hours?: number | null;
  // Phase 29 — IOKit Advanced Intelligence (migration_156)
  gpu_renderer_util_pct?: number | null;
  gpu_tiler_util_pct?: number | null;
  gpu_core_clock_mhz?: number | null;
  pacc_temp_c?: number | null;
  eacc_temp_c?: number | null;
  hid_idle_secs?: number | null;
  mem_pressure_level_int?: number | null;
  kext_third_party?: number | null;
  quarantine_bypassed?: number | null;
  usb_device_count?: number | null;
  nq_dl_mbps?: number | null;
  nq_ul_mbps?: number | null;
  nq_base_rtt_ms?: number | null;
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

      {(has('load_avg_1m') || has('load_avg_5m') || has('load_avg_15m')) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">System Load Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  {has('load_avg_1m') && <Line type="monotone" dataKey="load_avg_1m" name="1m" stroke="#0FEA7A" dot={false} strokeWidth={2} />}
                  {has('load_avg_5m') && <Line type="monotone" dataKey="load_avg_5m" name="5m" stroke="#34d399" dot={false} strokeWidth={2} strokeDasharray="4 2" />}
                  {has('load_avg_15m') && <Line type="monotone" dataKey="load_avg_15m" name="15m" stroke="#6ee7b7" dot={false} strokeWidth={1} strokeDasharray="2 3" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('uptime_seconds') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Uptime (days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.map(r => ({ ...r, uptime_days: r.uptime_seconds != null ? +(r.uptime_seconds / 86400).toFixed(1) : null }))}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="uptime_days" name="Uptime (days)" stroke="#38bdf8" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('battery_voltage_mv') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Battery Voltage (mV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="battery_voltage_mv" name="Voltage mV" stroke="#f59e0b" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('nvme_pct_used') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">NVMe Wear (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([0, 100])}{tip}
                  <Line type="monotone" dataKey="nvme_pct_used" name="NVMe Wear %" stroke="#f87171" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 29 — IOKit Advanced Intelligence */}
      {(has('gpu_renderer_util_pct') || has('gpu_tiler_util_pct')) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">GPU Utilisation (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([0, 100])}{tip}
                  {has('gpu_renderer_util_pct') && <Line type="monotone" dataKey="gpu_renderer_util_pct" name="Renderer %" stroke="#818cf8" dot={false} strokeWidth={2} />}
                  {has('gpu_tiler_util_pct') && <Line type="monotone" dataKey="gpu_tiler_util_pct" name="Tiler %" stroke="#a78bfa" dot={false} strokeWidth={2} strokeDasharray="4 2" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('gpu_core_clock_mhz') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">GPU Core Clock (MHz)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="gpu_core_clock_mhz" name="Core Clock MHz" stroke="#c084fc" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {(has('pacc_temp_c') || has('eacc_temp_c')) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Apple Silicon Cluster Temps (°C)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  {has('pacc_temp_c') && <Line type="monotone" dataKey="pacc_temp_c" name="pACC (P-core) °C" stroke="#f97316" dot={false} strokeWidth={2} />}
                  {has('eacc_temp_c') && <Line type="monotone" dataKey="eacc_temp_c" name="eACC (E-core) °C" stroke="#fb923c" dot={false} strokeWidth={2} strokeDasharray="4 2" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {(has('nq_dl_mbps') || has('nq_ul_mbps')) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Network Speed (Mbps)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  {has('nq_dl_mbps') && <Line type="monotone" dataKey="nq_dl_mbps" name="Download Mbps" stroke="#0FEA7A" dot={false} strokeWidth={2} />}
                  {has('nq_ul_mbps') && <Line type="monotone" dataKey="nq_ul_mbps" name="Upload Mbps" stroke="#34d399" dot={false} strokeWidth={2} strokeDasharray="4 2" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('nq_base_rtt_ms') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Network Base RTT (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis()}{tip}
                  <Line type="monotone" dataKey="nq_base_rtt_ms" name="Base RTT ms" stroke="#38bdf8" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('mem_pressure_level_int') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Memory Pressure Level (0=normal 3=fatal)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([0, 3])}{tip}
                  <Line type="stepAfter" dataKey="mem_pressure_level_int" name="Pressure" stroke="#f43f5e" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {has('kext_third_party') && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">3rd-Party Kernel Extensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {grid}{axis([0])}{tip}
                  <Line type="monotone" dataKey="kext_third_party" name="Kexts" stroke="#fbbf24" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
