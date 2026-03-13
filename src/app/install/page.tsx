export const dynamic = 'force-dynamic';

const API_URL = 'https://api.zasupport.com';
const DOWNLOAD_URL = `${API_URL}/api/v1/agent/pkg/download/public`;
const FALLBACK_VERSION = '4.7.0';

async function fetchPkgVersion(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/api/v1/agent/pkg/latest`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return FALLBACK_VERSION;
    const data = await res.json();
    return data.version || FALLBACK_VERSION;
  } catch {
    return FALLBACK_VERSION;
  }
}

export default async function InstallPage() {
  const pkgVersion = await fetchPkgVersion();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#27504D] p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center">

        {/* Logo / Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-[#27504D] rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-9 h-9 text-[#0FEA7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-[#27504D] mb-1">
          ZA Support Health Check
        </h1>
        <p className="text-xs text-gray-400 mb-1 font-mono">Version {pkgVersion}</p>
        <p className="text-gray-500 text-sm mb-7 leading-relaxed">
          A fully automated 10–15 minute scan of your Mac.<br />
          No browsing required — just install and leave it to run.
        </p>

        {/* Download Button */}
        <a
          href={DOWNLOAD_URL}
          className="block w-full bg-[#0FEA7A] text-[#27504D] font-bold py-4 rounded-xl text-base hover:brightness-105 active:scale-[0.98] transition-all mb-8 shadow-md"
        >
          Download for Mac
        </a>

        {/* Install Steps */}
        <div className="text-left space-y-3 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            How to install
          </p>
          {[
            'Double-click the downloaded file to open it.',
            'Click Continue through the installer steps.',
            'Enter your Mac password when asked (this is normal).',
            'Leave your Mac on for 10–15 minutes — the scan runs automatically.',
            'Done. Your report will be ready shortly.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#27504D] text-[#0FEA7A] text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-600 leading-snug">{step}</p>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Requirements
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-[#0FEA7A] font-bold">✓</span> macOS 10.15 (Catalina) or later
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#0FEA7A] font-bold">✓</span> Intel or Apple Silicon Mac
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#0FEA7A] font-bold">✓</span> Admin password to install
            </li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-300 mb-1">
          zasupport.com &nbsp;·&nbsp; 064 529 5863
        </p>
        <p className="text-xs text-[#27504D] font-semibold">
          Practice IT. Perfected.
        </p>
      </div>
    </main>
  );
}
