/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchDiagnostics, fetchDeviceSnapshots } from '@/lib/api';
import { AutoRefresh } from '@/components/auto-refresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { TrendCharts } from './TrendCharts';
import { FrustrationTimeline } from './FrustrationTimeline';
import { CreateJobButton } from './CreateJobButton';

// Make client_id a clickable link to the client profile

export default async function DeviceDetailPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const [diag, snapshots] = await Promise.all([fetchDiagnostics(serial), fetchDeviceSnapshots(serial)]);

  if (!diag) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Device: {serial}</h1>
        <p className="text-slate-400">No diagnostic data found for this device.</p>
      </div>
    );
  }

  const snap = diag.latest_snapshot;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={300000} />
      <h1 className="text-2xl font-bold text-white">{diag.hostname || serial}</h1>

      {/* Hardware overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Serial', value: diag.serial },
          { label: 'Client', value: diag.client_id, href: diag.client_id ? `/clients/${diag.client_id}` : undefined },
          { label: 'Model', value: diag.model },
          { label: 'Chip', value: diag.chip_type?.replace('_', ' ') },
          { label: 'CPU', value: diag.cpu },
          { label: 'RAM', value: diag.ram_gb ? `${diag.ram_gb} GB` : null },
          { label: 'Storage', value: diag.storage_gb ? `${diag.storage_gb} GB` : null },
          { label: 'macOS', value: diag.macos_version },
        ].map(({ label, value, href }: any) => (
          <Card key={label} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-1"><CardTitle className="text-xs text-slate-400">{label}</CardTitle></CardHeader>
            <CardContent>
              {href ? (
                <Link href={href} className="text-sm text-teal-400 hover:text-teal-300 font-medium">{value || '—'}</Link>
              ) : (
                <p className="text-sm text-white font-medium">{value || '—'}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest snapshot */}
      {snap && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">Latest Diagnostic Snapshot</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Scan Date', value: snap.scan_date ? new Date(snap.scan_date).toLocaleString('en-ZA') : null },
                { label: 'Risk Score', value: snap.risk_score ?? '—' },
                { label: 'Risk Level', value: snap.risk_level },
                { label: 'Recommendations', value: snap.recommendation_count },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-sm text-white font-medium">{value ?? '—'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshot history */}
      {snapshots.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">Diagnostic History ({snapshots.length} runs)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshots.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/devices/${serial}/snapshot/${s.id}`}
                  className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0 hover:bg-slate-700/40 rounded px-2 -mx-2 transition-colors"
                >
                  <span className="text-sm text-slate-300">{new Date(s.scan_date).toLocaleString('en-ZA')}</span>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Risk: {s.risk_score ?? '—'}</span>
                    <span>Recs: {s.recommendation_count ?? 0}</span>
                    <span className="text-slate-500">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 20 — Environment Intelligence */}
      {(snap?.time_machine_status || snap?.ccc_installed || snap?.remote_access_tools) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">Environment — Phase 20</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                {
                  label: 'Time Machine',
                  value: snap.time_machine_status,
                  highlight: snap.time_machine_status?.toLowerCase() === 'enabled' ? 'green'
                    : snap.time_machine_status?.toLowerCase() === 'disabled' ? 'red' : undefined
                },
                { label: 'TM Backup Dest', value: snap.time_machine_dest },
                { label: 'TM Last Backup', value: snap.time_machine_last },
                {
                  label: 'TM Days Ago',
                  value: snap.time_machine_days_ago != null ? `${snap.time_machine_days_ago}d` : null,
                  highlight: snap.time_machine_days_ago != null
                    ? (snap.time_machine_days_ago > 7 ? 'red' : snap.time_machine_days_ago > 3 ? 'yellow' : 'green')
                    : undefined
                },
                {
                  label: 'CCC Installed',
                  value: snap.ccc_installed,
                  highlight: snap.ccc_installed?.toLowerCase() === 'yes' ? 'green' : undefined
                },
                { label: 'CCC Last Backup', value: snap.ccc_last_backup },
                {
                  label: 'CCC Status',
                  value: snap.ccc_backup_status,
                  highlight: snap.ccc_backup_status?.toLowerCase() === 'ok' ? 'green'
                    : snap.ccc_backup_status && snap.ccc_backup_status.toLowerCase() !== 'ok' ? 'red' : undefined
                },
                { label: 'Cloud Sync Running', value: snap.cloud_sync_running },
              ].filter(f => f.value).map(({ label, value, highlight }: any) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-sm font-medium ${
                    highlight === 'green' ? 'text-green-400'
                    : highlight === 'red' ? 'text-red-400'
                    : highlight === 'yellow' ? 'text-yellow-400'
                    : 'text-white'
                  }`}>{value}</p>
                </div>
              ))}
            </div>
            {snap.remote_access_tools && snap.remote_access_tools !== 'NONE' && snap.remote_access_tools !== '' && (
              <div className="mt-2 rounded-md bg-orange-500/10 border border-orange-500/30 px-3 py-2 text-xs text-orange-300">
                Remote access tools detected: {snap.remote_access_tools}
              </div>
            )}
            {snap.subscription_apps && snap.subscription_apps !== 'NONE' && snap.subscription_apps !== '' && (
              <div className="mt-2 rounded-md bg-slate-700/50 border border-slate-600 px-3 py-2 text-xs text-slate-300">
                Subscription apps: {snap.subscription_apps}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 23 — App Intelligence */}
      {snap?.app_intelligence_grade && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">App Intelligence — Phase 23</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'App Health Grade', value: snap.app_intelligence_grade },
                { label: 'Score (0–100)', value: snap.app_intelligence_score ?? '—' },
                { label: 'Crashes / 7d', value: snap.app_crash_count_7d ?? '—' },
                { label: 'Unsigned Apps', value: snap.app_unsigned_count ?? '—' },
                { label: 'Stale Apps (365d)', value: snap.app_stale_count_365d ?? '—' },
                { label: 'Total Installed', value: snap.app_total_installed ?? '—' },
                { label: 'Network Active', value: snap.app_network_active_count ?? '—' },
                { label: 'LaunchAgents', value: snap.app_launchagents_count ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-sm font-medium ${label === 'App Health Grade' ? (
                    value === 'A' ? 'text-green-400' :
                    value === 'B' ? 'text-teal-400' :
                    value === 'C' ? 'text-yellow-400' :
                    value === 'D' ? 'text-orange-400' : 'text-red-400'
                  ) : 'text-white'}`}>{value ?? '—'}</p>
                </div>
              ))}
            </div>

            {snap.app_medical_detected && snap.app_medical_detected !== 'none' && snap.app_medical_detected !== '' && (
              <div className="mt-2 rounded-md bg-teal-500/10 border border-teal-500/30 px-3 py-2 text-xs text-teal-300">
                Medical software detected: {snap.app_medical_detected}
              </div>
            )}

            {snap.app_cpu_top10 && Array.isArray(snap.app_cpu_top10) && snap.app_cpu_top10.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Top CPU Consumers</p>
                <div className="space-y-1">
                  {snap.app_cpu_top10.slice(0, 5).map((app: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-300 font-mono">{app.name || app.comm || app}</span>
                      {app.cpu && <span className="text-orange-400">{app.cpu}% CPU</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {snap.app_ram_top10 && Array.isArray(snap.app_ram_top10) && snap.app_ram_top10.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Top RAM Consumers</p>
                <div className="space-y-1">
                  {snap.app_ram_top10.slice(0, 5).map((app: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-300 font-mono">{app.name || app.comm || app}</span>
                      {app.rss_mb && <span className="text-purple-400">{app.rss_mb} MB</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 26 — Network + Bluetooth */}
      {(snap?.wifi_security || snap?.primary_ip || snap?.bt_enabled) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">Network &amp; Bluetooth — Phase 26</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'WiFi SSID', value: snap.wifi_ssid },
                { label: 'WiFi Security', value: snap.wifi_security, highlight: snap.wifi_security === 'wpa2' ? 'yellow' : snap.wifi_security === 'wpa3' ? 'green' : undefined },
                { label: 'WiFi Band', value: snap.wifi_band },
                { label: 'RSSI (dBm)', value: snap.wifi_rssi_dbm },
                { label: 'Primary IP', value: snap.primary_ip },
                { label: 'Gateway', value: snap.network_gateway },
                { label: 'Bytes In (boot)', value: snap.primary_iface_bytes_in ? Number(snap.primary_iface_bytes_in).toLocaleString() : null },
                { label: 'Bytes Out (boot)', value: snap.primary_iface_bytes_out ? Number(snap.primary_iface_bytes_out).toLocaleString() : null },
              ].filter(f => f.value).map(({ label, value, highlight }: any) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-sm font-medium ${highlight === 'green' ? 'text-green-400' : highlight === 'yellow' ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>
            {snap.bt_enabled && (
              <div className="border-t border-slate-700 pt-4 mt-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Bluetooth</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <p className={`text-sm font-medium ${snap.bt_enabled?.toLowerCase() === 'yes' ? 'text-green-400' : 'text-slate-400'}`}>{snap.bt_enabled}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Paired Devices</p>
                    <p className="text-sm font-medium text-white">{snap.bt_paired_device_count ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Connected</p>
                    <p className="text-sm font-medium text-white">{snap.bt_connected_count ?? '—'}</p>
                  </div>
                </div>
                {snap.bt_devices && Array.isArray(snap.bt_devices) && snap.bt_devices.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Paired Device List</p>
                    <div className="space-y-1">
                      {snap.bt_devices.slice(0, 6).map((dev: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-300">{dev.name || dev.device || JSON.stringify(dev)}</span>
                          {dev.battery_pct != null && (
                            <span className={dev.battery_pct < 20 ? 'text-red-400' : 'text-slate-400'}>{dev.battery_pct}%</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 29 — IOKit Advanced Intelligence */}
      {(snap?.hid_idle_secs || snap?.mem_pressure_level || snap?.quarantine_bypassed_count != null || snap?.kext_third_party_count != null || snap?.gpu_renderer_util_pct != null || snap?.pacc_temp_c) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">IOKit Advanced Intelligence — Phase 29</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {/* Security signals */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Security</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Quarantine Bypassed',
                    value: snap.quarantine_bypassed_count != null ? `${snap.quarantine_bypassed_count} item(s)` : null,
                    highlight: Number(snap.quarantine_bypassed_count) > 0 ? 'red' : 'green'
                  },
                  {
                    label: '3rd-Party Kexts',
                    value: snap.kext_third_party_count != null ? String(snap.kext_third_party_count) : null,
                    highlight: Number(snap.kext_third_party_count) > 5 ? 'yellow' : undefined
                  },
                  {
                    label: 'Apple HW Diagnostics',
                    value: snap.diag_selftest_result || null,
                    highlight: String(snap.diag_selftest_result || '').toUpperCase() === 'PASS' ? 'green'
                      : snap.diag_selftest_result && !['PASS','N/A','NEVER',''].includes(String(snap.diag_selftest_result).toUpperCase()) ? 'red' : undefined
                  },
                  {
                    label: 'TM Backup Ratio',
                    value: snap.tm_backup_ratio || null,
                    highlight: String(snap.tm_backup_ratio || '').toLowerCase().includes('small') ? 'yellow' : 'green'
                  },
                ].filter(f => f.value != null).map(({ label, value, highlight }: any) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className={`text-sm font-medium ${highlight === 'green' ? 'text-green-400' : highlight === 'red' ? 'text-red-400' : highlight === 'yellow' ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory & System */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Memory &amp; System</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Memory Pressure',
                    value: snap.mem_pressure_level || null,
                    highlight: snap.mem_pressure_level === 'critical' || snap.mem_pressure_level === 'fatal' ? 'red'
                      : snap.mem_pressure_level === 'warning' ? 'yellow' : 'green'
                  },
                  { label: 'HID Idle (s)', value: snap.hid_idle_secs != null ? String(snap.hid_idle_secs) : null },
                  { label: 'WiFi BSSID', value: snap.wifi_bssid || null },
                  { label: 'WiFi PHY Mode', value: snap.wifi_phy_mode || null },
                ].filter(f => f.value != null).map(({ label, value, highlight }: any) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className={`text-sm font-medium ${highlight === 'green' ? 'text-green-400' : highlight === 'red' ? 'text-red-400' : highlight === 'yellow' ? 'text-yellow-400' : 'text-white font-mono'}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GPU */}
            {snap.gpu_renderer_util_pct != null && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">GPU (IOAccelerator)</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Renderer Util', value: snap.gpu_renderer_util_pct != null ? `${snap.gpu_renderer_util_pct}%` : null },
                    { label: 'Tiler Util', value: snap.gpu_tiler_util_pct != null ? `${snap.gpu_tiler_util_pct}%` : null },
                    { label: 'Core Clock', value: snap.gpu_core_clock_mhz != null ? `${snap.gpu_core_clock_mhz} MHz` : null },
                    { label: 'Mem Clock', value: snap.gpu_mem_clock_mhz != null ? `${snap.gpu_mem_clock_mhz} MHz` : null },
                  ].filter(f => f.value != null).map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className="text-sm font-medium text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apple Silicon Topology */}
            {(snap.pacc_temp_c || snap.ane_temp_c || snap.p_core_count_ioreg) && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Apple Silicon Topology</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'P-Cluster Temp', value: snap.pacc_temp_c != null ? `${snap.pacc_temp_c}°C` : null, highlight: Number(snap.pacc_temp_c) > 80 ? 'red' : Number(snap.pacc_temp_c) > 65 ? 'yellow' : undefined },
                    { label: 'E-Cluster Temp', value: snap.eacc_temp_c != null ? `${snap.eacc_temp_c}°C` : null },
                    { label: 'ANE Temp', value: snap.ane_temp_c != null ? `${snap.ane_temp_c}°C` : null, highlight: Number(snap.ane_temp_c) > 75 ? 'red' : undefined },
                    { label: 'SOC Avg Temp', value: snap.soc_avg_temp_c != null ? `${snap.soc_avg_temp_c}°C` : null },
                    { label: 'P-Cores (IOKit)', value: snap.p_core_count_ioreg != null ? String(snap.p_core_count_ioreg) : null },
                    { label: 'E-Cores (IOKit)', value: snap.e_core_count_ioreg != null ? String(snap.e_core_count_ioreg) : null },
                  ].filter(f => f.value != null).map(({ label, value, highlight }: any) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className={`text-sm font-medium ${highlight === 'red' ? 'text-red-400' : highlight === 'yellow' ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trend charts */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Historical Trends</h2>
        <TrendCharts serial={serial} />
      </div>

      {/* Frustration timeline */}
      <FrustrationTimeline serial={serial} />

      {/* Report download + workshop job */}
      {diag.client_id && (
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`/api/reports/${diag.client_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
          >
            Download Health Check Report (PDF)
          </a>
          <CreateJobButton clientId={diag.client_id} serial={serial} />
        </div>
      )}

      {/* First/last seen */}
      <div className="text-xs text-slate-500">
        First seen: {diag.first_seen ? new Date(diag.first_seen).toLocaleString('en-ZA') : '—'} ·
        Last seen: {diag.last_seen ? new Date(diag.last_seen).toLocaleString('en-ZA') : '—'}
      </div>
    </div>
  );
}
