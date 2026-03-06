'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CONCERNS = [
  'Slow computer', 'Backup concerns', 'Security / malware worries',
  'Storage almost full', 'Email problems', 'Wi-Fi / internet issues',
  'Battery life', 'Data loss / recovery', 'Software not working', 'General setup / tuning',
];

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    preferred_contact: 'email', address: '',
    referral_source: '', referred_by: '',
    urgency_level: 'Not urgent', concerns: [] as string[],
    concerns_detail: '', has_business: false,
    business_name: '', business_type: '',
    popia_consent: false, marketing_consent: false,
  });

  function set(key: string, val: any) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function toggleConcern(c: string) {
    setForm(prev => ({
      ...prev,
      concerns: prev.concerns.includes(c)
        ? prev.concerns.filter(x => x !== c)
        : [...prev.concerns, c],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.popia_consent) { setError('POPIA consent is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          setup: null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDone(data.client_id);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Failed to create client.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto pt-12 text-center space-y-4">
        <div className="text-green-400 text-4xl">✓</div>
        <h2 className="text-xl font-bold text-white">Client created</h2>
        <p className="text-slate-400 text-sm font-mono">{done}</p>
        <div className="flex gap-3 justify-center">
          <Link
            href={`/clients/${done}`}
            className="text-sm px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
          >
            Open Client Profile
          </Link>
          <button
            onClick={() => { setDone(null); setForm({ first_name: '', last_name: '', email: '', phone: '', preferred_contact: 'email', address: '', referral_source: '', referred_by: '', urgency_level: 'Not urgent', concerns: [], concerns_detail: '', has_business: false, business_name: '', business_type: '', popia_consent: false, marketing_consent: false }); }}
            className="text-sm px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            Add Another
          </button>
          <Link href="/clients" className="text-sm px-4 py-2 rounded-md border border-slate-700 text-slate-300 hover:text-white transition-colors">
            All Clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/clients" className="text-slate-400 text-xs hover:text-white mb-1 block">← All Clients</Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus size={22} /> New Client
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Creates client record and auto-populates onboarding checklist.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">

        {/* Contact */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Contact Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">First name *</label>
              <input required value={form.first_name} onChange={e => set('first_name', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Last name *</label>
              <input required value={form.last_name} onChange={e => set('last_name', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Phone *</label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="079 000 0000"
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Preferred contact</label>
              <select value={form.preferred_contact} onChange={e => set('preferred_contact', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400">
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone call</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Urgency</label>
              <select value={form.urgency_level} onChange={e => set('urgency_level', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400">
                <option value="Not urgent">Not urgent</option>
                <option value="Soon">Soon (within a week)</option>
                <option value="Urgent">Urgent (today/tomorrow)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Address (optional)</label>
              <input value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Suburb, City"
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500" />
            </div>
          </CardContent>
        </Card>

        {/* Referral */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">How They Found Us</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Referral source</label>
              <select value={form.referral_source} onChange={e => set('referral_source', e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400">
                <option value="">Select…</option>
                <option value="Word of mouth">Word of mouth</option>
                <option value="Google">Google</option>
                <option value="Existing client">Existing client referral</option>
                <option value="Social media">Social media</option>
                <option value="Medical practice">Medical practice network</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Referred by (name)</label>
              <input value={form.referred_by} onChange={e => set('referred_by', e.target.value)}
                placeholder="Person's name"
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500" />
            </div>
          </CardContent>
        </Card>

        {/* Concerns */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">What They Need</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => toggleConcern(c)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    form.concerns.includes(c)
                      ? 'bg-teal-600/30 text-teal-300 border-teal-500/50'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">In their own words (optional)</label>
              <textarea
                rows={2}
                value={form.concerns_detail}
                onChange={e => set('concerns_detail', e.target.value)}
                placeholder="What did they say when they called or emailed?"
                className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Business</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.has_business} onChange={e => set('has_business', e.target.checked)}
                className="rounded border-slate-600 bg-slate-700" />
              <span className="text-sm text-slate-300">Client has a business</span>
            </label>
            {form.has_business && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Business name</label>
                  <input value={form.business_name} onChange={e => set('business_name', e.target.value)}
                    className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Industry / type</label>
                  <input value={form.business_type} onChange={e => set('business_type', e.target.value)}
                    placeholder="Medical, Legal, Retail…"
                    className="w-full bg-slate-700 text-white text-sm rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400 placeholder-slate-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Consent (POPIA)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required checked={form.popia_consent} onChange={e => set('popia_consent', e.target.checked)}
                className="mt-0.5 rounded border-slate-600 bg-slate-700" />
              <span className="text-xs text-slate-300">
                Client consents to ZA Support collecting and storing their personal information for the purpose of delivering IT support services, in accordance with POPIA. *
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.marketing_consent} onChange={e => set('marketing_consent', e.target.checked)}
                className="mt-0.5 rounded border-slate-600 bg-slate-700" />
              <span className="text-xs text-slate-400">Client opts in to receive service updates and tips from ZA Support.</span>
            </label>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Create Client
          </button>
          <Link href="/clients" className="px-4 py-2 rounded-md border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
