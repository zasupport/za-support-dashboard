'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Snapshot {
  collected_at?: string;
  created_at?: string;
  wan_latency_ms?: number;
  wan_rx_mbps?: number;
  wan_tx_mbps?: number;
}

interface Props {
  snapshots: Snapshot[];
}

export function LatencyChart({ snapshots }: Props) {
  const data = snapshots
    .slice()
    .reverse()
    .map((s) => ({
      time: s.collected_at ?? s.created_at
        ? new Date(s.collected_at ?? s.created_at!).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
        : '—',
      latency: s.wan_latency_ms ?? null,
      rx: s.wan_rx_mbps != null ? Number(s.wan_rx_mbps.toFixed(2)) : null,
      tx: s.wan_tx_mbps != null ? Number(s.wan_tx_mbps.toFixed(2)) : null,
    }))
    .filter((d) => d.latency != null || d.rx != null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-xs">
        No telemetry data available
      </div>
    );
  }

  const hasLatency = data.some((d) => d.latency != null);
  const hasThroughput = data.some((d) => d.rx != null);

  return (
    <div className="space-y-4">
      {hasLatency && (
        <div>
          <p className="text-slate-500 text-xs mb-2">WAN Latency (ms)</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                itemStyle={{ color: '#14b8a6', fontSize: 11 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${v ?? '—'} ms`, 'Latency']}
              />
              <Area type="monotone" dataKey="latency" stroke="#14b8a6" strokeWidth={2} fill="url(#latencyGrad)" dot={false} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasThroughput && (
        <div>
          <p className="text-slate-500 text-xs mb-2">WAN Throughput (Mbps)</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                itemStyle={{ fontSize: 11 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) => [`${v ?? '—'} Mbps`, name === 'rx' ? '↓ RX' : '↑ TX']}
              />
              <Area type="monotone" dataKey="rx" stroke="#4ade80" strokeWidth={2} fill="url(#rxGrad)" dot={false} connectNulls />
              <Area type="monotone" dataKey="tx" stroke="#818cf8" strokeWidth={2} fill="url(#txGrad)" dot={false} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
