'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

type Outage = {
  isp_name?: string;
  name?: string;
  severity?: string;
  detected_at?: string;
};

type Props = { outages: Outage[] };

const TIP = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6 },
  labelStyle: { color: '#94a3b8', fontSize: 11 },
  itemStyle: { color: '#e2e8f0', fontSize: 11 },
};

export function ISPOutageChart({ outages }: Props) {
  if (outages.length === 0) return null;

  // Count outages per ISP
  const counts: Record<string, number> = {};
  for (const o of outages) {
    const name = o.isp_name || o.name || 'Unknown';
    counts[name] = (counts[name] || 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([isp, count]) => ({ isp: isp.length > 12 ? isp.slice(0, 12) + '…' : isp, count }))
    .sort((a, b) => b.count - a.count);

  const colours = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22d3ee'];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-white mb-3">Outage Frequency by ISP (last 30 days)</h2>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="isp" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip {...TIP} />
            <Bar dataKey="count" name="Outages" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colours[i % colours.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
