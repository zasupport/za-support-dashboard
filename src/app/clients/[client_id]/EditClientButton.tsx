'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ClientData = {
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact?: string;
  address?: string;
  urgency_level?: string;
  concerns_detail?: string;
};

export function EditClientButton({ client }: { client: ClientData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name:       client.first_name,
    last_name:        client.last_name,
    email:            client.email,
    phone:            client.phone,
    preferred_contact: client.preferred_contact ?? '',
    address:          client.address ?? '',
    urgency_level:    client.urgency_level ?? '',
    concerns_detail:  client.concerns_detail ?? '',
  });

  function set(k: string, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(form)) {
        body[k] = v || null;
      }
      const res = await fetch(`/api/clients/${client.client_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.detail || 'Save failed.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full bg-slate-700 text-slate-100 text-sm rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-teal-400';
  const lbl = 'block text-xs text-slate-400 mb-1 mt-3';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 rounded border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md p-6 shadow-xl">
            <h2 className="text-white font-semibold mb-4">Edit Client — {client.first_name} {client.last_name}</h2>
            <form onSubmit={save}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>First name</label>
                  <input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inp} required />
                </div>
                <div>
                  <label className={lbl}>Last name</label>
                  <input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inp} required />
                </div>
              </div>
              <label className={lbl}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} />
              <label className={lbl}>Phone</label>
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} />
              <label className={lbl}>Preferred contact</label>
              <input type="text" value={form.preferred_contact} onChange={e => set('preferred_contact', e.target.value)} className={inp} />
              <label className={lbl}>Address</label>
              <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inp} />
              <label className={lbl}>Urgency level</label>
              <select value={form.urgency_level} onChange={e => set('urgency_level', e.target.value)} className={inp}>
                <option value="">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Moderate">Moderate</option>
              </select>
              <label className={lbl}>Concerns (client's own words)</label>
              <textarea rows={3} value={form.concerns_detail} onChange={e => set('concerns_detail', e.target.value)} className={`${inp} resize-none`} />
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <div className="flex gap-3 mt-4">
                <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
