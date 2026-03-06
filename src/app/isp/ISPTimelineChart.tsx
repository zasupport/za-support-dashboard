'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type OutageEntry = {
  isp_name?: string;
  provider_id?: number;
  started_at?: string;
  ended_at?: string;
  severity?: string;
};

type DayBucket = {
  date: string;
  critical: number;
  high: number;
  degraded: number;
};

function buildDailyBuckets(outages: OutageEntry[]): DayBucket[] {
  // Build 30-day window ending today
  const buckets: Record<string, DayBucket> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
    buckets[key] = { date: key, critical: 0, high: 0, degraded: 0 };
  }

  for (const o of outages) {
    if (!o.started_at) continue;
    const d = new Date(o.started_at);
    const key = d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
    if (!buckets[key]) continue;
    const sev = (o.severity || 'degraded').toLowerCase();
    if (sev === 'critical') buckets[key].critical += 1;
    else if (sev === 'high') buckets[key].high += 1;
    else buckets[key].degraded += 1;
  }

  return Object.values(buckets);
}

export function ISPTimelineChart({ outages }: { outages: OutageEntry[] }) {
  if (outages.length === 0) return null;

  const data = buildDailyBuckets(outages);
  const hasAny = data.some(d => d.critical + d.high + d.degraded > 0);
  if (!hasAny) return null;

  const tip = {
    contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6 },
    labelStyle: { color: '#94a3b8', fontSize: 11 },
    itemStyle: { fontSize: 11 },
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm">Outage Frequency — Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 9 }}
                interval={4}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip {...tip} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
                iconType="square"
                iconSize={10}
              />
              <Bar dataKey="critical" stackId="a" name="Critical" fill="#ef4444" />
              <Bar dataKey="high"     stackId="a" name="High"     fill="#f97316" />
              <Bar dataKey="degraded" stackId="a" name="Degraded" fill="#eab308" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
