/**
 * /diagnostics — Public page for clients.
 * No login required. Links to the PKG download and explains what the Health Check does.
 * Per §48: clients visit this URL instead of receiving Terminal commands.
 */

import Link from 'next/link';

const PKG_DOWNLOAD_URL = 'https://dashboard.zasupport.com/install';
const BACKEND_URL = 'https://api.zasupport.com';

async function fetchInfo() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/diagnostics/info`, {
      next: { revalidate: 300 },
    });
    if (res.ok) return await res.json();
  } catch {
    // info endpoint not critical — page works without it
  }
  return null;
}

export default async function DiagnosticsPage() {
  const info = await fetchInfo();
  const version = info?.version ?? '4.7.0';

  const phases = [
    { icon: '💻', title: 'Hardware overview', desc: 'Model, memory, storage, processor, battery health.' },
    { icon: '🔒', title: 'Security posture', desc: 'FileVault, Firewall, System Integrity Protection, Gatekeeper.' },
    { icon: '🦠', title: 'Malware scan', desc: 'Checks for known threats, suspicious apps, and unsigned software.' },
    { icon: '🔋', title: 'Battery & performance', desc: 'Cycle count, capacity, temperature, fan speeds.' },
    { icon: '💾', title: 'Storage health', desc: 'Disk usage, SMART status, duplicate files recoverable.' },
    { icon: '🌐', title: 'Network & Wi-Fi', desc: 'Connection security, signal strength, DNS, firewall rules.' },
    { icon: '☁️', title: 'Backup status', desc: 'Time Machine, Carbon Copy Cloner — last backup date and health.' },
    { icon: '📋', title: 'Software inventory', desc: 'Installed apps, outdated software, subscription overlap.' },
  ];

  const notCollected = [
    'Passwords, keys, or credentials',
    'Photos, documents, or personal files',
    'Browsing history or private data',
    'Banking or financial information',
    'Email content',
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <span className="text-teal-400 font-bold text-lg tracking-tight">ZA Support</span>
            <span className="text-slate-500 text-sm ml-2">Health Check Scout</span>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
            v{version}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">

        {/* Hero */}
        <section className="space-y-4">
          <h1 className="text-3xl font-bold text-white leading-tight">
            Run your Mac&apos;s Health Check
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            The ZA Support Health Check Scout scans your Mac and sends a full diagnostic report to
            your ZA Support technician. It takes about 2–3 minutes and runs automatically in the
            background — no Terminal required.
          </p>
          <a
            href={PKG_DOWNLOAD_URL}
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Download Health Check Scout
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          <p className="text-slate-500 text-xs">
            macOS 10.15 Catalina or later &middot; Apple Silicon and Intel supported &middot; No installation required
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">How it works</h2>
          <ol className="space-y-3">
            {[
              { step: '1', text: 'Download and open the Health Check Scout package above.' },
              { step: '2', text: 'Enter your Mac password when prompted — this allows the diagnostic to read system information.' },
              { step: '3', text: 'The scan runs in the background for 2–3 minutes.' },
              { step: '4', text: 'Your technician receives the report automatically. You will hear from us shortly.' },
            ].map(({ step, text }) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {step}
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* What it checks */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">What the Health Check looks at</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {phases.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className="text-white text-sm font-medium">{title}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What it does NOT collect */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">What it does not collect</h2>
          <ul className="space-y-2">
            {notCollected.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-400">
                <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* POPIA notice */}
        <section className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-teal-400 text-sm font-semibold">Your data is stored securely in South Africa</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Diagnostic data is stored on servers located in South Africa, managed by ZA Support
            (Vizibiliti Intelligent Solutions (Pty) Ltd). Your information is processed in accordance
            with the Protection of Personal Information Act (POPIA). Data is used solely for the
            purpose of diagnosing and improving your Mac&apos;s performance and security. It is never sold
            or shared with third parties.
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-400">ZA Support — Medical IT Specialist</p>
            <p>Vizibiliti Intelligent Solutions (Pty) Ltd</p>
            <p>1 Hyde Park Lane, Hyde Park, Johannesburg</p>
          </div>
          <div className="text-xs text-slate-500 space-y-1 sm:text-right">
            <p>
              <a href="tel:0645295863" className="hover:text-teal-400 transition-colors">064 529 5863</a>
            </p>
            <p>
              <a href="mailto:courtney@zasupport.com" className="hover:text-teal-400 transition-colors">
                courtney@zasupport.com
              </a>
            </p>
            <p>
              <Link href="https://zasupport.com" className="hover:text-teal-400 transition-colors">
                zasupport.com
              </Link>
            </p>
          </div>
        </footer>

      </div>
    </main>
  );
}
