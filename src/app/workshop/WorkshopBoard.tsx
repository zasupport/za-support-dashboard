'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

type Job = {
  id: number;
  job_ref: string;
  client_id: string;
  serial?: string;
  title: string;
  status: string;
  priority: string;
  source: string;
  scheduled_date?: string;
  created_at: string;
};

const STATUS_CYCLE: Record<string, string> = {
  open:          'in_progress',
  in_progress:   'waiting_parts',
  waiting_parts: 'completed',
};

const STATUS_STYLE: Record<string, string> = {
  open:          'bg-slate-600/40 text-slate-300 border-slate-600',
  in_progress:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  waiting_parts: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  completed:     'bg-green-500/20 text-green-300 border-green-500/30',
  done:          'bg-green-500/20 text-green-300 border-green-500/30',
  cancelled:     'bg-slate-500/20 text-slate-500 border-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  open:          'Open',
  in_progress:   'In Progress',
  waiting_parts: 'Waiting Parts',
  completed:     'Done',
  done:          'Done',
  cancelled:     'Cancelled',
};

const PRIORITY_STYLE: Record<string, string> = {
  low:    'text-slate-500',
  normal: 'text-slate-400',
  high:   'text-orange-400',
  urgent: 'text-red-400 font-bold',
};

const SOURCE_BADGE: Record<string, string> = {
  auto_diagnostic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  manual:          'bg-slate-600/30 text-slate-400 border-slate-600',
};

export function WorkshopBoard({
  initialJobs,
  clientNames = {},
}: {
  initialJobs: Job[];
  clientNames?: Record<string, string>;
}) {
  const [jobs, setJobs]     = useState<Job[]>(initialJobs);
  const [saving, setSaving] = useState<string | null>(null);

  async function patchStatus(job: Job, status: string) {
    setSaving(`${job.job_ref}:${status}`);
    try {
      const res = await fetch(`/api/workshop/${job.job_ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setJobs(prev => prev.map(j => j.job_ref === job.job_ref ? { ...j, ...updated } : j));
      }
    } finally {
      setSaving(null);
    }
  }

  function cycleStatus(job: Job) {
    const next = STATUS_CYCLE[job.status] ?? 'completed';
    patchStatus(job, next);
  }

  const open      = jobs.filter(j => j.status === 'open');
  const progress  = jobs.filter(j => j.status === 'in_progress');
  const waiting   = jobs.filter(j => j.status === 'waiting_parts');
  const completed = jobs.filter(j => j.status === 'completed' || j.status === 'done');

  function JobCard({ job }: { job: Job }) {
    const clientName = clientNames[job.client_id] ?? job.client_id;
    const isSaving   = saving?.startsWith(job.job_ref);
    const isDone     = job.status === 'completed' || job.status === 'done' || job.status === 'cancelled';

    return (
      <div className="border border-slate-700 rounded-md p-3 bg-slate-800/60 space-y-2 hover:border-slate-600 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/workshop/${job.job_ref}`}
            className="text-xs text-white font-medium leading-snug flex-1 hover:text-teal-400 transition-colors"
          >
            {job.title}
          </Link>
          <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${SOURCE_BADGE[job.source] ?? SOURCE_BADGE.manual}`}>
            {job.source === 'auto_diagnostic' ? 'Auto' : 'Manual'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href={`/clients/${job.client_id}`} className="hover:text-teal-400 transition-colors">
            {clientName}
          </Link>
          {job.serial && (
            <>
              <span>·</span>
              <Link href={`/devices/${job.serial}`} className="font-mono hover:text-teal-400 transition-colors">
                {job.serial}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${PRIORITY_STYLE[job.priority] ?? 'text-slate-400'}`}>
            {job.priority.toUpperCase()}
          </span>
          <div className="flex items-center gap-1">
            {/* Direct "Done" button for non-done jobs */}
            {!isDone && job.status !== 'waiting_parts' && (
              <button
                onClick={() => patchStatus(job, 'completed')}
                disabled={!!isSaving}
                title="Mark done"
                className="text-slate-600 hover:text-green-400 transition-colors disabled:opacity-40 p-0.5"
              >
                {saving === `${job.job_ref}:completed` ? '…' : <CheckCircle size={13} />}
              </button>
            )}
            {/* Cycle button */}
            <button
              onClick={() => cycleStatus(job)}
              disabled={isSaving || isDone}
              className={`text-xs px-2 py-0.5 rounded border font-medium cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed ${STATUS_STYLE[job.status] ?? STATUS_STYLE.open}`}
            >
              {isSaving && saving !== `${job.job_ref}:completed` ? '...' : STATUS_LABEL[job.status] ?? job.status}
            </button>
          </div>
        </div>

        {job.scheduled_date && (
          <p className="text-xs text-slate-500">
            Scheduled: {new Date(job.scheduled_date).toLocaleDateString('en-ZA')}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Link
            href={`/workshop/${job.job_ref}`}
            className="text-xs text-slate-600 hover:text-slate-400 font-mono transition-colors"
          >
            {job.job_ref}
          </Link>
        </div>
      </div>
    );
  }

  const cols: [string, Job[], string][] = [
    ['Open',          open,      'text-slate-300'],
    ['In Progress',   progress,  'text-yellow-300'],
    ['Waiting Parts', waiting,   'text-orange-300'],
    ['Completed',     completed, 'text-green-300'],
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cols.map(([label, colJobs, color]) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${color}`}>{label}</h3>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{colJobs.length}</span>
          </div>
          <div className="space-y-3">
            {colJobs.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-4">None</p>
            ) : (
              colJobs.map(job => <JobCard key={job.job_ref} job={job} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
