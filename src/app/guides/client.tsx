'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, Send, Trash2, ChevronDown, ChevronUp, Tag, X, Loader2 } from 'lucide-react';

type Guide = {
  id: number;
  title: string;
  content_md: string;
  category: string | null;
  tags: string[];
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type Client = { client_id: string; first_name: string; last_name: string };

const CATEGORIES = ['Network', 'Security', 'Backup', 'Email', 'Hardware', 'Software', 'General'];

export function GuidesClient() {
  const [guides, setGuides]           = useState<Guide[]>([]);
  const [clients, setClients]         = useState<Client[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [filterCat, setFilterCat]     = useState('');
  const [expanded, setExpanded]       = useState<number | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [sendGuideId, setSendGuideId] = useState<number | null>(null);
  const [sendClientId, setSendClientId] = useState('');
  const [sending, setSending]         = useState(false);
  const [deleting, setDeleting]       = useState<number | null>(null);

  // Create form state
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags]         = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving]     = useState(false);

  const loadGuides = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', per_page: '50' });
      if (filterCat) params.set('category', filterCat);
      const res = await fetch(`/api/guides?${params}`);
      const json = await res.json();
      setGuides(json.data ?? []);
    } catch {
      setError('Failed to load guides.');
    } finally {
      setLoading(false);
    }
  }, [filterCat]);

  useEffect(() => { loadGuides(); }, [loadGuides]);

  useEffect(() => {
    fetch('/api/clients?per_page=100')
      .then(r => r.json())
      .then(json => setClients(json.data ?? []))
      .catch(() => {});
  }, []);

  async function createGuide() {
    if (!title.trim() || !content.trim()) { setError('Title and content required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content_md: content.trim(),
          category: category || null,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          is_public: isPublic,
        }),
      });
      if (!res.ok) { setError('Failed to create guide.'); return; }
      setSuccess('Guide created.');
      setShowCreate(false);
      setTitle(''); setContent(''); setCategory(''); setTags(''); setIsPublic(false);
      loadGuides();
    } catch {
      setError('Failed to create guide.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteGuide(id: number) {
    if (!confirm('Delete this guide?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/guides/${id}`, { method: 'DELETE' });
      setGuides(g => g.filter(x => x.id !== id));
      setSuccess('Guide deleted.');
    } catch {
      setError('Failed to delete.');
    } finally {
      setDeleting(null);
    }
  }

  async function sendGuide() {
    if (!sendGuideId || !sendClientId) { setError('Select a client.'); return; }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/guides/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guide_id: sendGuideId, client_id: sendClientId }),
      });
      if (!res.ok) { setError('Failed to send guide.'); return; }
      setSuccess(`Guide sent to ${sendClientId}.`);
      setSendGuideId(null);
      setSendClientId('');
    } catch {
      setError('Failed to send guide.');
    } finally {
      setSending(false);
    }
  }

  const flash = (msg: string, setter: typeof setSuccess) => {
    setter(msg);
    setTimeout(() => setter(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setShowCreate(s => !s); setError(''); }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors ml-auto"
        >
          <Plus size={14} /> New Guide
        </button>
      </div>

      {/* Flash messages */}
      {error   && <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</div>}
      {success && <div className="text-sm text-green-400 bg-green-900/20 border border-green-800 rounded px-3 py-2">{success}</div>}

      {/* Create form */}
      {showCreate && (
        <Card className="bg-slate-800 border-teal-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <BookOpen size={14} /> New Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2"
            />
            <textarea
              placeholder="Content (Markdown supported)"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 font-mono"
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2"
              >
                <option value="">No Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
                Public
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={createGuide}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save Guide
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="text-sm px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send modal */}
      {sendGuideId !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-sm mx-4">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm text-white">Send Guide to Client</CardTitle>
              <button onClick={() => { setSendGuideId(null); setSendClientId(''); }} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={sendClientId}
                onChange={e => setSendClientId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2"
              >
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.first_name} {c.last_name} ({c.client_id})
                  </option>
                ))}
              </select>
              <button
                onClick={() => { sendGuide(); flash('', setError); }}
                disabled={sending || !sendClientId}
                className="w-full flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-50"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Guide list */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
          <Loader2 size={16} className="animate-spin" /> Loading guides...
        </div>
      ) : guides.length === 0 ? (
        <div className="text-slate-500 text-sm py-8 text-center">No guides found. Create your first guide above.</div>
      ) : (
        <div className="space-y-3">
          {guides.map(g => (
            <Card key={g.id} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{g.title}</span>
                      {g.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/50 text-teal-400 border border-teal-800">
                          {g.category}
                        </span>
                      )}
                      {g.is_public && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Public</span>
                      )}
                    </div>
                    {g.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {g.tags.map(t => (
                          <span key={t} className="flex items-center gap-0.5 text-xs text-slate-500 bg-slate-700 rounded px-1.5 py-0.5">
                            <Tag size={10} /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      by {g.created_by} · {new Date(g.created_at).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setSendGuideId(g.id); setError(''); setSuccess(''); }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors"
                      title="Send to client"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      onClick={() => deleteGuide(g.id)}
                      disabled={deleting === g.id}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === g.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      {expanded === g.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                {expanded === g.id && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {g.content_md}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
