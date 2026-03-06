'use client';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TimelineRow = {
  bucket: string;
  avg_frustration_score?: number | null;
  max_frustration_score?: number | null;
  rage_click_count?: number | null;
  sample_count?: number | null;
};

function fmt(ts: string) {
  try { return new Date(ts).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }); }
  catch { return ts; }
}

const tip = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6 },
  labelStyle: { color: '#94a3b8', fontSize: 11 },
  itemStyle: { color: '#e2e8f0', fontSize: 11 },
};

export function FrustrationTimeline({ serial }: { serial: string }) {
  const [data, setData] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/frustration-timeline/${encodeURIComponent(serial)}?days=30`)
      .then(r => r.json())
      .then((rows: TimelineRow[]) => {
        const mapped = (Array.isArray(rows) ? rows : [])
          .map(r => ({ ...r, bucket: fmt(r.bucket) }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [serial]);

  if (loading) return null;
  if (data.length === 0) return null;

  const maxFrustration = Math.max(...data.map(d => d.max_frustration_score ?? 0));
  if (maxFrustration === 0) return null;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm">Frustration Timeline — Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="frustGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="bucket" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip {...tip} />
              <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="4 2" />
              <Area
                type="monotone"
                dataKey="avg_frustration_score"
                name="Avg Frustration"
                stroke="#f97316"
                fill="url(#frustGrad)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="max_frustration_score"
                name="Peak Frustration"
                stroke="#dc2626"
                fill="none"
                strokeWidth={1}
                strokeDasharray="4 2"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {data.some(d => (d.rage_click_count ?? 0) > 0) && (
          <p className="text-xs text-orange-400 mt-2">
            Rage clicks detected:{' '}
            {data.reduce((sum, d) => sum + (d.rage_click_count ?? 0), 0)} total
          </p>
        )}
      </CardContent>
    </Card>
  );
}
