/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchClient, fetchClientDevices, fetchClientRawData, fetchDeviceSnapshotHistory, fetchSnapshot } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Helpers ──────────────────────────────────────────────────────────────────

function Row({ label, value, highlight }: { label: string; value?: string | number | boolean | null; highlight?: 'ok' | 'warn' | 'crit' }) {
  if (value == null || value === '' || value === 'NONE') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  const color = highlight === 'crit' ? 'text-red-400' : highlight === 'warn' ? 'text-yellow-400' : highlight === 'ok' ? 'text-green-400' : 'text-slate-200';
  return (
    <div className="flex gap-4 py-1 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-500 text-xs w-48 shrink-0">{label}</span>
      <span className={`text-xs font-mono ${color}`}>{display}</span>
    </div>
  );
}

function SectionBlock({ title, tier, children }: { title: string; tier: 'hot' | 'ref' | 'cold'; children: React.ReactNode }) {
  const tierBadge = {
    hot: 'bg-teal-900/30 text-teal-300 border-teal-700/30',
    ref: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
    cold: 'bg-slate-700 text-slate-400 border-slate-600',
  };
  const tierLabel = { hot: 'HOT', ref: 'REF', cold: 'COLD' };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-sm">{title}</CardTitle>
        <span className={`text-xs px-2 py-0.5 rounded border ${tierBadge[tier]}`}>{tierLabel[tier]}</span>
      </CardHeader>
      <CardContent className="space-y-0">{children}</CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ClientDataPage({ params }: { params: Promise<{ client_id: string }> }) {
  const { client_id } = await params;
  const [client, rawData] = await Promise.all([
    fetchClient(client_id),
    fetchClientRawData(client_id),
  ]);

  if (!client || (client as any)?._error) notFound();

  const { devices, snapshots, heartbeats } = rawData;

  // Fetch snapshot history for each device (cold storage view)
  const historyPromises = (devices as any[]).map(async (d: any) => {
    const history = await fetchDeviceSnapshotHistory(d.serial, 20);
    return { serial: d.serial, history: Array.isArray(history) ? history : [] };
  });
  const histories = await Promise.all(historyPromises);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/clients/${client_id}`} className="text-slate-400 text-xs hover:text-white mb-1 block">← {client.first_name} {client.last_name}</Link>
        <h1 className="text-2xl font-bold text-white">{client.first_name} {client.last_name} — Raw Data</h1>
        <p className="text-slate-400 text-sm mt-1">
          3-tier data storage: <span className="text-teal-400">HOT</span> (live diagnostics) · <span className="text-blue-400">REF</span> (summary metrics) · <span className="text-slate-300">COLD</span> (full archive)
        </p>
      </div>

      {/* Data tier legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-teal-900/20 border border-teal-700/30 rounded-md p-3">
          <p className="text-teal-400 text-xs font-bold mb-1">HOT DATA</p>
          <p className="text-slate-400 text-xs">Latest diagnostic scan + live heartbeat telemetry. Updated every 10 minutes via Scout agent. Used for real-time monitoring and alerts.</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-md p-3">
          <p className="text-blue-400 text-xs font-bold mb-1">REFERENCE DATA</p>
          <p className="text-slate-400 text-xs">Structured summary metrics extracted from diagnostics. Risk scores, device specs, PKG versions. Fast lookups for dashboards and reports.</p>
        </div>
        <div className="bg-slate-800 border border-slate-600 rounded-md p-3">
          <p className="text-slate-300 text-xs font-bold mb-1">COLD DATA</p>
          <p className="text-slate-400 text-xs">Complete diagnostic scan history with full raw JSON payloads. Every scan ever run, stored permanently for audit trails and trend analysis.</p>
        </div>
      </div>

      {devices.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-8 text-center">
            <p className="text-slate-400 text-sm">No devices registered for this client. Install Health Check PKG to start collecting data.</p>
          </CardContent>
        </Card>
      )}

      {/* Per-device data */}
      {(devices as any[]).map((device: any) => {
        const snapshot = (snapshots as any[]).find((s: any) =>
          s?.serial === device.serial || s?.latest_snapshot?.serial === device.serial
        );
        const deviceHeartbeats = (heartbeats as any[]).filter((h: any) => h?.serial === device.serial);
        const deviceHistory = histories.find(h => h.serial === device.serial)?.history ?? [];
        const p = snapshot?.raw_json ?? snapshot?.latest_snapshot?.raw_json ?? {};
        const sec = p.security ?? {};
        const hw = p.hardware ?? {};
        const bat = p.battery ?? {};
        const storage = p.storage ?? {};
        const mac = p.macos ?? {};
        const net = p.network ?? {};
        const env = p.environment ?? {};
        const recs = p.recommendations ?? [];

        return (
          <div key={device.serial} className="space-y-4">
            {/* Device header */}
            <div className="flex items-center justify-between border-b border-slate-600 pb-2">
              <div>
                <h2 className="text-lg font-bold text-white">{device.hostname || device.serial}</h2>
                <p className="text-xs text-slate-500 font-mono">{device.serial} · {device.model ?? 'Unknown'} · {device.chip_type ?? ''}</p>
              </div>
              <Link href={`/devices/${device.serial}`} className="text-xs text-teal-400 hover:text-teal-300">
                Device Detail →
              </Link>
            </div>

            {/* ═══ REFERENCE TIER: Summary cards ═══ */}
            <SectionBlock title="Device Summary" tier="ref">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">Risk Score</p>
                  <p className={`text-lg font-bold ${(snapshot?.risk_score ?? snapshot?.latest_snapshot?.risk_score ?? 0) > 60 ? 'text-red-400' : (snapshot?.risk_score ?? snapshot?.latest_snapshot?.risk_score ?? 0) > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {snapshot?.risk_score ?? snapshot?.latest_snapshot?.risk_score ?? '—'}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">PKG</p>
                  <p className="text-white text-sm font-mono">{device.pkg_version ?? '—'}</p>
                </div>
                <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">macOS</p>
                  <p className="text-slate-200 text-xs font-mono">{device.macos_version ?? mac.version ?? '—'}</p>
                </div>
                <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">Last Seen</p>
                  <p className="text-slate-200 text-xs">{device.last_seen ? new Date(device.last_seen).toLocaleString('en-ZA') : '—'}</p>
                </div>
                <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">Heartbeats (24h)</p>
                  <p className="text-white text-lg font-bold">{deviceHeartbeats.length}</p>
                </div>
              </div>
            </SectionBlock>

            {/* ═══ HOT TIER: Latest diagnostic raw data ═══ */}
            {snapshot ? (
              <>
                <SectionBlock title="Security Posture" tier="hot">
                  <Row label="FileVault" value={sec.filevault_enabled ?? sec.filevault_on ? 'Enabled' : 'Disabled'} highlight={sec.filevault_enabled ?? sec.filevault_on ? 'ok' : 'crit'} />
                  <Row label="Firewall" value={sec.firewall_enabled ?? sec.firewall_on ? 'Enabled' : 'Disabled'} highlight={sec.firewall_enabled ?? sec.firewall_on ? 'ok' : 'crit'} />
                  <Row label="SIP" value={sec.sip_enabled ? 'Enabled' : 'Disabled'} highlight={sec.sip_enabled ? 'ok' : 'crit'} />
                  <Row label="Gatekeeper" value={sec.gatekeeper_enabled ?? sec.gatekeeper_on ? 'Enabled' : 'Disabled'} highlight={sec.gatekeeper_enabled ?? sec.gatekeeper_on ? 'ok' : 'crit'} />
                  <Row label="XProtect" value={sec.xprotect_version} />
                  <Row label="Stealth mode" value={sec.stealth_mode ? 'Enabled' : 'Disabled'} />
                  <Row label="Password manager" value={sec.password_manager} />
                  <Row label="AV / EDR" value={sec.av_edr} />
                  <Row label="Remote access tools" value={sec.remote_access_tools} highlight={sec.remote_access_tools && sec.remote_access_tools !== 'none' ? 'warn' : undefined} />
                </SectionBlock>

                <SectionBlock title="Hardware" tier="hot">
                  <Row label="Model" value={hw.model ?? hw.model_name} />
                  <Row label="Chip / CPU" value={hw.chip_type ?? hw.chip ?? hw.cpu} />
                  <Row label="Cores (P/L)" value={hw.cores_physical != null ? `${hw.cores_physical}P / ${hw.cores_logical}L` : undefined} />
                  <Row label="RAM" value={hw.ram_gb ? `${hw.ram_gb} GB` : hw.ram} />
                  <Row label="Serial" value={hw.serial ?? device.serial} />
                </SectionBlock>

                {(bat.health_pct != null || bat.cycle_count != null) && (
                  <SectionBlock title="Battery" tier="hot">
                    <Row label="Health" value={bat.health_pct != null ? `${bat.health_pct}%` : bat.condition} highlight={bat.health_pct != null ? (bat.health_pct < 80 ? 'crit' : bat.health_pct < 90 ? 'warn' : 'ok') : undefined} />
                    <Row label="Cycle count" value={bat.cycle_count} />
                    <Row label="Condition" value={bat.condition} />
                    <Row label="Temperature" value={bat.temperature_c != null ? `${bat.temperature_c}°C` : undefined} />
                    <Row label="Design capacity" value={bat.design_capacity_mah ? `${bat.design_capacity_mah} mAh` : undefined} />
                    <Row label="Max capacity" value={bat.max_capacity_mah ? `${bat.max_capacity_mah} mAh` : undefined} />
                    <Row label="Charging" value={bat.is_charging != null ? (bat.is_charging ? 'Yes' : 'No') : undefined} />
                    <Row label="Charger watts" value={bat.charger_watts} />
                  </SectionBlock>
                )}

                <SectionBlock title="Storage" tier="hot">
                  <Row label="Boot disk used" value={storage.boot_disk_used_pct != null ? `${storage.boot_disk_used_pct}%` : undefined} highlight={storage.boot_disk_used_pct > 85 ? 'crit' : storage.boot_disk_used_pct > 70 ? 'warn' : 'ok'} />
                  <Row label="Free space" value={storage.free_gb != null ? `${storage.free_gb} GB` : undefined} />
                  <Row label="SMART status" value={storage.smart_status} highlight={storage.smart_status === 'Verified' ? 'ok' : 'crit'} />
                  <Row label="TRIM" value={storage.trim_enabled != null ? (storage.trim_enabled ? 'Enabled' : 'Disabled') : undefined} />
                  <Row label="APFS containers" value={storage.apfs_containers} />
                </SectionBlock>

                <SectionBlock title="macOS" tier="hot">
                  <Row label="Version" value={mac.version ?? mac.macos_version} />
                  <Row label="Build" value={mac.build} />
                  <Row label="Uptime" value={mac.uptime} />
                  <Row label="Process count" value={mac.process_count} />
                  <Row label="Kernel panics" value={mac.kernel_panics} highlight={Number(mac.kernel_panics) > 0 ? 'warn' : 'ok'} />
                </SectionBlock>

                <SectionBlock title="Network" tier="hot">
                  <Row label="Active interface" value={net.active_interface ?? net.interface} />
                  <Row label="IP address" value={net.ip ?? net.ip_address} />
                  <Row label="Gateway" value={net.gateway} />
                  <Row label="WiFi SSID" value={net.wifi_ssid ?? net.ssid} />
                  <Row label="WiFi security" value={net.wifi_security} />
                  <Row label="DNS servers" value={Array.isArray(net.dns_servers) ? net.dns_servers.join(', ') : net.dns} />
                </SectionBlock>

                {/* Environment */}
                {Object.keys(env).length > 0 && (
                  <SectionBlock title="Environment" tier="hot">
                    <Row label="Login items" value={env.login_items_count ?? (Array.isArray(env.login_items) ? env.login_items.length : undefined)} />
                    <Row label="LaunchAgents (user)" value={env.launch_agents_user_count ?? (Array.isArray(env.launch_agents_user) ? env.launch_agents_user.length : undefined)} />
                    <Row label="LaunchAgents (system)" value={env.launch_agents_system_count ?? (Array.isArray(env.launch_agents_system) ? env.launch_agents_system.length : undefined)} />
                    <Row label="Time Machine" value={env.time_machine_status ?? env.time_machine} />
                    <Row label="CCC backup" value={env.ccc_status ?? env.carbon_copy_cloner} />
                    <Row label="Cloud sync" value={env.cloud_sync} />
                  </SectionBlock>
                )}

                {/* Recommendations */}
                {recs.length > 0 && (
                  <SectionBlock title={`Recommendations (${recs.length})`} tier="hot">
                    {recs.map((r: any, i: number) => {
                      const sev = (r.severity ?? '').toUpperCase();
                      const sevCls = sev === 'CRITICAL' ? 'text-red-400 bg-red-500/10' : sev === 'HIGH' ? 'text-orange-400 bg-orange-500/10' : sev === 'MODERATE' ? 'text-yellow-400 bg-yellow-500/10' : 'text-blue-400 bg-blue-500/10';
                      return (
                        <div key={i} className="py-2 border-b border-slate-700/50 last:border-0">
                          <div className="flex items-start gap-2">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${sevCls}`}>{sev}</span>
                            <div>
                              <p className="text-xs text-slate-200 font-medium">{r.title}</p>
                              {r.evidence && <p className="text-xs text-slate-500 mt-0.5">{r.evidence}</p>}
                              {r.risk_scenario && <p className="text-xs text-slate-600 mt-0.5 italic">{r.risk_scenario}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </SectionBlock>
                )}

                {/* Raw JSON toggle */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-4">
                    <details className="rounded-md border border-slate-700">
                      <summary className="px-4 py-2 text-slate-400 text-xs cursor-pointer select-none hover:text-white">
                        Raw JSON payload ({Object.keys(p).length} sections)
                      </summary>
                      <pre className="px-4 py-3 text-slate-400 text-xs overflow-auto max-h-96 bg-slate-900 rounded-b-md">
                        {JSON.stringify(p, null, 2)}
                      </pre>
                    </details>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-6 text-center">
                  <p className="text-slate-500 text-sm">No diagnostic scan data available for this device.</p>
                </CardContent>
              </Card>
            )}

            {/* ═══ COLD TIER: Snapshot history ═══ */}
            <SectionBlock title={`Scan History (${deviceHistory.length} scans)`} tier="cold">
              {deviceHistory.length === 0 ? (
                <p className="text-slate-500 text-xs py-2">No historical scans stored.</p>
              ) : (
                <div className="space-y-0">
                  {deviceHistory.map((snap: any) => {
                    const riskCls = snap.risk_level === 'CRITICAL' ? 'text-red-400' : snap.risk_level === 'HIGH' ? 'text-orange-400' : snap.risk_level === 'MODERATE' ? 'text-yellow-400' : 'text-green-400';
                    return (
                      <Link
                        key={snap.id}
                        href={`/devices/${device.serial}/snapshot/${snap.id}`}
                        className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 rounded px-2 -mx-2 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{snap.scan_date ? new Date(snap.scan_date).toLocaleString('en-ZA') : '—'}</span>
                          <span className="text-xs text-slate-500 font-mono">v{snap.version ?? '?'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {snap.risk_score != null && (
                            <span className={`text-xs font-bold ${riskCls}`}>
                              {snap.risk_score} ({snap.risk_level})
                            </span>
                          )}
                          <span className="text-xs text-slate-600">{snap.recommendation_count ?? 0} recs</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </SectionBlock>
          </div>
        );
      })}
    </div>
  );
}
