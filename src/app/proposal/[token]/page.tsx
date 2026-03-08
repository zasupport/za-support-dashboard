'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Tier = {
  id: string;
  name: string;
  price_month: number;
  price_year: number | null;
  billing: string;
  badge: string | null;
  tagline: string;
  features: string[];
};

type ProposalData = {
  id: string;
  client_name: string;
  assessment_summary: string | null;
  status: string;
  expires_at: string | null;
  selected_tier: string | null;
  tiers: Tier[];
  za_support: { phone: string; email: string; website: string };
};

const API_URL = 'https://api.zasupport.com';

export default function ProposalPage() {
  const params = useParams();
  const token = params.token as string;

  const [proposal, setProposal]   = useState<ProposalData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [email, setEmail]         = useState('');
  const [selected, setSelected]   = useState<string | null>(null);
  const [emailStep, setEmailStep] = useState<string | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/v1/proposals/${token}/data`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setProposal(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const confirmSelection = async (tierId: string) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/proposals/${token}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier_id: tierId, name: proposal?.client_name, email }),
      });
      if (!res.ok) throw new Error();
      setSelected(tierId);
      setEmailStep(null);
      setSelecting(null);
    } catch {
      setError('Something went wrong. Please call Courtney directly on 064 529 5863.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading your proposal…</div>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Proposal not found or expired.</p>
          <p className="text-slate-400 text-sm mt-2">
            Please contact Courtney for a new link: <a href="tel:0645295863" className="text-teal-400">064 529 5863</a>
          </p>
        </div>
      </div>
    );
  }

  const alreadySelected = proposal.status === 'selected' || selected;
  const selectedTier = proposal.tiers.find(t => t.id === (selected || proposal.selected_tier));

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-white tracking-wide text-lg">ZA Support</span>
          <span className="text-slate-500 text-sm hidden sm:block">Practice IT. Perfected.</span>
          <a href={`tel:${proposal.za_support.phone}`} className="text-teal-400 text-sm font-medium">
            {proposal.za_support.phone}
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Confirmed state */}
        {alreadySelected ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-teal-400 text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              You&apos;re all set, {proposal.client_name.split(' ')[0]}!
            </h1>
            <p className="text-slate-400 max-w-md mx-auto">
              {selectedTier ? `You selected the ${selectedTier.name} tier. ` : ''}
              Courtney will call you within the hour to confirm and arrange your debit order.
            </p>
            <p className="text-slate-500 text-sm mt-4">
              Questions? <a href={`tel:${proposal.za_support.phone}`} className="text-teal-400 hover:underline">
                {proposal.za_support.phone}
              </a>
            </p>
          </div>
        ) : (
          <>
            {/* Greeting */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-white mb-3">
                Hi {proposal.client_name.split(' ')[0]}, here&apos;s your personalised proposal.
              </h1>
              {proposal.assessment_summary && (
                <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                  {proposal.assessment_summary}
                </p>
              )}
            </div>

            {/* Tiers */}
            <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mb-6">
              Select your service tier
            </p>
            <div className="grid md:grid-cols-3 gap-5 mb-4">
              {proposal.tiers.map(tier => {
                const isFeatured = tier.id === 'sla';
                const isSelecting = selecting === tier.id;
                const price = tier.price_year
                  ? `R ${tier.price_year.toLocaleString('en-ZA')}/year`
                  : `R ${tier.price_month.toLocaleString('en-ZA')}/month`;

                return (
                  <div key={tier.id} className={`relative rounded-xl border p-6 flex flex-col transition-all ${
                    isFeatured
                      ? 'border-teal-500/50 bg-teal-950/20'
                      : isSelecting
                      ? 'border-slate-500 bg-slate-800'
                      : 'border-slate-700 bg-slate-900'
                  }`}>
                    {tier.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        {tier.badge}
                      </span>
                    )}
                    <h3 className="text-white font-bold text-xl mb-1">{tier.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{tier.tagline}</p>
                    <div className="mb-5">
                      <span className="text-2xl font-bold text-white">{price}</span>
                      <p className="text-slate-500 text-xs mt-0.5">{tier.billing}</p>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                      {tier.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-teal-400 shrink-0 mt-0.5">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Selection flow */}
                    {emailStep === tier.id ? (
                      <div className="space-y-2">
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Email (optional)"
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                        />
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                        <button
                          onClick={() => confirmSelection(tier.id)}
                          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                        >
                          Confirm — {tier.name}
                        </button>
                        <button onClick={() => setEmailStep(null)} className="w-full text-slate-500 text-xs py-1 hover:text-slate-300">
                          Back
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEmailStep(tier.id)}
                        className={`w-full font-semibold py-3 rounded-lg text-sm transition-colors ${
                          isFeatured
                            ? 'bg-teal-600 hover:bg-teal-500 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        Get Started — {tier.name}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-slate-600 text-sm">
              Not sure?{' '}
              <a href={`tel:${proposal.za_support.phone}`} className="text-teal-400 hover:underline">
                Call Courtney on {proposal.za_support.phone}
              </a>{' '}— she&apos;ll help you pick the right tier.
            </p>

            {/* What happens next */}
            <div className="mt-14 pt-10 border-t border-slate-800">
              <h2 className="text-white font-semibold text-lg mb-6">What happens after you select?</h2>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { n: '1', t: 'Courtney calls within the hour', d: 'She confirms your selection, answers any questions, and arranges your debit order mandate.' },
                  { n: '2', t: 'Same-day activation', d: 'Health Check Scout is deployed to your Mac. Your first CyberPulse report is scheduled immediately.' },
                  { n: '3', t: 'You stop worrying about IT', d: 'Monthly health reports. Automatic alerts. 24/7 monitoring. You know before something goes wrong.' },
                ].map(s => (
                  <div key={s.n} className="flex gap-4">
                    <span className="text-teal-400 font-bold text-2xl shrink-0">{s.n}.</span>
                    <div>
                      <p className="text-white font-medium text-sm">{s.t}</p>
                      <p className="text-slate-400 text-sm mt-1">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center text-slate-600 text-xs">
          <p>ZA Support · {proposal.za_support.email} · {proposal.za_support.phone} · {proposal.za_support.website}</p>
          <p className="mt-1">1 Hyde Park Lane, Hyde Park, Johannesburg · Vizibiliti Intelligent Solutions (Pty) Ltd · VAT 436-026-0014</p>
          {proposal.expires_at && (
            <p className="mt-1">
              This proposal expires {new Date(proposal.expires_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
