'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Loader2 } from 'lucide-react';

export function AlertActions({
  clientId,
  serial,
  title,
}: {
  clientId: string | null;
  serial: string | null;
  title: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  if (!clientId) return null;

  async function createJob() {
    setCreating(true);
    try {
      const res = await fetch('/api/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:  clientId,
          serial:     serial || undefined,
          title,
          priority:   'high',
          line_items: [],
        }),
      });
      if (res.ok) {
        const job = await res.json();
        router.push(`/workshop/${job.job_ref}`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <button
      onClick={createJob}
      disabled={creating}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-40"
      title="Create workshop job"
    >
      {creating ? <Loader2 size={11} className="animate-spin" /> : <Wrench size={11} />}
      Job
    </button>
  );
}
