'use client';
import { useState } from 'react';

export function GeneratePDFButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/cybershield?_path=reports/${encodeURIComponent(clientId)}/generate`,
        { method: 'GET' }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.detail || 'Failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CyberShield_${clientId}_${new Date().toLocaleDateString('en-ZA').replace(/\//g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button
        onClick={generate}
        disabled={loading}
        className="text-xs text-teal-400 hover:text-teal-300 disabled:text-slate-600 transition-colors"
      >
        {loading ? 'Generating…' : 'PDF ↓'}
      </button>
      {error && <span className="text-xs text-red-400 ml-2">{error}</span>}
    </span>
  );
}
