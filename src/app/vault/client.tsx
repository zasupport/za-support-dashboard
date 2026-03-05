'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type VaultEntry = {
  id: string;
  label: string;
  credential_type: string;
  created_at: string;
  last_accessed_at?: string;
  tags?: string[];
};

export function VaultClient() {
  const [clientId, setClientId] = useState('');
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!clientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vault?client_id=${encodeURIComponent(clientId)}`);
      const json = await res.json();
      setEntries(Array.isArray(json) ? json : []);
    } catch {
      setError('Failed to load vault entries');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white w-64 focus:outline-none focus:border-blue-500"
          placeholder="Client ID"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <button
          onClick={load}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          Load
        </button>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && entries.length === 0 && clientId && (
        <p className="text-slate-400 text-sm">No vault entries for this client.</p>
      )}

      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map(entry => (
            <Card key={entry.id} className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">{entry.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="text-slate-200">{entry.credential_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{entry.created_at?.slice(0, 10) ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last accessed</span>
                  <span>{entry.last_accessed_at?.slice(0, 10) ?? 'Never'}</span>
                </div>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.tags.map(tag => (
                      <span key={tag} className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
