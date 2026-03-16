'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractData = {
  id: string;
  client_name: string;
  client_email: string;
  practice_name: string | null;
  hpcsa_number: string | null;
  vat_number?: string | null;
  company_registration?: string | null;
  status: string;
  expires_at: string | null;
  signed_at: string | null;
  payment_method: string | null;
  docseal_embed_url: string | null;
  tier_id: string;
  tier_name: string;
  price_excl_vat: number;
  price_incl_vat: number;
  currency: string;
  za_support: {
    phone: string;
    email: string;
    website: string;
    company: string;
    vat_no: string;
    address: string;
  };
};

const API_URL = 'https://api.zasupport.com';

const ADD_ON_OPTIONS = [
  { id: 'additional_mac', label: 'Additional Mac device monitoring', price: 'R 399/device/month excl. VAT' },
  { id: 'windows_device', label: 'Windows or non-macOS device monitoring', price: 'Available as add-on — contact us for pricing' },
  { id: 'cybershield', label: 'CyberShield network security monitoring', price: 'Full network-level protection — from R 799/month' },
  { id: 'quarterly_onsite', label: 'Additional quarterly on-site assessment', price: 'R 899/hour — billed at time of visit' },
  { id: 'group_training', label: 'Annual group staff IT security awareness training', price: 'On-site — contact us for pricing based on staff headcount' },
  { id: 'individual_training', label: 'Individual one-on-one practitioner training session', price: '1-hour session — contact us for pricing' },
];

// ─── Accordion section component ──────────────────────────────────────────────

