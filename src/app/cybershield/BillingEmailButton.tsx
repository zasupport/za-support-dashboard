'use client';
import { useState } from 'react';

export function BillingEmailButton({ billingId }: { billingId: number }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function send() {
    setSending(true);
    setErr('');
    try {
      const res = await fetch(`/api/cybershield?_path=billing/${billingId}/email-invoice`, {
        method: 'POST',
      });
      if (res.ok) {
        setSent(true);
      } else {
        const j = await res.json().catch(() => ({}));
        setErr(j.detail || 'Failed');
      }
    } catch {
      setErr('Network error');
    } finally {
      setSending(false);
    }
  }

  if (sent) return <span className="text-xs text-green-400">Sent</span>;
  if (err)  return <span className="text-xs text-red-400" title={err}>Error</span>;

  return (
    <button
      onClick={send}
      disabled={sending}
      className="text-xs text-slate-400 hover:text-white disabled:opacity-40 whitespace-nowrap transition-colors"
    >
      {sending ? '…' : '✉ Email'}
    </button>
  );
}
