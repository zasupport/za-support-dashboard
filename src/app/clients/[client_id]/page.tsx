import { fetchClient, fetchClientTasks, fetchClientCheckins } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskChecklist } from './TaskChecklist';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function Row({ label, value }: { label: string; value?: string | boolean | null }) {
  if (!value && value !== false) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  return (
    <div className="flex gap-4 py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-500 text-xs w-40 shrink-0">{label}</span>
      <span className="text-slate-200 text-xs">{display}</span>
    </div>
  );
}

export default async function ClientDetailPage({ params }: { params: { client_id: string } }) {
  const [client, tasks, checkins] = await Promise.all([
    fetchClient(params.client_id),
    fetchClientTasks(params.client_id),
    fetchClientCheckins(params.client_id),
  ]);

  if (!client) notFound();

  const isUrgent = client.urgency_level?.toLowerCase().startsWith('urgent');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-slate-400 text-xs hover:text-white mb-1 block">← All Clients</Link>
          <Link href={`/clients/${client.client_id}/brief`} className="text-teal-400 text-xs hover:text-teal-300 mb-1 block">Site Visit Brief →</Link>
          <h1 className="text-2xl font-bold text-white">{client.first_name} {client.last_name}</h1>
          <p className="text-slate-400 text-sm font-mono mt-0.5">{client.client_id}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {isUrgent && (
            <span className="text-xs px-3 py-1 rounded-full border bg-red-500/20 text-red-300 border-red-500/30 font-medium">URGENT</span>
          )}
          {client.has_business && (
            <span className="text-xs px-3 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30 font-medium">Has Business</span>
          )}
          <span className="text-xs px-3 py-1 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/30 font-medium capitalize">{client.status}</span>
        </div>
      </div>

      {/* Urgent / business action banners */}
      {isUrgent && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          This client marked their request as <strong>URGENT</strong> — action required today.
        </div>
      )}
      {client.has_business && (
        <div className="rounded-md border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-purple-300 text-sm">
          <strong>Business opportunity:</strong> {client.business_name || 'Client has a business'} — offer SME Health Check assessment.
          {client.business_health_check_interest && ` Interest level: ${client.business_health_check_interest}.`}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Contact details */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <Row label="Email"              value={client.email} />
            <Row label="Phone"              value={client.phone} />
            <Row label="Preferred contact"  value={client.preferred_contact} />
            <Row label="Address"            value={client.address} />
            <Row label="Referral source"    value={client.referral_source} />
            <Row label="Referred by"        value={client.referred_by} />
            <Row label="Joined"             value={client.created_at ? new Date(client.created_at).toLocaleDateString('en-ZA') : undefined} />
          </CardContent>
        </Card>

        {/* Concerns */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">What They Need</CardTitle></CardHeader>
          <CardContent>
            <Row label="Urgency" value={client.urgency_level} />
            {client.concerns && client.concerns.length > 0 && (
              <div className="py-1.5 border-b border-slate-700/50">
                <p className="text-slate-500 text-xs mb-1">Concerns</p>
                <ul className="space-y-0.5">
                  {client.concerns.map((c: string, i: number) => (
                    <li key={i} className="text-slate-200 text-xs">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
            {client.concerns_detail && (
              <div className="py-1.5">
                <p className="text-slate-500 text-xs mb-1">In their own words</p>
                <p className="text-slate-300 text-xs italic">"{client.concerns_detail}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business section (if applicable) */}
      {client.has_business && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Business Details</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <Row label="Business name"    value={client.business_name} />
            <Row label="Industry / type"  value={client.business_type} />
            <Row label="Staff count"      value={client.business_staff_count} />
            <Row label="Devices in biz"   value={client.business_device_count} />
            <Row label="HC interest"      value={client.business_health_check_interest} />
          </CardContent>
        </Card>
      )}

      {/* Report download */}
      <div className="flex items-center gap-3">
        <a
          href={`/api/reports/${client.client_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
        >
          Download CyberPulse Report (PDF)
        </a>
        <span className="text-slate-500 text-xs">Generated from latest Scout diagnostic</span>
      </div>

      {/* Onboarding tasks — interactive checklist */}
      <TaskChecklist initialTasks={tasks as any[]} clientId={client.client_id} />

      {/* Pre-visit check-ins */}
      {(checkins as any[]).length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Pre-Visit Check-Ins</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(checkins as any[]).map((ci: any) => (
              <div key={ci.id} className="border border-slate-700 rounded-md p-3 space-y-2">
                <p className="text-slate-400 text-xs">{new Date(ci.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                {ci.focus_today && <Row label="Focus today"       value={ci.focus_today} />}
                {ci.issues_noted && <Row label="Issues reported"  value={ci.issues_noted} />}
                {ci.changes_since_last && <Row label="Changes"    value={ci.changes_since_last} />}
                {ci.backup_drive_connected && <Row label="Backup drive" value={ci.backup_drive_connected} />}
                {ci.pre_visit_notes && <Row label="Notes"         value={ci.pre_visit_notes} />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
