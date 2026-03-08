'use client';

import { useState } from 'react';

export function PortalLinkButton({ clientId }: { clientId: string }) {
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

  return (
    <div className="flex items-center gap-2">
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
      {portalUrl && state !== 'copied' && (
        <span className="text-xs text-slate-400 truncate max-w-xs">{portalUrl}</span>
      )}
    </div>
  );
}
