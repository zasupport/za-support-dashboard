'use client';

import { useState } from 'react';
import { MessageCircle, Copy, Check, ExternalLink } from 'lucide-react';

export function PortalLinkButton({
  clientId,
  phone,
  firstName,
}: {
  clientId: string;
  phone?: string | null;
  firstName?: string | null;
}) {
  const [state,    setState]    = useState<'idle' | 'loading' | 'ready' | 'copied' | 'error'>('idle');
  const [portalUrl, setPortalUrl] = useState('');
  const [shareUrl,  setShareUrl]  = useState('');
  const [msgCopied, setMsgCopied] = useState(false);

  async function handleClick() {
    setState('loading');
    try {
      // 1. Generate portal link
      const pr = await fetch(`/api/clients/${clientId}/portal-link`);
      if (!pr.ok) throw new Error('Portal link failed');
      const pd = await pr.json();
      const pUrl: string = pd.portal_url;
      setPortalUrl(pUrl);

      // 2. Generate Health Check PDF share link (X-Share-URL header)
      let sUrl = '';
      try {
        const sr = await fetch(`/api/reports/demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, days_valid: 90 }),
        });
        if (sr.ok) sUrl = sr.headers.get('X-Share-URL') || '';
      } catch { /* PDF optional */ }
      setShareUrl(sUrl);

      // Copy portal URL immediately
      await navigator.clipboard.writeText(pUrl);
      setState('ready');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  function buildMessage(): string {
    const name = firstName || 'there';
    const lines: string[] = [
      `Hi ${name}, I hope you're well.`,
      '',
      'Your ZA Support Health Check is ready. Here is your personal dashboard — it shows everything we have monitored and done for your IT security:',
      '',
      portalUrl,
    ];
    if (shareUrl) {
      lines.push('', 'Your Health Check Diagnostic report (PDF):', '', shareUrl);
    }
    lines.push(
      '',
      'If anything needs attention, we have flagged it on your dashboard. Feel free to reach out if you have any questions.',
      '',
      'Kind regards,',
      'Courtney Bentley',
      'ZA Support',
      '064 529 5863',
    );
    return lines.join('\n');
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(buildMessage());
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 2500);
  }

  function openWhatsApp() {
    const text = encodeURIComponent(buildMessage());
    const cleanPhone = (phone || '').replace(/\D/g, '').replace(/^0/, '27');
    window.open(`https://wa.me/${cleanPhone || ''}?text=${text}`, '_blank');
  }

  if (state === 'idle') {
    return (
      <button
        onClick={handleClick}
        className="text-xs px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
      >
        Share Portal + Report
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <button disabled className="text-xs px-4 py-2 rounded-md bg-slate-700/50 text-white/60 font-medium">
        Generating…
      </button>
    );
  }

  if (state === 'error') {
    return (
      <button
        onClick={() => setState('idle')}
        className="text-xs px-4 py-2 rounded-md bg-red-700/50 text-white/60 font-medium"
      >
        Error — tap to retry
      </button>
    );
  }

  // state === 'ready'
  return (
    <div className="mt-1 w-full rounded-lg border border-teal-700/40 bg-teal-900/10 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-teal-300">Links ready — portal URL copied</span>
        <button onClick={() => setState('idle')} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
      </div>

      {/* URLs */}
      <div className="space-y-1">
        <a href={portalUrl} target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 truncate">
          <ExternalLink size={11} /> Portal: {portalUrl.slice(0, 60)}…
        </a>
        {shareUrl && (
          <a href={shareUrl} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 truncate">
            <ExternalLink size={11} /> PDF: {shareUrl.slice(0, 60)}…
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={`https://wa.me/${((phone || '').replace(/\D/g, '').replace(/^0/, '27') || '')}?text=${encodeURIComponent(buildMessage())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors"
          onClick={() => setState('idle')}
        >
          <MessageCircle size={13} />
          {phone ? `Send to ${firstName || 'client'} via WhatsApp` : 'Open WhatsApp (select contact)'}
        </a>
        <button
          onClick={copyMessage}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
        >
          {msgCopied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          {msgCopied ? 'Copied!' : 'Copy full message'}
        </button>
      </div>

      {!phone && (
        <p className="text-xs text-amber-400/70">
          No phone number stored — WhatsApp will open without a pre-selected contact.
          Edit client profile to add a phone number.
        </p>
      )}
    </div>
  );
}
