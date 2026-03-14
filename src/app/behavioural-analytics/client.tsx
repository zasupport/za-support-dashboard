'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

type Client = { client_id: string; first_name: string; last_name: string };

type DeviceSummary = {
  device_id: string;
  latest_efficiency_score: number | null;
  efficiency_grade: string | null;
  total_monthly_loss_zar: number | null;
  top_bottleneck_type: string | null;
  hourly_rate_zar: number | null;
  session_count: number;
};

type RoiSummary = {
  total_devices: number;
  fleet_monthly_loss_zar: number;
  fleet_annual_projection_zar: number;
  avg_efficiency_score: number | null;
  worst_device_id: string | null;
  worst_device_loss_zar: number | null;
};

type TrendPoint = { bucket: string; avg_efficiency_score: number | null; avg_loss_zar: number | null };

type LossBreakdownItem = {
  category: string;
  label: string;
  minutes_lost_per_day: number;
  monthly_loss_zar: number;
  basis: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeColour(grade: string | null): string {
  if (!grade) return 'text-slate-400';
  if (grade === 'A') return 'text-green-400';
  if (grade === 'B') return 'text-teal-400';
  if (grade === 'C') return 'text-yellow-400';
  if (grade === 'D') return 'text-orange-400';
  return 'text-red-400';
}

function scoreColour(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 90) return 'text-green-400';
  if (score >= 75) return 'text-teal-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function fmtZar(val: number | null): string {
  if (val === null || val === undefined) return '—';
  return `R ${Math.round(val).toLocaleString('en-ZA')}`;
}

function bottleneckLabel(type: string | null): string {
  if (!type) return '—';
  const map: Record<string, string> = {
    app_launch_delays: 'Slow app launches',
    application_hangs: 'App hangs / freezes',
    memory_pressure: 'Memory pressure',
    slow_boot: 'Slow boot times',
    cpu_throttling: 'CPU throttling',
    disk_io: 'Disk I/O slowdowns',
    crash_recovery: 'App crashes',
  };
  return map[type] ?? type;
}


// ── Trend chart for a specific device ────────────────────────────────────────

