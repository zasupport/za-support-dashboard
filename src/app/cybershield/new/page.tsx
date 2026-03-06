'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Client = { client_id: string; first_name: string; last_name: string };

export default function EnrollCyberShieldPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_id: '',
    practice_name: '',
    isp_name: '',
    notes: '',
    monthly_fee: '1499',
  });

  useEffect(() => {
    fetch('/api/clients?per_page=100')
      .then(r => r.json())
      .then(j => setClients(j.data ?? []))
      .catch(() => {});
  }, []);

  function set(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) { setError('Please select a client.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/cybershield?_path=enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          practice_name: form.practice_name || null,
          isp_name: form.isp_name || null,
          notes: form.notes || null,
          monthly_fee: parseFloat(form.monthly_fee) || 1499,
        }),
      });
      if (res.ok) {
        router.push('/cybershield');
      } else {
        const json = await res.json();
        setError(json.detail || 'Enrollment failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const input = 'w-full bg-slate-700 text-slate-100 text-sm rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-teal-400';
  const label = 'block text-xs text-slate-400 mb-1';

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/cybershield" className="text-slate-400 text-xs hover:text-white block mb-1">← CyberShield</Link>
        <h1 className="text-xl font-bold text-white">Enroll Practice</h1>
        <p className="text-slate-400 text-sm mt-1">Add a medical practice to the CyberShield network security service (R 1,499/month).</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <div>
          <label className={label}>Client *</label>
          <select
            required
            value={form.client_id}
            onChange={e => set('client_id', e.target.value)}
            className={input}
          >
            <option value="">Select client…</option>
            {clients.map(c => (
              <option key={c.client_id} value={c.client_id}>
                {c.first_name} {c.last_name} ({c.client_id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Practice Name</label>
          <input
            type="text"
            placeholder="e.g. Dr's Pieterse, Hunt, Meyberg, Laher & Associates"
            value={form.practice_name}
            onChange={e => set('practice_name', e.target.value)}
            className={input}
          />
        </div>

        <div>
          <label className={label}>ISP Name</label>
          <input
            type="text"
            placeholder="e.g. Stem, NTT Data, Vodacom"
            value={form.isp_name}
            onChange={e => set('isp_name', e.target.value)}
            className={input}
          />
        </div>

        <div>
          <label className={label}>Monthly Fee (R)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_fee}
            onChange={e => set('monthly_fee', e.target.value)}
            className={input}
          />
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea
            rows={3}
            placeholder="Any setup notes or special requirements…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className={`${input} resize-none`}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm px-5 py-2 rounded font-medium transition-colors"
          >
            {saving ? 'Enrolling…' : 'Enroll Practice'}
          </button>
          <Link href="/cybershield" className="text-slate-400 hover:text-white text-sm px-4 py-2">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
