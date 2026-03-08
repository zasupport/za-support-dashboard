import { notFound } from 'next/navigation';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';

type PortalDevice = {
  id: string;
  display_name: string;
  device_type: string;
  make: string;
  model: string;
  age_years: number | null;
  expected_lifespan: number | null;
  lifecycle_pct: number | null;
  replacement_urgency: string;
  replacement_rec: string | null;
  replacement_due: string | null;
  warranty_expires: string | null;
  applecare_expires: string | null;
};

type PortalData = {
  client: { first_name: string; business_name: string | null; status: string };
  latest_scan: {
    scan_date: string;
    risk_level: string;
    risk_score: number;
    macos_version: string;
    battery_health_pct: number | null;
    storage_free_gb: number | null;
    time_machine_status: string | null;
    ccc_backup_status: string | null;
    days_since_scan: number;
  } | null;
  open_jobs: { title: string; status: string; priority: string }[];
  roi_summary: {
    lifetime_value_protected: number;
    total_automated_actions: number;
    total_hours_saved: number;
  };
  cybershield: { active: boolean; tier: string | null };
  za_support: { email: string; phone: string; website: string };
  devices: PortalDevice[];
};

async function getPortalData(token: string): Promise<PortalData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/clients/portal/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function RiskBadge({ level }: { level: string }) {
  const colours: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border border-red-300',
    high: 'bg-orange-100 text-orange-800 border border-orange-300',
    moderate: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    low: 'bg-green-100 text-green-800 border border-green-300',
  };
  const cls = colours[level?.toLowerCase()] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${cls}`}>
      {level ?? 'Unknown'}
    </span>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-medium ${ok ? 'text-green-700' : 'text-amber-700'}`}>
        {value}
      </span>
    </div>
  );
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPortalData(token);

  if (!data) return notFound();

  const { client, latest_scan, open_jobs, roi_summary, cybershield, za_support, devices = [] } = data;
  const scanDate = latest_scan?.scan_date
    ? new Date(latest_scan.scan_date).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const formatR = (n: number) =>
    `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#27504D] text-white px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-start justify-between">
          <div>
            <p className="text-[#0FEA7A] text-xs font-semibold tracking-widest uppercase mb-1">
              ZA Support — Practice IT. Perfected.
            </p>
            <h1 className="text-xl font-bold">
              Health Check Overview
            </h1>
            <p className="text-slate-300 text-sm mt-0.5">
              {client.business_name ?? client.first_name}
            </p>
          </div>
          <div className="text-right text-xs text-slate-300 mt-1">
            <p>{za_support.phone}</p>
            <p>{za_support.email}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Health Status Card */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4 text-base">Current Health Status</h2>

          {latest_scan ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <RiskBadge level={latest_scan.risk_level} />
                <span className="text-2xl font-bold text-slate-800">
                  {latest_scan.risk_score}/100
                </span>
                <span className="text-sm text-slate-500">risk score</span>
              </div>

              <div className="space-y-0">
                <StatusRow
                  label="Last scan"
                  value={`${scanDate} (${latest_scan.days_since_scan} days ago)`}
                  ok={latest_scan.days_since_scan < 30}
                />
                <StatusRow
                  label="macOS"
                  value={latest_scan.macos_version ?? 'Unknown'}
                  ok={true}
                />
                {latest_scan.battery_health_pct !== null && (
                  <StatusRow
                    label="Battery health"
                    value={`${latest_scan.battery_health_pct}%`}
                    ok={latest_scan.battery_health_pct >= 80}
                  />
                )}
                {latest_scan.storage_free_gb !== null && (
                  <StatusRow
                    label="Storage free"
                    value={`${latest_scan.storage_free_gb} GB`}
                    ok={latest_scan.storage_free_gb > 20}
                  />
                )}
                {latest_scan.time_machine_status && (
                  <StatusRow
                    label="Time Machine backup"
                    value={latest_scan.time_machine_status}
                    ok={latest_scan.time_machine_status.toLowerCase().includes('on')}
                  />
                )}
                {latest_scan.ccc_backup_status && (
                  <StatusRow
                    label="CCC backup"
                    value={latest_scan.ccc_backup_status}
                    ok={latest_scan.ccc_backup_status.toLowerCase().includes('ok') || latest_scan.ccc_backup_status.toLowerCase().includes('recent')}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No diagnostic scan on record yet.</p>
              <p className="text-slate-400 text-xs mt-1">
                Contact ZA Support to schedule your first Health Check Scout.
              </p>
            </div>
          )}
        </section>

        {/* ROI Summary */}
        {roi_summary.total_automated_actions > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4 text-base">
              What ZA Support Has Done For You
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#27504D]">
                  {roi_summary.total_automated_actions}
                </p>
                <p className="text-xs text-slate-500 mt-1">Automated<br />actions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#27504D]">
                  {roi_summary.total_hours_saved.toFixed(0)}h
                </p>
                <p className="text-xs text-slate-500 mt-1">Hours saved<br />for you</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#27504D]">
                  {formatR(roi_summary.lifetime_value_protected)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Value<br />protected</p>
              </div>
            </div>
          </section>
        )}

        {/* Open Jobs */}
        {open_jobs.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-3 text-base">
              Open Service Items
            </h2>
            <div className="space-y-2">
              {open_jobs.map((job, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700">{job.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    job.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CyberShield */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3 text-base">Network Security</h2>
          {cybershield.active ? (
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></span>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  CyberShield {cybershield.tier} — Active
                </p>
                <p className="text-xs text-slate-500">
                  Real-time threat monitoring is running.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-slate-300 flex-shrink-0"></span>
              <div>
                <p className="text-sm text-slate-600">CyberShield not active</p>
                <p className="text-xs text-slate-400">
                  Contact ZA Support to add real-time network protection.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Device Health */}
        {devices.length > 0 && (() => {
          const urgentDevices = devices.filter(d =>
            d.replacement_urgency === 'critical' || d.replacement_urgency === 'overdue'
          );
          const URGENCY_LABEL: Record<string, string> = {
            critical: 'CRITICAL', overdue: 'OVERDUE', soon: 'SOON', watch: 'WATCH', none: 'OK',
          };
          const URGENCY_BADGE: Record<string, string> = {
            critical: 'bg-red-100 text-red-800 border border-red-200',
            overdue:  'bg-orange-100 text-orange-800 border border-orange-200',
            soon:     'bg-yellow-100 text-yellow-800 border border-yellow-200',
            watch:    'bg-blue-100 text-blue-800 border border-blue-200',
            none:     'bg-green-100 text-green-800 border border-green-200',
          };
          const URGENCY_DOT: Record<string, string> = {
            critical: 'bg-red-500', overdue: 'bg-orange-500', soon: 'bg-yellow-500',
            watch: 'bg-blue-500', none: 'bg-green-500',
          };
          return (
            <section className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-1 text-base">Your Devices</h2>
              <p className="text-xs text-slate-500 mb-4">
                {devices.length} device{devices.length !== 1 ? 's' : ''} tracked by ZA Support
              </p>

              {urgentDevices.length > 0 && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-orange-800 font-semibold text-sm mb-1">
                    Ready for an Upgrade?
                  </p>
                  <p className="text-orange-700 text-xs leading-relaxed">
                    {urgentDevices.length} of your device{urgentDevices.length !== 1 ? 's are' : ' is'} past the recommended replacement window. When you upgrade through ZA Support, we handle everything — data migration, full setup, and Health Check monitoring active from day one.
                  </p>
                  <p className="text-orange-600 text-xs mt-2 font-medium">
                    Contact us: {za_support.phone} · {za_support.email}
                  </p>
                </div>
              )}

              <div className="space-y-0">
                {devices.map((d) => {
                  const urgency = d.replacement_urgency in URGENCY_LABEL ? d.replacement_urgency : 'none';
                  const pct = d.lifecycle_pct ?? 0;
                  const barColor = pct >= 120 ? 'bg-red-500' : pct >= 100 ? 'bg-orange-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-emerald-500';
                  return (
                    <div key={d.id} className="py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_DOT[urgency]}`} />
                            <span className="text-sm font-medium text-slate-800 truncate">{d.display_name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${URGENCY_BADGE[urgency]}`}>
                              {URGENCY_LABEL[urgency]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 ml-4">{d.make} {d.model}</p>
                          {d.lifecycle_pct != null && (
                            <div className="ml-4 mt-1.5 max-w-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${barColor}`}
                                    style={{ width: `${Math.min(d.lifecycle_pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 w-10 text-right">
                                  {Math.round(d.lifecycle_pct)}%
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                of expected lifespan used
                              </p>
                            </div>
                          )}
                          {d.replacement_rec && (
                            <p className="text-xs text-slate-500 mt-1 ml-4 italic">{d.replacement_rec}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          {d.age_years != null && (
                            <p className="text-xs text-slate-600">
                              {d.age_years.toFixed(1)}y old
                              {d.expected_lifespan ? ` / ${d.expected_lifespan}y life` : ''}
                            </p>
                          )}
                          {d.replacement_due && (
                            <p className="text-xs text-slate-400">
                              Due {new Date(d.replacement_due).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                          {d.applecare_expires && (
                            <p className="text-xs text-slate-400">
                              AppleCare {new Date(d.applecare_expires).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pb-4 space-y-1">
          <p className="font-medium text-slate-500">ZA Support — Practice IT. Perfected.</p>
          <p>{za_support.phone} · {za_support.email} · {za_support.website}</p>
          <p className="mt-2">
            This is a read-only view of your IT health status. For support, contact us directly.
          </p>
        </footer>
      </div>
    </main>
  );
}
