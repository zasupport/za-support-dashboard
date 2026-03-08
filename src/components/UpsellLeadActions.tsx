'use client';

import { useState } from 'react';

type Status = 'pending' | 'contacted' | 'won' | 'dismissed';

const STATUS_CONFIG: Record<string, { label: string; badge: string; cls: string }> = {
  contacted: { label: 'Contacted', badge: '📞 Contacted', cls: 'bg-blue-800/60 border-blue-700/40 text-blue-300' },
  won:       { label: 'Won ✓',     badge: '✓ Won',        cls: 'bg-emerald-800/60 border-emerald-700/40 text-emerald-300' },
  dismissed: { label: 'Skipped',   badge: 'Skipped',      cls: 'bg-slate-700/60 border-slate-600/40 text-slate-400' },
};

export function UpsellLeadActions({
  recId,
  phone,
  waHref,
  initialStatus = 'pending',
}: {
  recId: string;
  phone: string;
  waHref: string;
  initialStatus?: string;
}) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/sales/recommendations/${recId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(newStatus);
    } catch {
      // fail silently — optimistic update already shown
    } finally {
      setLoading(false);
    }
  }

  if (status !== 'pending') {
    const cfg = STATUS_CONFIG[status];
    return (
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg?.cls ?? ''}`}>
          {cfg?.badge ?? status}
        </span>
        <button
          onClick={() => updateStatus('pending')}
          className="text-xs text-slate-500 hover:text-slate-300 px-1"
          title="Reopen lead"
        >
          ↺
        </button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 flex items-center gap-1.5">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => updateStatus('contacted')}
        className="text-xs px-2.5 py-1 rounded-full bg-green-800/50 hover:bg-green-700/60 text-green-300 hover:text-white border border-green-700/40 transition-colors whitespace-nowrap"
      >
        Pitch →
      </a>
      <button
        disabled={loading}
        onClick={() => updateStatus('won')}
        className="text-xs px-2 py-1 rounded-full bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-400 hover:text-emerald-200 border border-emerald-700/30 transition-colors"
        title="Mark as won"
      >
        Won
      </button>
      <button
        disabled={loading}
        onClick={() => updateStatus('dismissed')}
        className="text-xs px-1.5 py-1 rounded-full text-slate-500 hover:text-slate-300 transition-colors"
        title="Dismiss lead"
      >
        ✕
      </button>
    </div>
  );
}