function DeviceTrendChart({ clientId, deviceId }: { clientId: string; deviceId: string }) {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/behavioural/trends?client_id=${encodeURIComponent(clientId)}&device_id=${encodeURIComponent(deviceId)}&days=90`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setTrend(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch(() => { if (!cancelled) { setTrend([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [clientId, deviceId]);

  if (loading) return <p className="text-slate-500 text-xs mt-2">Loading trend…</p>;
  if (!trend.length) return <p className="text-slate-600 text-xs mt-2">No trend data yet (need 2+ sessions).</p>;

  const data = trend.map(p => ({
    t: new Date(p.bucket).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
    score: p.avg_efficiency_score !== null ? Math.round(p.avg_efficiency_score) : null,
    loss: p.avg_loss_zar !== null ? Math.round(p.avg_loss_zar) : null,
  }));

  return (
    <div className="mt-3 h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="t" tick={{ fill: '#475569', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} width={24} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 4, fontSize: 11 }}
          />
          <ReferenceLine y={75} stroke="#22d3ee" strokeDasharray="3 2" />
          <Line
            type="monotone"
            dataKey="score"
            name="Efficiency"
            stroke="#22d3ee"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Loss breakdown table for a device ────────────────────────────────────────

function LossBreakdown({ clientId, deviceId }: { clientId: string; deviceId: string }) {
  const [detail, setDetail] = useState<{ loss_breakdown?: LossBreakdownItem[]; roi_message?: string; hourly_rate_zar?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/behavioural/device?client_id=${encodeURIComponent(clientId)}&device_id=${encodeURIComponent(deviceId)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setDetail(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setDetail(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [clientId, deviceId]);

  if (loading) return <p className="text-slate-500 text-xs mt-3">Loading breakdown…</p>;
  if (!detail?.loss_breakdown?.length) return <p className="text-slate-600 text-xs mt-3">No breakdown data.</p>;

  const breakdown = detail.loss_breakdown.filter(b => b.monthly_loss_zar > 0);

  return (
    <div className="mt-3 space-y-2">
      {detail.roi_message && (
        <p className="text-xs text-teal-300 italic">{detail.roi_message}</p>
      )}
      <table className="w-full text-xs text-slate-400">
        <thead>
          <tr className="border-b border-slate-700 text-slate-500">
            <th className="text-left py-1 pr-2 font-normal">Bottleneck</th>
            <th className="text-right py-1 pr-2 font-normal">Min/day</th>
            <th className="text-right py-1 font-normal">Monthly loss</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((b, i) => (
            <tr key={i} className="border-b border-slate-800">
              <td className="py-1 pr-2">{b.label}</td>
              <td className="text-right py-1 pr-2">{b.minutes_lost_per_day.toFixed(1)}</td>
              <td className="text-right py-1 text-red-400 font-semibold">{fmtZar(b.monthly_loss_zar)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {detail.hourly_rate_zar && (
        <p className="text-slate-600 text-xs">Based on R {detail.hourly_rate_zar.toLocaleString('en-ZA')}/hr rate</p>
      )}
    </div>
  );
}

// ── Hourly rate editor ────────────────────────────────────────────────────────

function HourlyRateEditor({ clientId, currentRate, onUpdated }: {
  clientId: string;
  currentRate: number | null;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState(String(currentRate ?? 2500));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/behavioural/hourly-rate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, hourly_rate_zar: Number(rate) }),
    });
    setSaving(false);
    setEditing(false);
    onUpdated();
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-teal-400 hover:text-teal-300 underline"
      >
        Rate: {fmtZar(currentRate ?? 2500)}/hr — edit
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">R</span>
      <input
        type="number"
        value={rate}
        onChange={e => setRate(e.target.value)}
        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white w-24 focus:outline-none focus:border-teal-400"
        placeholder="2500"
      />
      <span className="text-xs text-slate-400">/hr</span>
      <button
        onClick={save}
        disabled={saving}
        className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-300">
        Cancel
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BehaviouralClient() {
  const [clients, setClients]           = useState<Client[]>([]);
  const [clientId, setClientId]         = useState('');
  const [devices, setDevices]           = useState<DeviceSummary[]>([]);
  const [roi, setRoi]                   = useState<RoiSummary | null>(null);
  const [loading, setLoading]           = useState(false);
  const [expandedDevice, setExpanded]   = useState<string | null>(null);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);
  const [refreshKey, setRefreshKey]     = useState(0);

  // Load client list
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
    setDevices([]);
    setRoi(null);
    setExpanded(null);
    setExpandedBreakdown(null);

    try {
      const [summaryRes, roiRes] = await Promise.all([
        fetch(`/api/behavioural/summary?client_id=${encodeURIComponent(id)}`),
        fetch(`/api/behavioural/roi?client_id=${encodeURIComponent(id)}`),
      ]);
      const summaryJson = await summaryRes.json();
      const roiJson = await roiRes.json();
      setDevices(summaryJson.devices ?? []);
      setRoi(roiJson);
    } catch {
      // graceful degradation
    } finally {
      setLoading(false);
    }
  }

  // Reload data when hourly rate is updated
  useEffect(() => {
    if (clientId && refreshKey > 0) load(clientId);
  }, [refreshKey]);  // eslint-disable-line react-hooks/exhaustive-deps

  const currentRate = devices[0]?.hourly_rate_zar ?? null;

  return (
    <div className="space-y-6">

      {/* Client selector */}
      <div className="flex items-center gap-3 flex-wrap">
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
          <>
            <Link href={`/clients/${clientId}`} className="text-xs text-teal-400 hover:text-teal-300">
              View profile →
            </Link>
            <HourlyRateEditor
              clientId={clientId}
              currentRate={currentRate}
              onUpdated={() => setRefreshKey(k => k + 1)}
            />
          </>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}

      {!loading && devices.length === 0 && clientId && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
          <p className="text-slate-400 text-sm mb-1">No behavioural data for this client yet.</p>
          <p className="text-slate-600 text-xs">
            Data is collected automatically when Scout Phase 20 runs on this client&apos;s device.
          </p>
        </div>
      )}

      {/* Fleet ROI summary */}
      {roi && roi.total_devices > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-3">
              <p className="text-slate-400 text-xs mb-1">Devices monitored</p>
              <p className="text-2xl font-bold text-white">{roi.total_devices}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-3">
              <p className="text-slate-400 text-xs mb-1">Fleet monthly loss</p>
              <p className="text-2xl font-bold text-red-400">{fmtZar(roi.fleet_monthly_loss_zar)}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-3">
              <p className="text-slate-400 text-xs mb-1">Annual projection</p>
              <p className="text-2xl font-bold text-orange-400">{fmtZar(roi.fleet_annual_projection_zar)}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-3">
              <p className="text-slate-400 text-xs mb-1">Avg efficiency</p>
              <p className={`text-2xl font-bold ${scoreColour(roi.avg_efficiency_score)}`}>
                {roi.avg_efficiency_score !== null ? `${Math.round(roi.avg_efficiency_score)}/100` : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ROI message */}
      {roi && roi.fleet_monthly_loss_zar > 0 && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4">
          <p className="text-red-300 text-sm font-medium">
            Productivity loss costing this client approximately{' '}
            <span className="font-bold">{fmtZar(roi.fleet_monthly_loss_zar)}/month</span>
            {' '}— <span className="font-bold">{fmtZar(roi.fleet_annual_projection_zar)}/year</span>.
          </p>
          <p className="text-red-400/70 text-xs mt-1">
            Addressing the top bottleneck on the worst-performing device could recover a significant portion of this cost.
          </p>
        </div>
      )}

      {/* Device cards */}
      {devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device, i) => {
            const isTrendExpanded = expandedDevice === device.device_id;
            const isBreakdownExpanded = expandedBreakdown === device.device_id;
            const score = device.latest_efficiency_score;
            const poor = score !== null && score < 60;

            return (
              <Card
                key={i}
                className={`bg-slate-800 border-slate-700 ${poor ? 'border-red-500/30' : ''}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white font-mono flex items-center justify-between">
                    <span className="truncate" title={device.device_id}>{device.device_id}</span>
                    <span className={`text-xl font-bold ml-2 ${gradeColour(device.efficiency_grade)}`}>
                      {device.efficiency_grade ?? '—'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-400">

                  {/* Efficiency score bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Efficiency score</span>
                      <span className={`font-semibold ${scoreColour(score)}`}>
                        {score !== null ? `${Math.round(score)}/100` : '—'}
                      </span>
                    </div>
                    {score !== null && (
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${score >= 75 ? 'bg-teal-400' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.max(score, 2)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Monthly loss */}
                  <div className="flex justify-between">
                    <span>Monthly productivity loss</span>
                    <span className={`font-semibold ${device.total_monthly_loss_zar ? 'text-red-400' : 'text-slate-500'}`}>
                      {fmtZar(device.total_monthly_loss_zar)}
                    </span>
                  </div>

                  {/* Annual projection */}
                  {device.total_monthly_loss_zar && (
                    <div className="flex justify-between">
                      <span>Annual projection</span>
                      <span className="text-orange-400/80">
                        {fmtZar(device.total_monthly_loss_zar * 12)}
                      </span>
                    </div>
                  )}

                  {/* Top bottleneck */}
                  <div className="flex justify-between">
                    <span>Top bottleneck</span>
                    <span className="text-slate-300 text-right max-w-[55%]">
                      {bottleneckLabel(device.top_bottleneck_type)}
                    </span>
                  </div>

                  {/* Sessions */}
                  <div className="flex justify-between">
                    <span>Scout sessions</span>
                    <span>{device.session_count}</span>
                  </div>

                  {/* Expand buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setExpanded(isTrendExpanded ? null : device.device_id)}
                      className="flex-1 text-xs text-teal-400 hover:text-teal-300 text-center py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                    >
                      {isTrendExpanded ? '▲ Hide trend' : '▼ 90d trend'}
                    </button>
                    <button
                      onClick={() => setExpandedBreakdown(isBreakdownExpanded ? null : device.device_id)}
                      className="flex-1 text-xs text-orange-400 hover:text-orange-300 text-center py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                    >
                      {isBreakdownExpanded ? '▲ Hide detail' : '▼ Loss detail'}
                    </button>
                  </div>

                  {/* Trend chart */}
                  {isTrendExpanded && clientId && (
                    <DeviceTrendChart clientId={clientId} deviceId={device.device_id} />
                  )}

                  {/* Loss breakdown table */}
                  {isBreakdownExpanded && clientId && (
                    <LossBreakdown clientId={clientId} deviceId={device.device_id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* POPIA note */}
      {clientId && (
        <p className="text-slate-700 text-xs">
          POPIA compliant — app names only, no file content, no keystrokes. Consent required before data is stored.
        </p>
      )}
    </div>
  );
}
