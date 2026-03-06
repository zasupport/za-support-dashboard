'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const BACKEND = 'https://api.zasupport.com';

export function InstallCommand({ clientId, token }: { clientId: string; token: string }) {
  const [copied, setCopied] = useState(false);

  const cmd = `curl -fsSL "${BACKEND}/agent/install?client_id=${encodeURIComponent(clientId)}&token=${encodeURIComponent(token)}" | sudo bash`;

  async function copy() {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-xs font-mono bg-slate-900 text-teal-300 px-3 py-2 rounded overflow-x-auto whitespace-nowrap border border-slate-700">
        {cmd}
      </code>
      <button
        onClick={copy}
        className="shrink-0 p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
