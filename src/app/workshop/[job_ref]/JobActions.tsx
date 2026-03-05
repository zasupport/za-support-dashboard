'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

const STATUS_NEXT: Record<string, string> = {
  open:          'in_progress',
  in_progress:   'waiting_parts',
  waiting_parts: 'completed',
};

const STATUS_NEXT_LABEL: Record<string, string> = {
  open:          'Start Job',
  in_progress:   'Waiting on Parts',
  waiting_parts: 'Mark Done',
};

export function JobActions({ jobRef, currentStatus }: { jobRef: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (currentStatus === 'completed' || currentStatus === 'done' || currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle size={16} />
        {currentStatus === 'cancelled' ? 'Cancelled' : 'Job complete'}
      </div>
    );
  }

  async function advance(status: string) {
    setLoading(status);
    try {
      const res = await fetch(`/api/workshop/${jobRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const nextStatus = STATUS_NEXT[currentStatus];
  const nextLabel  = STATUS_NEXT_LABEL[currentStatus];

  return (
    <div className="flex gap-3">
      {nextStatus && (
        <button
          onClick={() => advance(nextStatus)}
          disabled={!!loading}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-50"
        >
          {loading === nextStatus ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          {nextLabel}
        </button>
      )}
      {/* Always show direct Mark Done */}
      {currentStatus !== 'waiting_parts' && (
        <button
          onClick={() => advance('completed')}
          disabled={!!loading}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-green-700 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50"
        >
          {loading === 'completed' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Mark Done
        </button>
      )}
      <button
        onClick={() => advance('cancelled')}
        disabled={!!loading}
        className="text-xs px-3 py-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 transition-colors disabled:opacity-50"
      >
        Cancel Job
      </button>
    </div>
  );
}
