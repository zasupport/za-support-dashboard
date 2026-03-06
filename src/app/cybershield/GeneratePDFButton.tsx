'use client';
import { useState } from 'react';

export function GeneratePDFButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);

  function generate() {
    setLoading(true);
    window.open(`/api/cybershield/report/${clientId}`, '_blank');
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="text-xs text-teal-400 hover:text-teal-300 disabled:opacity-40 whitespace-nowrap"
    >
      {loading ? '…' : '↓ PDF'}
    </button>
  );
}
