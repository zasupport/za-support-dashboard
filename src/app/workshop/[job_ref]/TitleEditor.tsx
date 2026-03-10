'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TitleEditor({ jobRef, initialTitle }: { jobRef: string; initialTitle: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(initialTitle);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function save() {
    if (!title.trim()) { setError('Title cannot be empty.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workshop/${encodeURIComponent(jobRef)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Failed to save title.');
      }
    } catch {
      setError('Network error — could not save title.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') { setTitle(initialTitle); setEditing(false); setError(null); }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-left group"
        title="Click to edit title"
      >
        <h1 className="text-xl font-bold text-white leading-snug group-hover:text-teal-300 transition-colors">
          {title}
        </h1>
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full bg-slate-700/50 border border-teal-500 rounded-md px-3 py-1.5 text-xl font-bold text-white focus:outline-none"
        placeholder="Job title"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => { setTitle(initialTitle); setEditing(false); setError(null); }}
          className="text-xs px-3 py-1.5 rounded text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
