'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BillingActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function generateBilling() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/cybershield?_path=billing/generate', { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? `Created ${j.created ?? 0} billing record(s)` : 'Failed to generate billing');
      if (res.ok) router.refresh();
    } catch {
      setMsg('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={generateBilling}
        disabled={loading}
        className="text-xs px-3 py-2 rounded border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 disabled:opacity-40 transition-colors"
      >
        {loading ? 'Generating…' : 'Generate Billing'}
      </button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </div>
  );
}
