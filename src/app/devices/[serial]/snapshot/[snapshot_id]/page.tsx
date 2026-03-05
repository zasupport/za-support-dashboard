import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function fetchSnapshot(snapshotId: string) {
  const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
  const API_TOKEN = process.env.ZA_API_TOKEN || '';
  try {
    const res = await fetch(
      `${API_URL}/api/v1/diagnostics/snapshots/${snapshotId}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader><CardTitle className="text-white text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-0">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value, highlight }: { label: string; value?: string | number | boolean | null; highlight?: 'ok' | 'warn' | 'crit' }) {
  if (value == null || value === '' || value === 'NONE') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  const color = highlight === 'crit' ? 'text-red-400' : highlight === 'warn' ? 'text-yellow-400' : highlight === 'ok' ? 'text-green-400' : 'text-slate-200';
  return (
    <div className="flex gap-4 py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-500 text-xs w-48 shrink-0">{label}</span>
      <span className={`text-xs font-mono ${color}`}>{display}</span>
    </div>
  );
}

function Badge({ text, variant }: { text: string; variant: 'crit' | 'high' | 'mod' | 'low' | 'ok' | 'neutral' }) {
  const styles: Record<string, string> = {
    crit:    'bg-red-500/20 text-red-300 border-red-500/30',
    high:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    mod:     'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    low:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ok:      'bg-green-500/20 text-green-300 border-green-500/30',
    neutral: 'bg-slate-600/40 text-slate-400 border-slate-600',
  };
  return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[variant]}`}>{text}</span>;
}

function securityHighlight(on: number | boolean | undefined): 'ok' | 'crit' {
  return (on === 1 || on === true) ? 'ok' : 'crit';
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ serial: string; snapshot_id: string }>;
}) {
  const { serial, snapshot_id } = await params;
  const snap = await fetchSnapshot(snapshot_id);
  if (!snap) notFound();

  const p: Record<string, any> = snap.raw_json ?? {};
  const sec   = p.security   ?? {};
  const hw    = p.hardware    ?? {};
  const bat   = p.battery     ?? {};
  const stor  = p.storage     ?? {};
  const macos = p.macos       ?? {};
  const net   = p.network     ?? {};
  const env   = p.environment ?? {};
  const recs: any[] = p.recommendations ?? [];

  const severityVariant = (s: string) =>
    s === 'CRITICAL' ? 'crit' : s === 'HIGH' ? 'high' : s === 'MODERATE' ? 'mod' : 'low';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/devices/${serial}`} className="text-slate-400 text-xs hover:text-white mb-1 block">
          ← {serial}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Scout Diagnostic Report</h1>
            <p className="text-slate-400 text-sm font-mono mt-0.5">
              {snap.scan_date ? new Date(snap.scan_date).toLocaleString('en-ZA') : 'Unknown date'} · v{snap.version ?? '?'}
            </p>
          </div>
          <div className="flex gap-2">
            {snap.risk_level && (
              <Badge
                text={`${snap.risk_level} — ${snap.risk_score ?? '?'}`}
                variant={snap.risk_level === 'CRITICAL' ? 'crit' : snap.risk_level === 'HIGH' ? 'high' : snap.risk_level === 'MODERATE' ? 'mod' : 'ok'}
              />
            )}
            {snap.recommendation_count > 0 && (
              <Badge text={`${snap.recommendation_count} recommendations`} variant="neutral" />
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <Section title={`Recommendations (${recs.length})`}>
          <div className="space-y-3 pt-1">
            {recs.map((r: any, i: number) => (
              <div key={i} className="border border-slate-700 rounded-md p-3">
                <div className="flex items-start gap-2 mb-1">
                  <Badge text={r.severity} variant={severityVariant(r.severity)} />
                  <p className="text-slate-200 text-xs font-medium">{r.title}</p>
                </div>
                {r.evidence && <p className="text-slate-400 text-xs ml-0 mt-1">{r.evidence}</p>}
                {r.risk_scenario && <p className="text-slate-500 text-xs mt-1 italic">{r.risk_scenario}</p>}
                {r.product && <p className="text-slate-400 text-xs mt-1">→ {r.product}{r.price ? ` · ${r.price}` : ''}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security */}
        <Section title="Security">
          <Row label="FileVault"      value={sec.filevault_on   ? 'ON'  : 'OFF'} highlight={securityHighlight(sec.filevault_on)} />
          <Row label="Firewall"       value={sec.firewall_on    ? 'ON'  : 'OFF'} highlight={securityHighlight(sec.firewall_on)} />
          <Row label="SIP"            value={sec.sip_enabled    ? 'ON'  : 'OFF'} highlight={securityHighlight(sec.sip_enabled)} />
          <Row label="Gatekeeper"     value={sec.gatekeeper_on  ? 'ON'  : 'OFF'} highlight={securityHighlight(sec.gatekeeper_on)} />
          <Row label="Password mgr"   value={sec.password_manager} />
          <Row label="AV / EDR"       value={sec.av_edr} />
          <Row label="XProtect ver"   value={sec.xprotect_version} />
          <Row label="Stealth mode"   value={sec.stealth_mode   ? 'ON'  : sec.stealth_mode === false ? 'OFF' : null}
               highlight={sec.stealth_mode ? 'ok' : sec.stealth_mode === false ? 'warn' : undefined} />
        </Section>

        {/* Hardware */}
        <Section title="Hardware">
          <Row label="Serial"    value={hw.serial ?? snap.serial} />
          <Row label="Model"     value={hw.model} />
          <Row label="Chip"      value={hw.chip_type} />
          <Row label="CPU"       value={hw.cpu} />
          <Row label="RAM"       value={hw.ram_gb != null ? `${hw.ram_gb} GB` : null} />
          <Row label="RAM type"  value={hw.ram_upgradeable} />
          <Row label="Cores"     value={hw.cores_physical != null ? `${hw.cores_physical}P / ${hw.cores_logical ?? '?'}L` : null} />
        </Section>

        {/* Battery */}
        <Section title="Battery">
          <Row label="Health"    value={bat.health_pct    != null ? `${bat.health_pct}%` : null}
               highlight={parseFloat(bat.health_pct) < 70 ? 'crit' : parseFloat(bat.health_pct) < 85 ? 'warn' : 'ok'} />
          <Row label="Cycles"    value={bat.cycles}
               highlight={parseInt(bat.cycles) > 900 ? 'crit' : parseInt(bat.cycles) > 700 ? 'warn' : 'ok'} />
          <Row label="Condition" value={bat.condition}
               highlight={bat.condition === 'Normal' ? 'ok' : 'warn'} />
          <Row label="Design mAh"  value={bat.design_capacity_mah} />
          <Row label="Current mAh" value={bat.max_capacity_mah} />
          <Row label="Temperature" value={bat.temperature_c != null ? `${bat.temperature_c}°C` : null} />
          <Row label="Charging"    value={bat.is_charging != null ? (bat.is_charging ? 'Yes' : 'No') : null} />
        </Section>

        {/* Storage */}
        <Section title="Storage">
          <Row label="Boot disk used"  value={stor.boot_disk_used_pct != null ? `${stor.boot_disk_used_pct}%` : null}
               highlight={stor.boot_disk_used_pct > 90 ? 'crit' : stor.boot_disk_used_pct > 80 ? 'warn' : 'ok'} />
          <Row label="Boot disk free"  value={stor.boot_disk_free_gb  != null ? `${stor.boot_disk_free_gb} GB` : null} />
          <Row label="SMART status"    value={stor.smart_status}
               highlight={stor.smart_status === 'Verified' ? 'ok' : stor.smart_status ? 'warn' : undefined} />
          <Row label="TRIM"            value={stor.trim_enabled != null ? (stor.trim_enabled ? 'ON' : 'OFF') : null} />
          <Row label="APFS"            value={stor.apfs_containers} />
        </Section>

        {/* macOS */}
        <Section title="macOS">
          <Row label="Version"   value={macos.version ?? hw.macos_version} />
          <Row label="Build"     value={macos.build} />
          <Row label="Uptime"    value={macos.uptime_seconds != null ? `${Math.round(macos.uptime_seconds / 3600)}h` : null} />
          <Row label="Kernel panics" value={p.diagnostics?.kernel_panics}
               highlight={p.diagnostics?.kernel_panics > 0 ? 'warn' : 'ok'} />
          <Row label="Processes"     value={p.diagnostics?.total_processes} />
        </Section>

        {/* Network */}
        {Object.keys(net).length > 0 && (
          <Section title="Network">
            <Row label="Active interface" value={net.active_interface} />
            <Row label="IP address"       value={net.ip_address} />
            <Row label="DNS servers"      value={Array.isArray(net.dns_servers) ? net.dns_servers.join(', ') : net.dns_servers} />
            <Row label="Gateway"          value={net.gateway} />
            <Row label="Wi-Fi SSID"       value={net.wifi_ssid} />
            <Row label="Wi-Fi security"   value={net.wifi_security} />
          </Section>
        )}
      </div>

      {/* Environment */}
      {Object.keys(env).length > 0 && (
        <Section title="Environment">
          <Row label="Login items"        value={env.login_items} />
          <Row label="LaunchAgents (user)" value={env.launch_agents_user} />
          <Row label="LaunchAgents (sys)"  value={env.launch_agents_system} />
          <Row label="LaunchDaemons (3rd)" value={env.launch_daemons_third} />
          <Row label="Cloud sync"          value={env.cloud_sync_installed} />
          <Row label="Cloud running"       value={env.cloud_sync_running} />
          <Row label="Remote access"       value={env.remote_access_tools}
               highlight={env.remote_access_tools && env.remote_access_tools !== 'NONE' ? 'warn' : undefined} />
          <Row label="CCC installed"       value={env.ccc_installed} />
          <Row label="CCC last backup"     value={env.ccc_last_backup} />
          <Row label="Time Machine"        value={env.time_machine_status}
               highlight={env.time_machine_status === 'DISABLED' ? 'crit' : 'ok'} />
          <Row label="TM destination"      value={env.time_machine_dest} />
          <Row label="TM last backup"      value={env.time_machine_last} />
          <Row label="Days since backup"   value={env.time_machine_days_ago != null ? `${env.time_machine_days_ago} days` : null}
               highlight={parseInt(env.time_machine_days_ago) > 14 ? 'crit' : parseInt(env.time_machine_days_ago) > 7 ? 'warn' : 'ok'} />
          <Row label="Subscription apps"   value={env.subscription_apps} />
        </Section>
      )}

      {/* Raw JSON toggle */}
      <details className="rounded-md border border-slate-700">
        <summary className="px-4 py-2 text-slate-400 text-xs cursor-pointer select-none hover:text-white">
          Raw payload JSON
        </summary>
        <pre className="px-4 py-3 text-slate-400 text-xs overflow-auto max-h-96 bg-slate-900 rounded-b-md">
          {JSON.stringify(p, null, 2)}
        </pre>
      </details>
    </div>
  );
}
