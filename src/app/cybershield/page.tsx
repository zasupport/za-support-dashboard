import Link from 'next/link';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const h = { Authorization: `Bearer ${API_TOKEN}` };

async function fetchSummary() {
  try {
    const res = await fetch(`${API_URL}/api/v1/cybershield/summary`, { headers: h, cache: 'no-store' });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

async function fetchEnrollments() {
  try {
    const res = await fetch(`${API_URL}/api/v1/cybershield/enrollments?per_page=100`, { headers: h, cache: 'no-store' });
    return res.ok ? (await res.json()).data ?? [] : [];
  } catch { return []; }
}

async function fetchReports() {
  try {
    const res = await fetch(`${API_URL}/api/v1/cybershield/reports?per_page=10`, { headers: h, cache: 'no-store' });
    return res.ok ? (await res.json()).data ?? [] : [];
  } catch { return []; }
}


function fmt(v: number | null | undefined, prefix = '') {
  if (v == null) return '—';
  return `${prefix}${v.toLocaleString()}`;
}

export default async function CyberShieldPage() {
  const [summary, enrollments, reports] = await Promise.all([
    fetchSummary(), fetchEnrollments(), fetchReports(),
  ]);

  const arr = summary?.monthly_arr ? Number(summary.monthly_arr).toLocaleString('en-ZA', { minimumFractionDigits: 0 }) : '0';

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CyberShield</h1>
          <p className="text-slate-400 text-sm mt-1">Network security service — R 1,499/month per practice</p>
        </div>
        <Link
          href="/cybershield/new"
          className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          + Enroll Practice
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Practices', value: fmt(summary?.active_subscriptions), colour: 'text-teal-400' },
          { label: 'Total Enrolled', value: fmt(summary?.total_subscriptions), colour: 'text-slate-300' },
          { label: 'Monthly ARR', value: `R ${arr}`, colour: 'text-green-400' },
          { label: 'Reports Generated', value: fmt(summary?.reports_generated), colour: 'text-slate-300' },
        ].map(({ label, value, colour }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${colour}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Enrollments Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Enrolled Practices</h2>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">No practices enrolled yet. Enroll a client above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 bg-slate-900/40">
              <tr>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Practice</th>
                <th className="text-left px-4 py-3">ISP</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Monthly Fee</th>
                <th className="text-left px-4 py-3">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e: any, i: number) => (
                <tr key={e.id} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/clients/${e.client_id}`} className="text-teal-400 hover:text-teal-300">
                      {e.client_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{e.practice_name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{e.isp_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${e.active ? 'bg-teal-900/40 text-teal-300' : 'bg-slate-700 text-slate-400'}`}>
                      {e.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    R {Number(e.monthly_fee ?? 1499).toLocaleString()}/mo
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('en-ZA') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Reports */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Recent Monthly Reports</h2>
        </div>
        {reports.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">No reports generated yet. Reports are auto-generated on the 1st of each month.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 bg-slate-900/40">
              <tr>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Period</th>
                <th className="text-left px-4 py-3">Filename</th>
                <th className="text-left px-4 py-3">Generated</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any, i: number) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/clients/${r.client_id}`} className="text-teal-400 hover:text-teal-300">
                      {r.client_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{r.month_label ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{r.filename}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(r.generated_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
