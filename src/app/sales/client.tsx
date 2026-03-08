'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UpsellLeadActions } from '@/components/UpsellLeadActions';

type Contact = {
  id: string;
  full_name: string;
  company?: string;
  segment?: string;
  email?: string;
  phone?: string;
  investec_client?: boolean;
  created_at: string;
};

type Opportunity = {
  id: string;
  contact_id: string;
  title: string;
  stage: string;
  value_rand?: number;
  created_at: string;
};

type Recommendation = {
  id: string;
  client_id: string;
  client_name: string;
  first_name: string;
  phone: string;
  product_name: string;
  roi_description: string;
  rand_value: number;
  status: string;
  created_at: string;
};

const stageColour: Record<string, string> = {
  lead:       'bg-slate-600 text-slate-200',
  qualified:  'bg-blue-700 text-blue-100',
  proposal:   'bg-amber-700 text-amber-100',
  negotiation:'bg-orange-700 text-orange-100',
  closed_won: 'bg-green-700 text-green-100',
  closed_lost:'bg-red-800 text-red-200',
};

const segmentColour: Record<string, string> = {
  medical_practice: 'bg-teal-700 text-teal-100',
  sme:              'bg-purple-700 text-purple-100',
  individual:       'bg-blue-700 text-blue-100',
  family:           'bg-pink-700 text-pink-100',
};

function fmt(s?: number | null) {
  if (s == null) return '—';
  return `R ${s.toLocaleString('en-ZA')}`;
}

export function SalesClient() {
  const [contacts, setContacts]           = useState<Contact[]>([]);
  const [opps, setOpps]                   = useState<Opportunity[]>([]);
  const [recs, setRecs]                   = useState<Recommendation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [tab, setTab]                     = useState<'contacts' | 'pipeline' | 'upsell'>('contacts');

  useEffect(() => {
    const base = '/api/sales';
    Promise.all([
      fetch(`${base}/contacts`).then(r => r.ok ? r.json() : []),
      fetch(`${base}/opportunities`).then(r => r.ok ? r.json() : []),
      fetch(`${base}/recommendations/recent?days=365&limit=100`).then(r => r.ok ? r.json() : { recommendations: [] }),
    ])
      .then(([c, o, r]) => {
        setContacts(Array.isArray(c) ? c : c.data ?? []);
        setOpps(Array.isArray(o) ? o : o.data ?? []);
        setRecs(r.recommendations ?? []);
      })
      .catch(() => setError('Sales CRM API not reachable — deploy may be pending'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500 text-sm">Loading Sales CRM…</p>;
  if (error)   return <p className="text-amber-400 text-sm">{error}</p>;

  const investecContacts = contacts.filter(c => c.investec_client);
  const openOpps = opps.filter(o => !['closed_won','closed_lost'].includes(o.stage));
  const pipelineValue = openOpps.reduce((s, o) => s + (o.value_rand ?? 0), 0);
  const upsellValue = recs.reduce((s, r) => s + (r.rand_value ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Contacts</p>
            <p className="text-2xl font-bold text-white">{contacts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Open Pipeline</p>
            <p className="text-2xl font-bold text-teal-400">{fmt(pipelineValue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Upsell Pipeline</p>
            <p className="text-2xl font-bold text-emerald-400">{fmt(upsellValue)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{recs.length} lead{recs.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/40 border-amber-700">
          <CardContent className="p-4">
            <p className="text-xs text-amber-300 mb-1">Investec Clients</p>
            <p className="text-2xl font-bold text-amber-300">{investecContacts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {(['contacts','pipeline','upsell'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${tab === t ? 'bg-teal-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'upsell' ? 'Upsell Recs' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Contacts */}
      {tab === 'contacts' && (
        <div className="space-y-2">
          {contacts.length === 0 && <p className="text-slate-500 text-sm">No contacts yet.</p>}
          {contacts.map(c => (
            <Card key={c.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{c.full_name}</span>
                    {c.investec_client && (
                      <span className="bg-amber-700 text-amber-100 text-xs px-1.5 py-0.5 rounded">Investec</span>
                    )}
                    {c.segment && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${segmentColour[c.segment] ?? 'bg-slate-600 text-slate-200'}`}>
                        {c.segment.replace('_',' ')}
                      </span>
                    )}
                  </div>
                  {c.company && <p className="text-slate-400 text-xs">{c.company}</p>}
                  <div className="flex gap-3 mt-1">
                    {c.email && <span className="text-slate-500 text-xs">{c.email}</span>}
                    {c.phone && <span className="text-slate-500 text-xs">{c.phone}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline */}
      {tab === 'pipeline' && (
        <div className="space-y-2">
          {opps.length === 0 && <p className="text-slate-500 text-sm">No opportunities yet.</p>}
          {opps.map(o => (
            <Card key={o.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{o.title}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${stageColour[o.stage] ?? 'bg-slate-600 text-slate-200'}`}>
                    {o.stage.replace('_',' ')}
                  </span>
                </div>
                <span className="text-teal-400 font-semibold text-sm">{fmt(o.value_rand)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upsell recommendations */}
      {tab === 'upsell' && (
        <div className="space-y-2">
          {recs.length === 0 && (
            <p className="text-slate-500 text-sm">No upsell leads yet — Scout diagnostics generate these automatically.</p>
          )}
          {recs.map(r => {
            const phone = (r.phone || '').replace(/\D/g, '').replace(/^0/, '27');
            const waMsg = encodeURIComponent(
              `Hi ${r.first_name || 'there'}, following our recent health check I have a recommendation that could make a real difference for your setup.\n\n${r.product_name}: ${r.roi_description}\n\nWorth roughly R ${Math.round(r.rand_value || 0).toLocaleString()} in value. Happy to chat this week if you have 10 minutes?\n\nKind regards,\nCourtney Bentley\nZA Support\n064 529 5863`
            );
            const waHref = phone ? `https://wa.me/${phone}?text=${waMsg}` : `https://wa.me/?text=${waMsg}`;
            return (
              <Card key={r.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-white text-sm font-medium">{r.client_name}</span>
                      <span className="text-emerald-300 text-sm">{r.product_name}</span>
                      {r.rand_value > 0 && (
                        <span className="text-emerald-400 font-semibold text-sm">{fmt(r.rand_value)}</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs">{r.roi_description}</p>
                  </div>
                  <UpsellLeadActions
                    recId={r.id}
                    phone={phone}
                    waHref={waHref}
                    initialStatus={r.status}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
