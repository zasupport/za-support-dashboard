import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrintButton } from './PrintButton';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

async function fetchBrief(client_id: string) {
  const res = await fetch(`${API_URL}/api/v1/clients/${client_id}/brief`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="flex gap-4 py-1 border-b border-slate-700/40 last:border-0">
      <span className="text-slate-500 text-xs w-44 shrink-0">{label}</span>
      <span className="text-slate-200 text-xs">{display}</span>
    </div>
  );
}

function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  const l = level.toLowerCase();
  const cls = l === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30'
    : l === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    : l === 'moderate' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    : 'bg-green-500/20 text-green-300 border-green-500/30';
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium uppercase ${cls}`}>{level}</span>
  );
}

export default async function SiteVisitBriefPage({ params }: { params: { client_id: string } }) {
  const brief = await fetchBrief(params.client_id);
  if (!brief) notFound();

  const { client, devices, open_tasks, completed_task_count, latest_checkin, open_workshop_jobs } = brief;
  const isUrgent = client.urgency_level?.toLowerCase().startsWith('urgent');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Print header */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <Link href={`/clients/${client.client_id}`} className="text-slate-400 text-xs hover:text-white mb-1 block">← Client Profile</Link>
          <h1 className="text-2xl font-bold text-white">Site Visit Brief</h1>
          <p className="text-slate-400 text-sm mt-0.5">{client.first_name} {client.last_name}</p>
        </div>
        <PrintButton />
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-bold">ZA Support — Site Visit Brief</h1>
        <p className="text-sm text-gray-500">Practice IT. Perfected. | admin@zasupport.com | 064 529 5863</p>
        <hr className="mt-2" />
      </div>

      {/* Alerts */}
      {isUrgent && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          URGENT — client flagged this as urgent. Action required.
        </div>
      )}

      {/* Client overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Client</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8">
          <div>
            <Row label="Name" value={`${client.first_name} ${client.last_name}`} />
            <Row label="Client ID" value={client.client_id} />
            <Row label="Status" value={client.status} />
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone} />
            <Row label="Preferred contact" value={client.preferred_contact} />
          </div>
          <div>
            <Row label="Urgency" value={client.urgency_level} />
            <Row label="Address" value={client.address} />
            <Row label="Referral" value={client.referral_source} />
            <Row label="Has business" value={client.has_business} />
            {client.has_business && <Row label="Business name" value={client.business_name} />}
            {client.has_business && <Row label="Industry" value={client.business_type} />}
          </div>
        </CardContent>
      </Card>

      {/* Concerns */}
      {(client.concerns?.length > 0 || client.concerns_detail) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">What They Need</CardTitle></CardHeader>
          <CardContent>
            {client.concerns?.length > 0 && (
              <ul className="space-y-1 mb-3">
                {client.concerns.map((c: string, i: number) => (
                  <li key={i} className="text-slate-200 text-xs">• {c}</li>
                ))}
              </ul>
            )}
            {client.concerns_detail && (
              <p className="text-slate-300 text-xs italic">"{client.concerns_detail}"</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Devices */}
      {devices.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Devices ({devices.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {devices.map((dev: any) => (
              <div key={dev.serial} className="border border-slate-700 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-white text-sm font-medium">{dev.hostname || dev.serial}</span>
                    <span className="text-slate-400 text-xs ml-2 font-mono">{dev.serial}</span>
                  </div>
                  {dev.latest_snapshot && <RiskBadge level={dev.latest_snapshot.risk_level} />}
                </div>
                <div className="grid grid-cols-3 gap-x-6">
                  <Row label="Model" value={dev.model} />
                  <Row label="Chip" value={dev.chip_type?.replace('_', ' ')} />
                  <Row label="RAM" value={dev.ram_gb ? `${dev.ram_gb} GB` : null} />
                  <Row label="Storage" value={dev.storage_gb ? `${dev.storage_gb} GB` : null} />
                  <Row label="macOS" value={dev.macos_version} />
                  <Row label="Last seen" value={dev.last_seen ? new Date(dev.last_seen).toLocaleDateString('en-ZA') : null} />
                </div>
                {dev.latest_snapshot && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex gap-6">
                    <span className="text-slate-400 text-xs">Last scan: {new Date(dev.latest_snapshot.scan_date).toLocaleString('en-ZA')}</span>
                    <span className="text-slate-400 text-xs">Risk score: <span className="text-white">{dev.latest_snapshot.risk_score ?? '—'}</span></span>
                    <span className="text-slate-400 text-xs">Recommendations: <span className="text-white">{dev.latest_snapshot.recommendation_count ?? 0}</span></span>
                  </div>
                )}
                {!dev.latest_snapshot && (
                  <p className="text-slate-500 text-xs mt-2">No diagnostic snapshot on file</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Latest check-in */}
      {latest_checkin && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Latest Check-In</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-400 text-xs mb-3">{new Date(latest_checkin.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <Row label="Focus today" value={latest_checkin.focus_today} />
            <Row label="Issues reported" value={latest_checkin.issues_noted} />
            <Row label="Changes since last" value={latest_checkin.changes_since_last} />
            <Row label="Backup drive" value={latest_checkin.backup_drive_connected} />
            <Row label="Notes" value={latest_checkin.pre_visit_notes} />
          </CardContent>
        </Card>
      )}

      {/* Open workshop jobs */}
      {open_workshop_jobs.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Open Workshop Jobs ({open_workshop_jobs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {open_workshop_jobs.map((job: any) => (
              <div key={job.job_ref} className="flex items-start justify-between py-2 border-b border-slate-700/40 last:border-0">
                <div>
                  <p className="text-white text-xs font-medium">{job.title}</p>
                  <p className="text-slate-500 text-xs">{job.job_ref} · {job.status} · {job.priority}</p>
                </div>
                {job.source === 'auto' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">Auto</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Onboarding checklist summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Onboarding Checklist</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-400 text-xs mb-3">{completed_task_count} completed · {open_tasks.length} remaining</p>
          {open_tasks.length > 0 && (
            <ul className="space-y-1.5">
              {open_tasks.map((task: any) => (
                <li key={task.id} className="flex items-start gap-2">
                  <span className="text-slate-600 text-xs mt-0.5">☐</span>
                  <span className="text-slate-300 text-xs">{task.task}</span>
                </li>
              ))}
            </ul>
          )}
          {open_tasks.length === 0 && (
            <p className="text-green-400 text-xs">All onboarding tasks complete.</p>
          )}
        </CardContent>
      </Card>

      {/* Report links */}
      <div className="flex gap-3 flex-wrap">
        <a
          href={`/api/reports/${client.client_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors print:hidden"
        >
          Download CyberPulse Report
        </a>
        <Link
          href={`/clients/${client.client_id}`}
          className="text-xs px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors print:hidden"
        >
          Full Client Profile
        </Link>
      </div>
    </div>
  );
}
