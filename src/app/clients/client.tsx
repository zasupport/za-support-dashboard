'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Client = {
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  urgency_level?: string;
  has_business: boolean;
  business_name?: string;
  popia_consent: boolean;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: 'text-blue-400',
  active: 'text-green-400',
  sla: 'text-purple-400',
  inactive: 'text-slate-500',
};

const URGENCY_COLORS: Record<string, string> = {
  urgent: 'text-red-400',
  'this week': 'text-orange-400',
  'within a month': 'text-yellow-400',
  flexible: 'text-green-400',
};

export function ClientsClient() {
  const [status, setStatus] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [meta, setMeta] = useState<{ total?: number; page?: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendError, setBackendError] = useState(false);

  async function load(page = 1) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    try {
      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      if (json._error) {
        setBackendError(true);
        setClients([]);
        setMeta({});
      } else {
        setBackendError(false);
        setClients(Array.isArray(json.data) ? json.data : []);
        setMeta(json.meta ?? {});
      }
    } catch {
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <select
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="active">Active</option>
          <option value="sla">SLA</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => load()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          Filter
        </button>
        {meta.total !== undefined && (
          <span className="text-slate-400 text-sm ml-auto">{meta.total} client{meta.total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {backendError && !loading && (
        <div className="rounded-md border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-orange-300 text-sm">
          The API is temporarily unavailable. The backend may be starting up — please refresh in a moment.
          <button onClick={() => load()} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}
      {!loading && !error && !backendError && clients.length === 0 && (
        <p className="text-slate-400 text-sm">No clients found.</p>
      )}

      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <Card key={client.client_id} className="bg-slate-800 border-slate-700 hover:border-slate-500 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Link href={`/clients/${client.client_id}`} className="hover:text-teal-400 transition-colors">
                    <CardTitle className="text-sm text-white">
                      {client.first_name} {client.last_name}
                    </CardTitle>
                  </Link>
                  <span className={`text-xs font-semibold ${STATUS_COLORS[client.status] ?? 'text-slate-400'}`}>
                    {client.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">{client.client_id}</p>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="text-slate-200 truncate ml-2 max-w-[180px]">{client.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Phone</span>
                  {client.phone ? (
                    <div className="flex items-center gap-2 ml-2">
                      <a href={`tel:${client.phone}`} className="text-slate-200 hover:text-white">{client.phone}</a>
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, '').replace(/^0/, '27')}?text=${encodeURIComponent(`Hi ${client.first_name}, `)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-400 text-xs font-semibold"
                        title="Open WhatsApp"
                      >
                        WA
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
                {client.urgency_level && (
                  <div className="flex justify-between">
                    <span>Urgency</span>
                    <span className={URGENCY_COLORS[client.urgency_level.toLowerCase()] ?? 'text-slate-200'}>
                      {client.urgency_level}
                    </span>
                  </div>
                )}
                {client.has_business && client.business_name && (
                  <div className="flex justify-between">
                    <span>Business</span>
                    <span className="text-slate-200 truncate ml-2 max-w-[180px]">{client.business_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>POPIA consent</span>
                  <span className={client.popia_consent ? 'text-green-400' : 'text-red-400'}>
                    {client.popia_consent ? 'Granted' : 'Not granted'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Registered</span>
                  <span>{client.created_at?.slice(0, 10) ?? '—'}</span>
                </div>
                <div className="flex gap-3 pt-2 border-t border-slate-700/50">
                  <Link href={`/clients/${client.client_id}`} className="text-teal-400 hover:text-teal-300">Profile</Link>
                  <Link href={`/clients/${client.client_id}/brief`} className="text-slate-400 hover:text-white">Site Brief</Link>
                  <a href={`/api/reports/${client.client_id}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white ml-auto">PDF</a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
