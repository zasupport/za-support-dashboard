'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';

type Client = { client_id: string; first_name: string; last_name: string };

export function WorkshopNewJob({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    priority: 'normal',
    description: '',
    serial: '',
    scheduled_date: '',
  });

  function set(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id || !form.title) return;
    setSaving(true);
    try {
      const res = await fetch('/api/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:      form.client_id,
          title:          form.title,
          priority:       form.priority,
          description:    form.description || undefined,
          serial:         form.serial || undefined,
          scheduled_date: form.scheduled_date || undefined,
          line_items:     [],
        }),
      });
      if (res.ok) {
        setOpen(false);
        setForm({ client_id: '', title: '', priority: 'normal', description: '', serial: '', scheduled_date: '' });
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
        >
          <Plus size={13} /> New Job
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3 max-w-lg"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">New Workshop Job</p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Client *</label>
              <select
                required
                value={form.client_id}
                onChange={e => set('client_id', e.target.value)}
                className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400"
              >
                <option value="">Select client…</option>
                {clients.map(c => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Replace SSD, configure Time Machine…"
                className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Device serial (optional)</label>
              <input
                type="text"
                value={form.serial}
                onChange={e => set('serial', e.target.value)}
                placeholder="C02ABC123DEF"
                className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Scheduled visit date</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={e => set('scheduled_date', e.target.value)}
                className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Description (optional)</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Additional context…"
                className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.client_id || !form.title}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Create Job
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-2 rounded text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
