'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DescriptionEditor({ jobRef, initialDescription }: { jobRef: string; initialDescription?: string | null }) {
  const router = useRouter();
  const [editing, setEditing]         = useState(false);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workshop/${encodeURIComponent(jobRef)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Failed to save description.');
      }
    } catch {
      setError('Network error — could not save description.');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        {description && (
          <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{description}</p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-teal-400 transition-colors"
        >
          {description ? 'Edit description' : '+ Add description'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={6}
        autoFocus
        className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 resize-y placeholder:text-slate-500"
        placeholder="Add job description..."
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
          {saving ? 'Saving…' : 'Save Description'}
        </button>
        <button
          onClick={() => { setDescription(initialDescription ?? ''); setEditing(false); setError(null); }}
          className="text-xs px-3 py-1.5 rounded text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
