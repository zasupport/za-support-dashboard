'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = ['pending', 'sent', 'paid', 'overdue'] as const;
type Status = typeof STATUS_OPTIONS[number];

const COLOUR: Record<Status, string> = {
  pending: 'bg-slate-700 text-slate-300 hover:bg-slate-600',
  sent:    'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60',
  paid:    'bg-teal-900/40 text-teal-300 hover:bg-teal-900/60',
  overdue: 'bg-red-900/40 text-red-300 hover:bg-red-900/60',
};

export function BillingStatusButton({ billingId, currentStatus }: { billingId: number; currentStatus: Status }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function cycleStatus() {
    const next = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(status) + 1) % STATUS_OPTIONS.length];
    setLoading(true);
    try {
      const res = await fetch(`/api/cybershield?_path=billing/${billingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={cycleStatus}
      disabled={loading}
      className={`text-xs px-2 py-0.5 rounded-full transition-colors disabled:opacity-40 cursor-pointer ${COLOUR[status]}`}
      title="Click to cycle status"
    >
      {loading ? '…' : status}
    </button>
  );
}
