'use client';
import { useState, useEffect } from 'react';
import { StickyNote, Trash2, Plus, Loader2 } from 'lucide-react';

interface Note {
  id: number;
  client_id: string;
  body: string;
  author: string;
  created_at: string;
  updated_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ClientNotes({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/notes`)
      .then(r => r.json())
      .then(setNotes)
      .catch(() => {});
  }, [clientId]);

  async function saveNote() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setDraft('');
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(noteId: number) {
    setDeleting(noteId);
    try {
      const res = await fetch(`/api/clients/${clientId}/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) setNotes(prev => prev.filter(n => n.id !== noteId));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <StickyNote size={14} className="text-amber-400" />
        Internal Notes
      </h2>

      {/* Composer */}
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote(); }}
          placeholder="Add a note… (⌘Enter to save)"
          rows={3}
          className="w-full bg-slate-700 text-slate-100 text-sm rounded p-2.5 placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-amber-400 resize-none"
        />
        <button
          onClick={saveNote}
          disabled={saving || !draft.trim()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Save Note
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        {notes.length === 0 && (
          <p className="text-xs text-slate-500 italic">No notes yet.</p>
        )}
        {notes.map(note => (
          <div key={note.id} className="bg-slate-700/60 rounded p-3 group relative">
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{note.body}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">{note.author} · {timeAgo(note.created_at)}</span>
              <button
                onClick={() => deleteNote(note.id)}
                disabled={deleting === note.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
              >
                {deleting === note.id
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Trash2 size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
