import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobActions } from './JobActions';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

async function fetchJob(jobRef: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/workshop/jobs/${jobRef}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

const STATUS_STYLE: Record<string, string> = {
  open:           'bg-slate-600/40 text-slate-300 border-slate-600',
  in_progress:    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  waiting_parts:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  completed:      'bg-green-500/20 text-green-300 border-green-500/30',
  done:           'bg-green-500/20 text-green-300 border-green-500/30',
  cancelled:      'bg-slate-500/20 text-slate-500 border-slate-600',
};

const PRIORITY_STYLE: Record<string, string> = {
  low:    'text-slate-400',
  normal: 'text-slate-300',
  high:   'text-orange-400',
  urgent: 'text-red-400 font-bold',
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex gap-4 py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-500 text-xs w-36 shrink-0">{label}</span>
      <span className="text-slate-200 text-xs">{String(value)}</span>
    </div>
  );
}

export default async function JobDetailPage({ params }: { params: { job_ref: string } }) {
  const job = await fetchJob(params.job_ref);
  if (!job) notFound();

  const isDone = job.status === 'done' || job.status === 'completed';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/workshop" className="text-slate-400 text-xs hover:text-white mb-1 block">← Workshop</Link>
          <h1 className="text-xl font-bold text-white leading-snug">{job.title}</h1>
          <p className="text-slate-400 text-sm font-mono mt-0.5">{job.job_ref}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-3 py-1 rounded border font-medium ${STATUS_STYLE[job.status] ?? STATUS_STYLE.open}`}>
            {job.status.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span className={`text-xs ${PRIORITY_STYLE[job.priority] ?? 'text-slate-400'}`}>
            {job.priority.toUpperCase()} priority
          </span>
        </div>
      </div>

      {/* Actions */}
      <JobActions jobRef={job.job_ref} currentStatus={job.status} scheduledDate={job.scheduled_date} />

      {/* Job details */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Job Details</CardTitle></CardHeader>
        <CardContent className="space-y-0">
          <Row label="Client"
            value={job.client_id}
          />
          {job.client_id && (
            <div className="flex gap-4 py-1.5 border-b border-slate-700/50">
              <span className="text-slate-500 text-xs w-36 shrink-0">Client profile</span>
              <Link href={`/clients/${job.client_id}`} className="text-teal-400 text-xs hover:text-teal-300">
                {job.client_id} →
              </Link>
            </div>
          )}
          <Row label="Device serial"     value={job.serial} />
          <Row label="Source"            value={job.source === 'auto_diagnostic' ? 'Auto (Scout diagnostic)' : 'Manual'} />
          <Row label="Assigned to"       value={job.assigned_to} />
          <Row label="Scheduled date"    value={job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString('en-ZA') : null} />
          <Row label="Labour (minutes)"  value={job.labour_minutes} />
          <Row label="Total incl. VAT"   value={job.total_incl_vat != null ? `R ${Number(job.total_incl_vat).toFixed(2)}` : null} />
          <Row label="Created"           value={new Date(job.created_at).toLocaleString('en-ZA')} />
          {isDone && job.completed_at && (
            <Row label="Completed" value={new Date(job.completed_at).toLocaleString('en-ZA')} />
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {job.description && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {job.notes && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{job.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      {job.line_items?.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Line Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Unit Price</th>
                  <th className="text-right px-4 py-2">Total</th>
                  <th className="text-left px-4 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {job.line_items.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-700/40 last:border-0">
                    <td className="px-4 py-2 text-slate-200">{item.description}</td>
                    <td className="px-4 py-2 text-right text-slate-400">{item.qty}</td>
                    <td className="px-4 py-2 text-right text-slate-400">
                      {item.unit_price != null ? `R ${Number(item.unit_price).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-white font-medium">
                      {item.line_total != null ? `R ${Number(item.line_total).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-500 capitalize">{item.item_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Status history */}
      {job.history?.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Status History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[...job.history].reverse().map((h: any) => (
              <div key={h.id} className="flex items-start gap-3 text-xs">
                <span className="text-slate-500 shrink-0">{new Date(h.changed_at).toLocaleString('en-ZA')}</span>
                <span className="text-slate-400">
                  {h.from_status ? `${h.from_status.replace(/_/g, ' ')} → ` : ''}{h.to_status.replace(/_/g, ' ')}
                </span>
                {h.note && <span className="text-slate-500 italic">{h.note}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
