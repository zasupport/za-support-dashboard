'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Loader2 } from 'lucide-react';

interface Props {
  serial?: string | null;
  clientId?: string | null;
  eventType?: string | null;
  severity?: string | null;
}

export function ShieldJobButton({ serial, clientId, eventType, severity }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createJob() {
    if (!clientId) return;
    setLoading(true);
    try {
      const title = `Shield alert: ${eventType || 'security event'}${serial ? ` — ${serial}` : ''}`;
      const priority = severity === 'CRITICAL' ? 'urgent' : severity === 'HIGH' ? 'high' : 'normal';
      const res = await fetch('/api/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:   clientId,
          title,
          priority,
          serial:      serial || undefined,
          description: `Automatically created from Shield event: ${eventType}.\nSeverity: ${severity}.`,
          line_items:  [],
        }),
      });
      if (res.ok) {
        const job = await res.json();
        router.push(`/workshop/${job.job_ref}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!clientId) return null;

  return (
    <button
      onClick={createJob}
      disabled={loading}
      title="Create workshop job from this event"
      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700 hover:bg-teal-700 text-slate-300 hover:text-white border border-slate-600 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Wrench size={11} />}
      Job
    </button>
  );
}
