'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type RoiPeriod = {
  label: string;
  period_start: string;
  period_end: string;
  total_value_protected: number;
  interventions_count: number;
  roi_ratio: number;
  subscription_cost: number;
};

function formatRand(v: number) {
  if (v >= 1_000_000) return `R ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R ${(v / 1_000).toFixed(0)}k`;
  return `R ${v.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { payload: RoiPeriod & { cumulative_value: number } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-xs shadow-lg">
      <p className="text-white font-semibold mb-1">{label}</p>
      <p className="text-teal-300">Value protected: {formatRand(d.total_value_protected)}</p>
      <p className="text-slate-300">ROI ratio: {d.roi_ratio.toFixed(1)}:1</p>
      <p className="text-slate-400">Actions: {d.interventions_count}</p>
    </div>
  );
}

export function RoiTrendChart({ clientId }: { clientId: string }) {
  const [data, setData] = useState<RoiPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/roi/history/${clientId}`)
      .then(r => r.json())
      .then(json => setData(json.periods ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="h-40 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
        <p className="text-slate-500 text-xs">Loading ROI history…</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-40 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
        <p className="text-slate-500 text-xs">ROI history builds after first calculation</p>
      </div>
    );
  }

  // Cumulative running total for the filled area
  let cumulative = 0;
  const chartData = data.map(p => {
    cumulative += p.total_value_protected;
    return { ...p, cumulative_value: cumulative };
  });

  const peak = Math.max(...chartData.map(d => d.cumulative_value), 1);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Cumulative value protected</p>
          <p className="text-white text-lg font-bold leading-tight">
            {formatRand(cumulative)} total
          </p>
        </div>
        <span className="text-xs text-slate-500">{data.length} period{data.length !== 1 ? 's' : ''}</span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatRand}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
            domain={[0, peak * 1.15]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cumulative_value"
            stroke="#0d9488"
            strokeWidth={2}
            fill="url(#roiGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#0d9488', stroke: '#fff', strokeWidth: 1.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
