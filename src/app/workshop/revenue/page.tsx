import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';

export const revalidate = 300; // ISR: revenue data, revalidate every 5 minutes

async function fetchRevenue() {
  try {
    const res = await fetch(
      `${process.env.ZA_API_URL || 'https://api.zasupport.com'}/api/v1/workshop/revenue`,
      { headers: { 'X-API-Key': (process.env.ZA_API_TOKEN || '') }, cache: 'no-store' }
    );
    return res.ok ? res.json() : null;
  } catch { return null; }
}

function StatCard({ label, value, sub, colour = 'text-white' }: { label: string; value: string; sub?: string; colour?: string }) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${colour}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function R(v: number) {
  return `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function WorkshopRevenuePage() {
  const d = await fetchRevenue();

  const totalRev    = d?.total_revenue    ?? 0;
  const pipeline    = d?.pipeline_value   ?? 0;
  const thisMonth   = d?.revenue_this_month ?? 0;
  const totalJobs   = d?.total_jobs       ?? 0;
  const completed   = d?.completed_jobs   ?? 0;
  const open        = d?.open_jobs        ?? 0;
  const labourMins  = d?.total_labour_minutes ?? 0;
  const labourHrs   = Math.round(labourMins / 60 * 10) / 10;
  const avgJobValue = completed > 0 ? totalRev / completed : 0;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={300000} />
      <div>
        <Link href="/workshop" className="text-slate-400 text-xs hover:text-white mb-1 block">← Workshop Board</Link>
        <h1 className="text-2xl font-bold text-white">Workshop Revenue</h1>
        <p className="text-slate-400 text-sm mt-0.5">Completed job earnings, pipeline, and labour summary</p>
      </div>

      {!d && (
        <p className="text-slate-500 text-sm">No revenue data available yet.</p>
      )}

      {d && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Revenue This Month" value={R(thisMonth)} colour="text-green-400" />
            <StatCard label="Total Earned (All Time)" value={R(totalRev)} colour="text-teal-400" sub={`${completed} completed job${completed !== 1 ? 's' : ''}`} />
            <StatCard label="Pipeline (Open Jobs)" value={R(pipeline)} colour="text-yellow-400" sub={`${open} open job${open !== 1 ? 's' : ''}`} />
            <StatCard label="Avg Job Value" value={R(avgJobValue)} colour="text-slate-300" sub="completed jobs only" />
          </div>

          {/* Secondary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Jobs Created" value={String(totalJobs)} />
            <StatCard label="Completed Jobs" value={String(completed)} colour="text-green-400" />
            <StatCard label="Open / In Progress" value={String(open)} colour="text-yellow-400" />
            <StatCard label="Labour Logged" value={`${labourHrs} hrs`} colour="text-slate-300" sub={`${labourMins} minutes total`} />
          </div>

          {/* VAT note */}
          <p className="text-slate-500 text-xs">All values include 15% VAT. Revenue reflects completed and done jobs only.</p>
        </>
      )}
    </div>
  );
}
