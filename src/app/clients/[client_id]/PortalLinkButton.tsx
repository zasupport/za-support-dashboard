'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export function PortalLinkButton({
  clientId,
  phone,
  firstName,
}: {
  clientId: string;
  phone?: string | null;
  firstName?: string | null;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  async function handleClick() {
    setState('loading');
    try {
      const res = await fetch(`/api/clients/${clientId}/portal-link`);
      if (!res.ok) throw new Error('Failed to generate link');
      const data = await res.json();
      const url = data.portal_url;
      setPortalUrl(url);
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  function buildWhatsAppUrl(url: string) {
    const name = firstName ? firstName : 'there';
    const cleanPhone = (phone || '').replace(/\D/g, '').replace(/^0/, '27');
    const text = encodeURIComponent(
      `Hi ${name}, here is your ZA Support health portal — you can view your device health, monitoring activity, and value protected in real time:\n\n${url}\n\nLet me know if you have any questions.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className="text-xs px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-50"
      >
        {state === 'loading' && 'Generating…'}
        {state === 'copied' && '✓ Link Copied!'}
        {state === 'error' && 'Error — retry'}
        {state === 'idle' && 'Share Portal Link'}
      </button>

      {portalUrl && phone && (
        <a
          href={buildWhatsAppUrl(portalUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-green-800/50 hover:bg-green-700/60 text-green-300 hover:text-white border border-green-700/50 transition-colors"
        >
          <MessageCircle size={13} />
          Send via WhatsApp
        </a>
      )}

      {portalUrl && !phone && state !== 'copied' && (
        <span className="text-xs text-slate-400 truncate max-w-xs">{portalUrl}</span>
      )}
    </div>
  );
}
