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

type PortalIntervention = {
  action_type: string;
  label: string;
  description: string;
  alert_label: string | null;
  value_rand: number | null;
  date: string | null;
};

type Recommendation = {
  name: string;
  description: string;
  price_rand: number | null;
};

type PortalData = {
  client: { first_name: string; business_name: string | null; status: string };
  recent_interventions?: PortalIntervention[];
  recommendations?: Recommendation[];
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

  const { client, latest_scan, open_jobs, roi_summary, cybershield, za_support, devices = [], recent_interventions = [], recommendations = [] } = data;
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

        {/* Recent Automated Actions */}
        {recent_interventions.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-1 text-base">
              What ZA Support Did For You
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              These actions happened automatically — you didn't need to do anything.
            </p>
            <div className="space-y-0">
              {recent_interventions.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-[#27504D] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{item.label}</span>
                      {item.alert_label && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {item.alert_label}
                        </span>
                      )}
                      {item.value_rand && (
                        <span className="text-xs font-semibold text-[#27504D]">
                          R {item.value_rand >= 1000
                            ? `${(item.value_rand / 1000).toFixed(0)}k`
                            : Math.round(item.value_rand)} protected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{item.date}</span>
                </div>
              ))}
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

        {/* Recommendations from last scan */}
        {recommendations.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-1 text-base">
              Recommendations From Your Last Scan
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Based on what we found — tailored to your setup.
            </p>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="rounded-lg border border-[#27504D]/20 bg-[#27504D]/5 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#27504D]">{rec.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{rec.description}</p>
                    </div>
                    {rec.price_rand !== null && (
                      <span className="text-sm font-bold text-[#27504D] shrink-0">
                        R {rec.price_rand.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Reply via WhatsApp or call 064 529 5863 to discuss any of these.
            </p>
          </section>
        )}

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

        {/* Contact CTA */}
        <section className="bg-[#27504D] rounded-xl p-5 text-center">
          <p className="text-[#0FEA7A] text-xs font-semibold tracking-widest uppercase mb-1">
            Need anything?
          </p>
          <p className="text-white font-semibold text-base mb-1">
            ZA Support is one message away.
          </p>
          <p className="text-slate-300 text-xs mb-4">
            For questions, bookings, or upgrades — WhatsApp or call Courtney directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/27645295863?text=${encodeURIComponent('Hi Courtney, I was looking at my ZA Support health portal and had a question.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#20ba59] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp Courtney
            </a>
            <a
              href={`tel:+27645295863`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.1 6.1l1.06-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              064 529 5863
            </a>
          </div>
        </section>

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
