'use client';
import { useState } from 'react';

const STATUSES = ['new', 'active', 'sla', 'inactive'] as const;

const STATUS_COLORS: Record<string, string> = {
  new:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  active:   'bg-green-500/20 text-green-300 border-green-500/30',
  sla:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export function StatusUpdater({ clientId, currentStatus }: { clientId: string; currentStatus: string }) {
  const [status, setStatus]   = useState(currentStatus);
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState(false);

  async function update(newStatus: string) {
    if (newStatus === status) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
      }
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`text-xs px-3 py-1 rounded-full border font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
      >
        {status}
      </button>
    );
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {STATUSES.map(s => (
        <button
          key={s}
          onClick={() => update(s)}
          disabled={saving}
          className={`text-xs px-3 py-1 rounded-full border font-medium capitalize transition-opacity disabled:opacity-50 ${
            s === status
              ? STATUS_COLORS[s]
              : 'bg-slate-700 text-slate-400 border-slate-600 hover:text-white'
          }`}
        >
          {s}
        </button>
      ))}
      <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-white px-1">✕</button>
    </div>
  );
}
