'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

type Result = {
  type: 'client' | 'device';
  label: string;
  sub: string;
  href: string;
};

export function GlobalSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const [cr, dr] = await Promise.all([
          fetch(`/api/clients?search=${encodeURIComponent(query)}&per_page=5`).then(r => r.ok ? r.json() : { data: [] }),
          fetch(`/api/devices?search=${encodeURIComponent(query)}&per_page=5`).then(r => r.ok ? r.json() : []),
        ]);
        const clients: Result[] = (cr.data || []).map((c: any) => ({
          type: 'client',
          label: `${c.first_name} ${c.last_name}`,
          sub:   `${c.client_id} · ${c.status}`,
          href:  `/clients/${c.client_id}`,
        }));
        const devices: Result[] = (Array.isArray(dr) ? dr : []).map((d: any) => ({
          type: 'device',
          label: d.hostname || d.serial,
          sub:   `${d.serial} · ${d.client_id || '—'}`,
          href:  `/devices/${d.serial}`,
        }));
        setResults([...clients, ...devices]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function go(href: string) {
    setQuery('');
    setOpen(false);
    setResults([]);
    router.push(href);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5">
        <Search size={13} className="text-slate-500 shrink-0" />
        <input
          className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-40 focus:w-56 transition-all"
          placeholder="Search clients, devices…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 z-50 w-72 bg-slate-800 border border-slate-700 rounded-md shadow-xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => go(r.href)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.type === 'client' ? 'bg-teal-500/20 text-teal-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {r.type}
                </span>
                <span className="text-sm text-white">{r.label}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 ml-10">{r.sub}</p>
            </button>
          ))}
        </div>
      )}

      {open && loading && (
        <div className="absolute top-full mt-1 left-0 z-50 w-72 bg-slate-800 border border-slate-700 rounded-md px-4 py-3">
          <p className="text-xs text-slate-400">Searching…</p>
        </div>
      )}
    </div>
  );
}
