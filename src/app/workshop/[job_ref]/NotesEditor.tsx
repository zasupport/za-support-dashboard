'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NotesEditor({ jobRef, initialNotes }: { jobRef: string; initialNotes?: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes]     = useState(initialNotes ?? '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workshop/${encodeURIComponent(jobRef)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Failed to save notes.');
      }
    } catch {
      setError('Network error — could not save notes.');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        {notes && (
          <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{notes}</p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-teal-400 transition-colors"
        >
          {notes ? 'Edit notes' : '+ Add notes'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={5}
        autoFocus
        className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 resize-y placeholder:text-slate-500"
        placeholder="Add job notes..."
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Save Notes'}
        </button>
        <button
          onClick={() => { setNotes(initialNotes ?? ''); setEditing(false); setError(null); }}
          className="text-xs px-3 py-1.5 rounded text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
