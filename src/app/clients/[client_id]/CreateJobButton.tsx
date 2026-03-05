'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, X, Loader2 } from 'lucide-react';

export function CreateJobButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({ title: '', priority: 'normal', description: '', serial: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:   clientId,
          title:       form.title,
          priority:    form.priority,
          description: form.description || undefined,
          serial:      form.serial || undefined,
          line_items:  [],
        }),
      });
      if (res.ok) {
        const job = await res.json();
        setOpen(false);
        router.push(`/workshop/${job.job_ref}`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium border border-slate-600 transition-colors"
      >
        <Wrench size={12} /> New Workshop Job
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3 max-w-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">New Workshop Job</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">Title *</label>
        <input
          required
          type="text"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Configure backup, remove adware…"
          className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
            className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Serial (optional)</label>
          <input
            type="text"
            value={form.serial}
            onChange={e => setForm(p => ({ ...p, serial: e.target.value }))}
            placeholder="C02…"
            className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500 font-mono text-xs"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">Description (optional)</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          className="w-full bg-slate-700 text-slate-100 text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.title}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
          Create
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
  );
}