function AccordionSection({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-800 hover:bg-slate-750 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">{title}</span>
          {badge && (
            <span className="bg-teal-500/20 text-teal-400 text-xs px-2 py-0.5 rounded-full border border-teal-500/30">
              {badge}
            </span>
          )}
        </div>
        <span className={`text-slate-400 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="px-5 py-5 bg-slate-900 text-slate-300 text-sm leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main contract page ───────────────────────────────────────────────────────

export default function ContractPage() {
  const params = useParams();
  const token = params.token as string;

  const [contract, setContract]           = useState<ContractData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [step, setStep]                   = useState<'contract' | 'confirm' | 'sign' | 'payment' | 'done'>('contract');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_order'>('debit_order');
  const [signatoryName, setSignatoryName] = useState('');
  const [hpcsaAgreed, setHpcsaAgreed]     = useState(false);
  const [popiaAgreed, setPopiaAgreed]     = useState(false);
  const [ectaAgreed, setEctaAgreed]       = useState(false);
  const [allRead, setAllRead]             = useState(false);
  const [signing, setSigning]             = useState(false);
  const [error, setError]                 = useState('');

  // Editable details
  const [editingDetails, setEditingDetails] = useState(false);
  const [editName, setEditName]             = useState('');
  const [editPractice, setEditPractice]     = useState('');
  const [editHpcsa, setEditHpcsa]           = useState('');
  const [editVat, setEditVat]               = useState('');
  const [editCompanyReg, setEditCompanyReg] = useState('');

  // Add-ons
  const [addOns, setAddOns]               = useState<string[]>([]);
  const [serviceBooking, setServiceBooking] = useState<'yes' | 'no' | null>(null);
  const [bookingRequested, setBookingRequested] = useState(false);

  // Peach Payments
  const [peachCheckoutUrl, setPeachCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/v1/contracts/medical/${token}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => {
        if (d) {
          setContract(d);
          setSignatoryName(d.client_name);
          setEditName(d.client_name);
          setEditPractice(d.practice_name || '');
          setEditHpcsa(d.hpcsa_number || '');
          setEditVat(d.vat_number || '');
          setEditCompanyReg(d.company_registration || '');
          if (d.status === 'signed' || d.status === 'payment_initiated' || d.status === 'active') {
            setStep('done');
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    if (!signatoryName || !hpcsaAgreed || !popiaAgreed || !ectaAgreed) {
      setError('Please accept all compliance agreements and enter your full name.');
      return;
    }
    setError('');
    setSigning(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/contracts/medical/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatory_name: signatoryName,
          hpcsa_agreed: hpcsaAgreed,
          popia_agreed: popiaAgreed,
          ecta_agreed: ectaAgreed,
          payment_method: paymentMethod,
          add_ons: addOns,
          service_booking_requested: bookingRequested,
          client_name_confirmed: editName || contract?.client_name,
          practice_name_confirmed: editPractice || contract?.practice_name,
          vat_number: editVat,
          company_registration: editCompanyReg,
        }),
      });
      if (!res.ok) throw new Error();
      // Fetch Peach checkout URL after signing
      try {
        const checkoutRes = await fetch(`${API_URL}/api/v1/contracts/medical/${token}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (checkoutRes.ok) {
          const cd = await checkoutRes.json();
          setPeachCheckoutUrl(cd.checkout_url || cd.hosted_url || null);
        }
      } catch {
        // checkout URL not available — show fallback
      }
      setStep('payment');
    } catch {
      setError('Something went wrong. Please call Courtney directly on 064 529 5863.');
    } finally {
      setSigning(false);
    }
  };

  const toggleAddOn = (id: string) => {
    setAddOns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ─── Loading / not found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading your contract…</div>
      </div>
    );
  }

  if (notFound || !contract) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Contract not found or expired.</p>
          <p className="text-slate-400 text-sm mt-2">
            Contact Courtney:{' '}
            <a href="tel:0645295863" className="text-teal-400">064 529 5863</a>
          </p>
        </div>
      </div>
    );
  }

  const firstName = contract.client_name.split(' ')[0];

  // ─── Payment step ───────────────────────────────────────────────────────────

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Nav contract={contract} />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-teal-400 text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Contract signed, {firstName}!</h1>
            <p className="text-slate-400">One final step — set up your monthly payment.</p>
            {bookingRequested && (
              <p className="text-teal-400 text-sm mt-2">
                Your Mac service booking request has been noted. Mary will be in touch shortly to arrange a convenient time.
              </p>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-1">Choose your payment method</h2>
            <p className="text-slate-400 text-sm mb-5">
              R {contract.price_excl_vat.toLocaleString('en-ZA')}/month excl. VAT
              (R {contract.price_incl_vat.toLocaleString('en-ZA')} incl. 15% VAT) — recurring monthly on the 25th
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                {
                  id: 'debit_order' as const,
                  icon: '🏦',
                  label: 'Debit Order',
                  desc: 'Automatic monthly debit from your bank account. Most convenient — set it once.',
                },
                {
                  id: 'credit_card' as const,
                  icon: '💳',
                  label: 'Credit Card',
                  desc: 'Pay via credit or cheque card. Card is charged automatically each month.',
                },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === opt.id
                      ? 'border-teal-500 bg-teal-950/30'
                      : 'border-slate-600 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className="text-white font-medium text-sm">{opt.label}</div>
                  <div className="text-slate-400 text-xs mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>

            {peachCheckoutUrl ? (
              <a
                href={peachCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-xl text-center transition-colors"
              >
                Continue to Peach Payments — {paymentMethod === 'debit_order' ? 'Debit Order' : 'Credit Card'}
              </a>
            ) : (
              <div className="bg-slate-700 rounded-xl p-4 text-center">
                <p className="text-slate-300 text-sm">
                  Payment setup will be arranged by Courtney directly.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  A payment link will be sent to <strong>{contract.client_email}</strong> shortly, or call:{' '}
                  <a href="tel:0645295863" className="text-teal-400">064 529 5863</a>
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-500 text-center space-y-1">
            <p>Payments processed securely by Peach Payments — PCI-DSS compliant. All processing fees are for your account.</p>
            <p>No card or banking details pass through ZA Support servers</p>
            <p>12-month initial term applies. Cancellation requires 30 days written notice after initial term.</p>
            <p>Recurring monthly on the 25th of each month</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Done state ─────────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Nav contract={contract} />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-teal-400 text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Welcome to ZA Support, {firstName}!</h1>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            Your Health Check Scout SLA is confirmed. Courtney will be in touch within the hour to arrange Health Check Scout deployment to your practice devices.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left mb-10">
            {[
              { n: '1', t: 'Courtney calls you', d: 'She confirms everything and schedules Scout deployment at a convenient time.' },
              { n: '2', t: 'Scout deployed same day', d: 'Health Check Scout is silently installed — zero disruption to your practice.' },
              { n: '3', t: 'Monthly health reports', d: 'You receive a clear health report every month. We alert you before problems occur.' },
            ].map(s => (
              <div key={s.n} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-teal-400 font-bold text-lg">{s.n}.</span>
                <p className="text-white font-medium text-sm mt-1">{s.t}</p>
                <p className="text-slate-400 text-xs mt-1">{s.d}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm">
            Questions?{' '}
            <a href={`tel:${contract.za_support.phone}`} className="text-teal-400 hover:underline">
              {contract.za_support.phone}
            </a>{' '}
            or{' '}
            <a href={`mailto:${contract.za_support.email}`} className="text-teal-400 hover:underline">
              {contract.za_support.email}
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ─── Confirm details step ────────────────────────────────────────────────────

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Nav contract={contract} />
        <div className="max-w-2xl mx-auto px-6 py-10">
          <button onClick={() => setStep('contract')} className="text-slate-500 text-sm hover:text-slate-300 mb-6 flex items-center gap-2">
            ← Back to contract
          </button>
          <h2 className="text-xl font-bold text-white mb-2">Confirm Your Details</h2>
          <p className="text-slate-400 text-sm mb-8">
            Please review and update your details below. These will be recorded on the signed agreement.
          </p>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Full name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="e.g. Dr Leanne Prodehl"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Practice name</label>
              <input
                type="text"
                value={editPractice}
                onChange={e => setEditPractice(e.target.value)}
                placeholder="e.g. Prodehl Medical Practice"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">HPCSA registration number</label>
              <input
                type="text"
                value={editHpcsa}
                onChange={e => setEditHpcsa(e.target.value)}
                placeholder="e.g. MP0123456"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">VAT number <span className="text-slate-500 font-normal">(if registered)</span></label>
              <input
                type="text"
                value={editVat}
                onChange={e => setEditVat(e.target.value)}
                placeholder="e.g. 4123456789"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Company registration number <span className="text-slate-500 font-normal">(if incorporated)</span></label>
              <input
                type="text"
                value={editCompanyReg}
                onChange={e => setEditCompanyReg(e.target.value)}
                placeholder="e.g. 2018/123456/07"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            onClick={() => setStep('sign')}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl text-base transition-colors"
          >
            Confirm Details &amp; Continue to Sign →
          </button>
        </div>
      </div>
    );
  }

  // ─── Sign step ──────────────────────────────────────────────────────────────

  if (step === 'sign') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Nav contract={contract} />
        <div className="max-w-2xl mx-auto px-6 py-10">
          <button onClick={() => setStep('confirm')} className="text-slate-500 text-sm hover:text-slate-300 mb-6 flex items-center gap-2">
            ← Back to details
          </button>
          <h2 className="text-xl font-bold text-white mb-2">Sign the Service Agreement</h2>
          <p className="text-slate-400 text-sm mb-8">
            By signing below you confirm you have read and agree to the Health Check Scout SLA terms.
          </p>

          {/* Signatory name */}
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Full name (as it appears in your records)
            </label>
            <input
              type="text"
              value={signatoryName}
              onChange={e => setSignatoryName(e.target.value)}
              placeholder="e.g. Dr Leanne Prodehl"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Compliance checkboxes */}
          <div className="space-y-4 mb-8">
            <CheckBox
              checked={hpcsaAgreed}
              onChange={setHpcsaAgreed}
              label="I confirm that I am a registered healthcare practitioner under the Health Professions Council of South Africa (HPCSA) and agree that ZA Support will handle patient-adjacent data in accordance with HPCSA confidentiality requirements, National Health Act and relevant professional rules of conduct."
              badge="HPCSA"
            />
            <CheckBox
              checked={popiaAgreed}
              onChange={setPopiaAgreed}
              label="I consent to ZA Support processing diagnostic data from practice devices in accordance with the Protection of Personal Information Act, 4 of 2013 (POPIA). I understand data is used solely for device health monitoring, is encrypted in transit and at rest, and is never shared with third parties without my written consent."
              badge="POPIA"
            />
            <CheckBox
              checked={ectaAgreed}
              onChange={setEctaAgreed}
              label="I acknowledge that this agreement constitutes a valid and binding electronic contract under the Electronic Communications and Transactions Act, 25 of 2002 (ECTA), and that my electronic signature carries the same legal weight as a handwritten signature."
              badge="ECTA"
            />
          </div>

          {/* Payment method choice */}
          <div className="mb-8">
            <p className="text-slate-300 text-sm font-medium mb-3">Preferred payment method</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'debit_order' as const, label: '🏦 Debit Order' },
                { id: 'credit_card' as const, label: '💳 Credit Card' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    paymentMethod === opt.id
                      ? 'border-teal-500 bg-teal-950/30 text-white'
                      : 'border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleSign}
            disabled={signing}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors"
          >
            {signing ? 'Signing…' : 'Sign & Continue to Payment'}
          </button>

          <p className="text-slate-600 text-xs text-center mt-4">
            Your signature is recorded with timestamp and IP address for ECTA compliance.
          </p>
        </div>
      </div>
    );
  }

  // ─── Contract reading step ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav contract={contract} />

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-teal-500/20 text-teal-400 text-xs px-3 py-1 rounded-full border border-teal-500/30 font-medium">
              Medical Practice SLA
            </span>
            <span className="text-slate-500 text-xs">HPCSA · POPIA · ECTA compliant</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Health Check Scout — Service Level Agreement
          </h1>
          <p className="text-slate-400 text-sm">
            Hi {firstName}, please read the full agreement below before signing.
            Each section can be expanded for detail. When done, click{' '}
            <strong className="text-white">Sign Agreement</strong> at the bottom.
          </p>
        </div>

        {/* Pricing summary banner */}
        <div className="bg-slate-800 border border-teal-500/30 rounded-xl p-4 mb-8 flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-slate-400 text-xs">Monthly fee (excl. VAT)</p>
            <p className="text-white font-bold text-xl">
              R {contract.price_excl_vat.toLocaleString('en-ZA')}/month
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Including 15% VAT</p>
            <p className="text-teal-400 font-semibold text-lg">
              R {contract.price_incl_vat.toLocaleString('en-ZA')}/month
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Practice</p>
            <p className="text-white font-medium">{contract.practice_name || contract.client_name}</p>
          </div>
        </div>

        {/* ─── Contract sections ──────────────────────────────────────────────── */}

        <AccordionSection title="1. Parties to this Agreement" defaultOpen>
          <p>
            This Service Level Agreement (<strong>"Agreement"</strong>) is entered into between:
          </p>
          <p>
            <strong>Service Provider:</strong> Vizibiliti Intelligent Solutions (Pty) Ltd trading as
            ZA Support, registration number 2024/123456/07, VAT number {contract.za_support.vat_no},
            of {contract.za_support.address} (<strong>"ZA Support"</strong>).
          </p>
          <p>
            <strong>Client:</strong> {editName || contract.client_name}
            {(editPractice || contract.practice_name) ? `, practising as ${editPractice || contract.practice_name}` : ''}
            {(editHpcsa || contract.hpcsa_number) ? `, HPCSA registration number ${editHpcsa || contract.hpcsa_number}` : ''}
            {editVat ? `, VAT number ${editVat}` : ''}
            {editCompanyReg ? `, company registration ${editCompanyReg}` : ''}
            {' '}(<strong>"the Client"</strong>).
          </p>
          <p>
            Together referred to as <strong>"the Parties"</strong>. This Agreement is effective from
            the date of electronic signature by the Client.
          </p>

          {/* Editable details inline */}
          <div className="mt-4 border-t border-slate-700 pt-4">
            {!editingDetails ? (
              <button
                onClick={() => setEditingDetails(true)}
                className="text-teal-400 text-xs hover:text-teal-300 underline"
              >
                Edit your details
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs font-medium">Update your details:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Full name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Practice name</label>
                    <input type="text" value={editPractice} onChange={e => setEditPractice(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">HPCSA number</label>
                    <input type="text" value={editHpcsa} onChange={e => setEditHpcsa(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">VAT number</label>
                    <input type="text" value={editVat} onChange={e => setEditVat(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-xs mb-1">Company registration number</label>
                    <input type="text" value={editCompanyReg} onChange={e => setEditCompanyReg(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500" />
                  </div>
                </div>
                <button
                  onClick={() => setEditingDetails(false)}
                  className="text-teal-400 text-xs hover:text-teal-300 underline"
                >
                  Save details
                </button>
              </div>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="2. Service Description — Health Check Scout">
          <p>
            ZA Support will provide the <strong>Health Check Scout</strong> monitoring service
            (<strong>"Scout"</strong>), a proprietary macOS diagnostic and monitoring system that:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Continuously monitors device health, performance, and security posture</li>
            <li>Collects diagnostic data including battery health, storage, network connectivity, security configuration, backup status, and risk indicators</li>
            <li>Generates monthly Health Check reports with risk scoring (0–100)</li>
            <li>Alerts ZA Support to critical issues automatically</li>
            <li>Operates as a silent background service — no disruption to clinical workflow</li>
            <li>Transmits data exclusively to api.zasupport.com over encrypted HTTPS (TLS 1.2+)</li>
          </ul>
          <p className="text-slate-400 text-xs mt-2">
            Scout does not access, read, or transmit patient records, clinical notes, billing systems,
            or any electronic health record (EHR/EMR) data. It monitors device hardware and operating
            system health only.
          </p>
        </AccordionSection>

        <AccordionSection title="3. Scope of Services" badge="SLA">
          <p className="font-medium text-white">Included in this agreement:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Health Check Scout deployment and installation on agreed practice devices</li>
            <li>Continuous automated monitoring (24/7/365)</li>
            <li>Monthly Health Check reports delivered to the Client</li>
            <li>Priority remote support — 4-hour response during business hours (08:00–18:00 SAST, Mon–Fri)</li>
            <li>Critical alerts responded to within 2 hours (including after hours for severity Critical)</li>
            <li>Quarterly on-site IT health assessments (scheduled at mutual convenience)</li>
            <li>IT security awareness training — two-phase paid service: Phase 1: Annual group staff training session (on-site); Phase 2: Individual one-on-one sessions for smaller practices (billed separately per session)</li>
            <li>Hardware procurement at preferred rates — up to 35% discount on hardware</li>
            <li>Ransomware and data breach alerts with immediate notification</li>
            <li>Backup integrity monitoring and alerting</li>
            <li>macOS patch and compatibility alerts</li>
          </ul>
          <p className="font-medium text-white mt-4">Excluded from this agreement:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-slate-400">
            <li>Hardware repair (quoted separately at R 899/hour labour)</li>
            <li>Practice management software support (PMS-specific issues)</li>
            <li>Internet service provider issues beyond the Client's premises</li>
            <li>Physical infrastructure (cabling, printers, imaging equipment)</li>
            <li>Windows or non-macOS devices (available as add-on)</li>
          </ul>
        </AccordionSection>

        <AccordionSection title="4. Service Levels & Response Times">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Severity</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Definition</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Response</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Resolution Target</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-3 px-3 text-red-400 font-medium">Critical</td>
                <td className="py-3 px-3">Practice unable to operate; active data breach or ransomware</td>
                <td className="py-3 px-3">2 hours (24/7)</td>
                <td className="py-3 px-3">Same day</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-3 px-3 text-orange-400 font-medium">High</td>
                <td className="py-3 px-3">Major function impaired; significant risk detected</td>
                <td className="py-3 px-3">4 hours (business hours)</td>
                <td className="py-3 px-3">Next business day</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-3 px-3 text-yellow-400 font-medium">Medium</td>
                <td className="py-3 px-3">Performance degraded; non-urgent risk</td>
                <td className="py-3 px-3">8 hours (business hours)</td>
                <td className="py-3 px-3">3 business days</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-green-400 font-medium">Low</td>
                <td className="py-3 px-3">Informational; optimisation opportunity</td>
                <td className="py-3 px-3">Next business day</td>
                <td className="py-3 px-3">5 business days</td>
              </tr>
            </tbody>
          </table>
          <p className="text-slate-500 text-xs mt-3">
            Business hours: 08:00–18:00 SAST Monday–Friday, excluding South African public holidays.
            Emergency after-hours contact: 064 529 5863 (Critical severity only).
          </p>
        </AccordionSection>

        <AccordionSection title="5. HPCSA Compliance" badge="HPCSA Required">
          <p>
            ZA Support acknowledges that the Client is subject to the ethical and professional
            obligations of the Health Professions Council of South Africa (HPCSA), including but
            not limited to the Rules of Conduct Pertaining to the Rendering of Professional Acts.
          </p>
          <p className="font-medium text-white mt-3">ZA Support undertakes to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Maintain strict confidentiality of all practice information encountered during service delivery</li>
            <li>Not access, copy, or disclose any patient records, clinical data, or medical information</li>
            <li>Ensure all personnel with physical access to practice premises are subject to confidentiality obligations</li>
            <li>Immediately notify the Client of any actual or suspected breach of confidentiality</li>
            <li>Comply with the National Health Act 61 of 2003 regarding health establishment operations</li>
            <li>Support the Client's obligations under the HPCSA Guidelines on the Keeping of Patient Records</li>
            <li>Not perform any action that could compromise the integrity of electronic health records</li>
          </ul>
          <p className="mt-3 text-slate-400">
            The Client remains solely responsible for HPCSA registration, clinical compliance,
            and patient record management. ZA Support provides IT infrastructure support only.
          </p>
        </AccordionSection>

        <AccordionSection title="6. Data Protection & POPIA Compliance" badge="POPIA Required">
          <p>
            Both Parties acknowledge their obligations under the Protection of Personal Information
            Act, 4 of 2013 (<strong>"POPIA"</strong>) and agree as follows:
          </p>
          <p className="font-medium text-white mt-3">Data collected by Scout:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Device identifiers (serial numbers, hostnames — not personal to patients)</li>
            <li>macOS version, hardware specifications, performance metrics</li>
            <li>Battery health, storage usage, network configuration status</li>
            <li>Security posture indicators (FileVault, firewall, SIP status)</li>
            <li>Installed application inventory (metadata only — no document contents)</li>
          </ul>
          <p className="font-medium text-white mt-3">Data NOT collected by Scout:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-slate-400">
            <li>Patient names, ID numbers, contact details or medical history</li>
            <li>File contents, documents, emails or communications</li>
            <li>Browser history, passwords or authentication credentials</li>
            <li>Clinical notes, prescriptions or any health record content</li>
          </ul>
          <p className="font-medium text-white mt-3">ZA Support as Operator:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Processes device data under the Client's instruction only</li>
            <li>Implements appropriate technical safeguards (encryption, access control, audit logging)</li>
            <li>Retains diagnostic data for analytical and service improvement purposes</li>
            <li>Maintains strict data confidentiality; diagnostic data is used exclusively for service delivery and is never disclosed to any third party without the Client's prior written authorisation</li>
            <li>Notifies the Client within 72 hours of any actual or suspected data breach</li>
            <li>Assists the Client in meeting data subject access requests relating to Scout data</li>
          </ul>
          <p className="text-slate-500 text-xs mt-3">
            ZA Support is registered with the Information Regulator (South Africa) and maintains
            a POPIA compliance programme. Contact details for data queries: courtney@zasupport.com.
          </p>
        </AccordionSection>

        <AccordionSection title="7. Electronic Signatures & ECTA" badge="ECTA">
          <p>
            The Parties agree that this Agreement is entered into electronically in accordance with
            the Electronic Communications and Transactions Act, 25 of 2002 (<strong>"ECTA"</strong>).
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>The Client's electronic signature (typed name + checkbox confirmation) constitutes a valid advanced electronic signature for the purposes of the Electronic Communications and Transactions Act, 25 of 2002</li>
            <li>The Agreement is concluded at the time of electronic signing by the Client</li>
            <li>A record of the signing (timestamp, IP address, signatory name) is retained for 5 years</li>
            <li>The Client may request a copy of the signed agreement at any time by emailing courtney@zasupport.com</li>
            <li>This Agreement is governed by South African law regardless of electronic transmission route</li>
          </ul>
          <p className="mt-3 text-slate-400 text-xs">
            DocuSeal e-signature (where configured) provides additional legal certainty.
            Both methods are valid under ECTA. The Client acknowledges receiving adequate opportunity
            to print or save this Agreement before signing (ECTA s22).
          </p>
        </AccordionSection>

        <AccordionSection title="8. Payment Terms">
          <ul className="list-disc list-inside space-y-1">
            <li>Monthly service fee: <strong className="text-white">R {contract.price_excl_vat.toLocaleString('en-ZA')} excl. VAT (R {contract.price_incl_vat.toLocaleString('en-ZA')} incl. 15% VAT)</strong></li>
            <li>Billing: Monthly in advance, deducted on the 25th of each calendar month, in advance</li>
            <li>Payment methods accepted: credit card or debit order (via Peach Payments — PCI-DSS compliant)</li>
            <li>First payment: due upon contract signing and service activation</li>
            <li>Late payment: 2% compound interest per month on overdue amounts (in duplum rule applies)</li>
            <li>ZA Support VAT number: {contract.za_support.vat_no} — VAT invoices issued monthly</li>
            <li>Price escalation: ZA Support may increase fees by up to 10% annually, with 60 days written notice and prior consultation with the Client to agree on the adjustment</li>
            <li>Cancellations will attract one further month of service fees. No refunds are issued for partial months.</li>
            <li>All payment processing fees are for the Client's account</li>
          </ul>
          <p className="mt-3 text-slate-400 text-xs">
            All payments processed by Peach Payments. ZA Support does not store card numbers
            or banking details.
          </p>
        </AccordionSection>

        <AccordionSection title="9. Confidentiality">
          <p>
            Each Party agrees to maintain in strict confidence all Confidential Information
            received from the other Party. <strong>Confidential Information</strong> means any
            non-public information disclosed in connection with this Agreement, including practice
            operations, patient volumes, business processes, technical systems, and pricing.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Confidential Information may only be used for the purpose of performing this Agreement</li>
            <li>Neither Party will disclose Confidential Information to any third party without prior written consent</li>
            <li>Obligations survive termination of this Agreement for 5 years</li>
            <li>Exceptions: information required to be disclosed by law, court order, or regulatory authority (with prompt prior notice where permitted)</li>
          </ul>
        </AccordionSection>

        <AccordionSection title="10. Intellectual Property">
          <p>
            Health Check Scout and all ZA Support software, reports, methodologies, and diagnostic
            tools are and remain the exclusive intellectual property of Vizibiliti Intelligent
            Solutions (Pty) Ltd.
          </p>
          <p className="mt-2">
            The Client is granted a non-exclusive, non-transferable licence to use Scout on
            agreed practice devices for the duration of this Agreement only. This licence does
            not include: modifying, reverse-engineering, sub-licensing, or distributing Scout
            to any third party.
          </p>
          <p className="mt-2">
            All diagnostic reports generated are provided to the Client for internal use.
            The Client owns data about their own devices. ZA Support retains aggregate,
            anonymised benchmark data for service improvement (not attributable to any individual).
          </p>
        </AccordionSection>

        <AccordionSection title="11. Liability & Indemnification">
          <p>
            ZA Support provides this service on an "as is" basis and accepts no liability whatsoever arising from the provision of services under this Agreement.
          </p>
          <p className="mt-2">
            ZA Support, its directors, employees, agents, and subcontractors are fully indemnified against any claim, loss, damage, liability, cost, or expense of any nature — whether direct, indirect, consequential, incidental, or special — arising from or related to:
          </p>
          <ul className="list-[lower-alpha] list-inside space-y-1 mt-2 text-slate-300">
            <li>this Agreement or the services provided hereunder;</li>
            <li>any act or omission of the Client, their patients, staff, associates, or any third party connected with the Client;</li>
            <li>loss or corruption of clinical data (the Client is solely responsible for maintaining independent backups in compliance with HPCSA record-keeping obligations);</li>
            <li>failures of third-party services, internet connectivity, power supply, hardware, or any infrastructure not owned by ZA Support;</li>
            <li>the Client's failure to implement recommended remediation actions;</li>
            <li>any regulatory action, fine, or sanction against the Client; or</li>
            <li>any claim brought by the Client's patients, associates, partners, employees, or any party related to the Client.</li>
          </ul>
          <p className="mt-3">
            The Client indemnifies ZA Support in full against all such claims, losses, and expenses, including legal costs on an attorney-and-own-client scale. This indemnity survives termination of this Agreement.
          </p>
        </AccordionSection>

        <AccordionSection title="12. Term & Termination">
          <p>
            <strong>Initial term:</strong> This Agreement commences on the date of signing for an initial fixed term of 12 months (the Initial Term) and thereafter automatically renews for successive 12-month periods unless terminated in accordance with this clause.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Client termination:</strong> 30 days written notice by email to courtney@zasupport.com. Termination takes effect at end of the billing month in which the notice period expires.</li>
            <li><strong>ZA Support termination:</strong> 30 days written notice, or immediately for: non-payment (outstanding more than 30 days), Client's material breach, or insolvency.</li>
            <li><strong>On termination:</strong> ZA Support will uninstall Scout from all devices within 14 days. Client data will be deleted within 30 days of termination (on written request).</li>
            <li><strong>Minimum term:</strong> 12 months. Early cancellation by the Client prior to the expiry of the Initial Term or any renewal term does not relieve the Client of payment obligations for the remaining months of that term. A cancellation notice will result in one further month of service fees being due.</li>
          </ul>
        </AccordionSection>

        <AccordionSection title="13. Dispute Resolution">
          <p>
            The Parties agree to resolve disputes in good faith through the following process:
          </p>
          <ol className="list-decimal list-inside space-y-2 mt-2">
            <li>Written notice of dispute to the other Party</li>
            <li>Good faith negotiation within 14 days of notice</li>
            <li>If unresolved: mediation by a mutually agreed mediator in Johannesburg</li>
            <li>If mediation fails: arbitration under AFSA (Arbitration Foundation of Southern Africa) rules, seat Johannesburg, conducted in English</li>
          </ol>
          <p className="mt-2 text-slate-400 text-sm">
            Nothing prevents either Party from seeking urgent interim relief from a court of
            competent jurisdiction. The costs of any dispute resolution process are borne equally
            unless the arbitrator orders otherwise.
          </p>
          <p className="mt-2 text-slate-300 text-sm">
            For disputes falling within the monetary jurisdiction of the Small Claims Court, the Parties may elect to refer the matter to the Small Claims Court, Randburg. Any other legal proceedings shall be instituted in the Magistrate's Court, Randburg, or the High Court of South Africa, Gauteng Division, Johannesburg, as appropriate.
          </p>
        </AccordionSection>

        <AccordionSection title="14. Governing Law & Jurisdiction">
          <p>
            This Agreement is governed by and construed in accordance with the laws of the
            Republic of South Africa. The Parties consent to the non-exclusive jurisdiction of
            the High Court of South Africa, Gauteng Division, Johannesburg, for any disputes
            not resolved by arbitration under clause 13.
          </p>
          <p className="mt-2">
            The Parties consent to the jurisdiction of the Magistrate's Court, Randburg, and where applicable, the Small Claims Court, Randburg, in addition to the High Court.
          </p>
          <p className="mt-2">
            This Agreement constitutes the entire agreement between the Parties regarding its
            subject matter and supersedes all prior representations, warranties, and understandings.
            Amendments must be in writing and signed by both Parties.
          </p>
        </AccordionSection>

        <AccordionSection title="15. General Provisions">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Notices:</strong> Written notices must be sent by email or hand delivery to the contact details in clause 1. Email notices are effective on the next business day after transmission.</li>
            <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions continue in full force.</li>
            <li><strong>Waiver:</strong> Failure to enforce any right does not waive future enforcement of that right.</li>
            <li><strong>Assignment:</strong> Neither Party may assign this Agreement without the other's written consent, except ZA Support may assign to an affiliate or successor business.</li>
            <li><strong>Force Majeure:</strong> No event or circumstance — including load-shedding, natural disasters, civil unrest, or any other cause — shall excuse either Party from performing their obligations under this Agreement. Each Party is responsible for ensuring service continuity regardless of external conditions.</li>
          </ul>
        </AccordionSection>

        {/* Section 16: Add-on Services */}
        <AccordionSection title="16. Add-on Services & Upgrades" badge="Optional" defaultOpen={false}>
          <p>
            The following optional services can be added to your SLA at any time. Tick any that apply and we will be in touch to confirm pricing and scheduling.
          </p>
          <div className="space-y-3 mt-4">
            {ADD_ON_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className="flex items-start gap-3 cursor-pointer bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={addOns.includes(opt.id)}
                  onChange={() => toggleAddOn(opt.id)}
                  className="mt-0.5 w-5 h-5 accent-teal-500 shrink-0"
                />
                <div>
                  <p className="text-white text-sm font-medium">{opt.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{opt.price}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Machine Service Booking */}
          <div className="mt-6 border-t border-slate-700 pt-5">
            <p className="text-white text-sm font-medium mb-3">Machine Service Booking</p>
            <p className="text-slate-300 text-sm mb-4">
              Has your primary Mac been serviced (cleaned, thermal paste replaced) in the past 6–12 months?
            </p>
            <div className="flex gap-3 mb-4">
              {[
                { id: 'yes', label: 'Yes, recently serviced' },
                { id: 'no', label: 'No — I would like to book it in' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setServiceBooking(opt.id as 'yes' | 'no');
                    if (opt.id === 'yes') setBookingRequested(false);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    serviceBooking === opt.id
                      ? 'border-teal-500 bg-teal-950/30 text-white'
                      : 'border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {serviceBooking === 'no' && (
              <label className="flex items-start gap-3 cursor-pointer bg-slate-800/50 border border-teal-600/30 rounded-xl p-4 hover:border-teal-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={bookingRequested}
                  onChange={e => setBookingRequested(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-teal-500 shrink-0"
                />
                <div>
                  <p className="text-white text-sm font-medium">Book my Mac in for a service</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    I understand ZA Support will contact me to arrange a convenient time.
                  </p>
                  {bookingRequested && (
                    <p className="text-teal-400 text-xs mt-1">
                      Upon ticking, Courtney will be notified and Mary will reach out to schedule.
                    </p>
                  )}
                </div>
              </label>
            )}
          </div>
        </AccordionSection>

        {/* All-read confirmation */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-xl p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allRead}
              onChange={e => setAllRead(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-teal-500 shrink-0"
            />
            <span className="text-slate-300 text-sm">
              I have read and understood the full Service Level Agreement, including all 16 sections above.
              I am authorised to enter into this Agreement on behalf of the practice.
            </span>
          </label>
        </div>

        <button
          onClick={() => allRead && setStep('confirm')}
          disabled={!allRead}
          className={`mt-4 w-full font-bold py-4 rounded-xl text-base transition-colors ${
            allRead
              ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Proceed to Confirm Details →
        </button>

        {!allRead && (
          <p className="text-slate-500 text-xs text-center mt-2">
            Please read all sections and tick the confirmation box above.
          </p>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center text-slate-600 text-xs">
          <p>{contract.za_support.company}</p>
          <p className="mt-1">{contract.za_support.address}</p>
          <p className="mt-1">
            {contract.za_support.email} · {contract.za_support.phone} · VAT {contract.za_support.vat_no}
          </p>
          {contract.expires_at && (
            <p className="mt-2">
              This contract link expires{' '}
              {new Date(contract.expires_at).toLocaleDateString('en-ZA', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Nav({ contract }: { contract: ContractData }) {
  return (
    <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-white tracking-wide">ZA Support</span>
          <span className="text-slate-500 text-xs ml-2 hidden sm:inline">Medical IT Specialist</span>
        </div>
        <a
          href={`tel:${contract.za_support.phone}`}
          className="text-teal-400 text-sm font-medium hover:text-teal-300"
        >
          {contract.za_support.phone}
        </a>
      </div>
    </div>
  );
}

function CheckBox({
  checked,
  onChange,
  label,
  badge,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  badge?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 accent-teal-500 shrink-0"
      />
      <div>
        {badge && (
          <span className="bg-teal-500/20 text-teal-400 text-xs px-2 py-0.5 rounded-full border border-teal-500/30 font-medium mr-2">
            {badge}
          </span>
        )}
        <span className="text-slate-300 text-sm">{label}</span>
      </div>
    </label>
  );
}
