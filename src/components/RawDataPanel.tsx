/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Helpers ──────────────────────────────────────────────────────────────────

function DataRow({ label, value, highlight }: { label: string; value?: string | number | boolean | null; highlight?: 'ok' | 'warn' | 'crit' }) {
  if (value == null || value === '' || value === 'NONE') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  const color = highlight === 'crit' ? 'text-red-400' : highlight === 'warn' ? 'text-yellow-400' : highlight === 'ok' ? 'text-green-400' : 'text-slate-200';
  return (
    <div className="flex gap-4 py-1 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-500 text-xs w-44 shrink-0">{label}</span>
      <span className={`text-xs font-mono ${color}`}>{display}</span>
    </div>
  );
}

function SecurityRow({ label, value }: { label: string; value?: boolean | string | null }) {
  if (value == null) return null;
  const isOn = value === true || value === 'true' || value === 'ON' || value === '1';
  return <DataRow label={label} value={isOn ? 'Enabled' : 'Disabled'} highlight={isOn ? 'ok' : 'crit'} />;
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      <p className="text-teal-400 text-xs font-semibold uppercase tracking-wide mb-1 mt-3 first:mt-0">{title}</p>
      {children}
    </div>
  );
}

// ── Hot Data: Latest real-time data points ──────────────────────────────────

function HotDataSection({ snapshot }: { snapshot: any }) {
  const p = snapshot?.raw_json ?? snapshot?.latest_snapshot?.raw_json ?? {};
  const sec = p.security ?? {};
  const hw = p.hardware ?? {};
  const bat = p.battery ?? {};
  const storage = p.storage ?? {};
  const mac = p.macos ?? {};
  const net = p.network ?? {};
  const recs = p.recommendations ?? [];

  const scanDate = snapshot?.scan_date ?? snapshot?.latest_snapshot?.scan_date;
  const riskScore = snapshot?.risk_score ?? snapshot?.latest_snapshot?.risk_score;
  const riskLevel = snapshot?.risk_level ?? snapshot?.latest_snapshot?.risk_level;

  const riskCls = riskLevel === 'CRITICAL' ? 'text-red-400' : riskLevel === 'HIGH' ? 'text-orange-400' : riskLevel === 'MODERATE' ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Scanned: {scanDate ? new Date(scanDate).toLocaleString('en-ZA') : 'Never'}
          </span>
          {riskScore != null && (
            <span className={`text-xs font-bold ${riskCls}`}>
              Risk: {riskScore} ({riskLevel})
            </span>
          )}
        </div>
        <span className="text-xs text-slate-600">v{snapshot?.version ?? snapshot?.latest_snapshot?.version ?? '?'}</span>
      </div>

      {/* Security Posture */}
      <SectionBlock title="Security">
        <SecurityRow label="FileVault" value={sec.filevault_enabled ?? sec.filevault_on} />
        <SecurityRow label="Firewall" value={sec.firewall_enabled ?? sec.firewall_on} />
        <SecurityRow label="SIP" value={sec.sip_enabled} />
        <SecurityRow label="Gatekeeper" value={sec.gatekeeper_enabled ?? sec.gatekeeper_on} />
        <DataRow label="XProtect version" value={sec.xprotect_version} />
        <SecurityRow label="Stealth mode" value={sec.stealth_mode} />
        <DataRow label="Remote access tools" value={sec.remote_access_tools} highlight={sec.remote_access_tools && sec.remote_access_tools !== 'none' ? 'warn' : undefined} />
      </SectionBlock>

      {/* Hardware */}
      <SectionBlock title="Hardware">
        <DataRow label="Model" value={hw.model ?? hw.model_name} />
        <DataRow label="Chip" value={hw.chip_type ?? hw.chip} />
        <DataRow label="CPU" value={hw.cpu} />
        <DataRow label="RAM" value={hw.ram_gb ? `${hw.ram_gb} GB` : hw.ram} />
        <DataRow label="Serial" value={hw.serial ?? snapshot?.serial} />
      </SectionBlock>

      {/* Battery */}
      {(bat.health_pct != null || bat.cycle_count != null) && (
        <SectionBlock title="Battery">
          <DataRow label="Health" value={bat.health_pct != null ? `${bat.health_pct}%` : bat.condition} highlight={bat.health_pct != null ? (bat.health_pct < 80 ? 'crit' : bat.health_pct < 90 ? 'warn' : 'ok') : undefined} />
          <DataRow label="Cycle count" value={bat.cycle_count} />
          <DataRow label="Condition" value={bat.condition} />
          <DataRow label="Temperature" value={bat.temperature_c != null ? `${bat.temperature_c}°C` : undefined} />
          <DataRow label="Charging" value={bat.is_charging != null ? (bat.is_charging ? 'Yes' : 'No') : undefined} />
        </SectionBlock>
      )}

      {/* Storage */}
      <SectionBlock title="Storage">
        <DataRow label="Boot disk used" value={storage.boot_disk_used_pct != null ? `${storage.boot_disk_used_pct}%` : undefined} highlight={storage.boot_disk_used_pct > 85 ? 'crit' : storage.boot_disk_used_pct > 70 ? 'warn' : 'ok'} />
        <DataRow label="Free space" value={storage.free_gb != null ? `${storage.free_gb} GB` : undefined} />
        <DataRow label="SMART status" value={storage.smart_status} highlight={storage.smart_status === 'Verified' ? 'ok' : 'crit'} />
        <DataRow label="TRIM" value={storage.trim_enabled != null ? (storage.trim_enabled ? 'Enabled' : 'Disabled') : undefined} />
      </SectionBlock>

      {/* macOS */}
      <SectionBlock title="macOS">
        <DataRow label="Version" value={mac.version ?? mac.macos_version} />
        <DataRow label="Build" value={mac.build} />
        <DataRow label="Uptime" value={mac.uptime} />
        <DataRow label="Kernel panics" value={mac.kernel_panics} highlight={Number(mac.kernel_panics) > 0 ? 'warn' : 'ok'} />
      </SectionBlock>

      {/* Network */}
      <SectionBlock title="Network">
        <DataRow label="Interface" value={net.active_interface ?? net.interface} />
        <DataRow label="IP" value={net.ip ?? net.ip_address} />
        <DataRow label="WiFi SSID" value={net.wifi_ssid ?? net.ssid} />
        <DataRow label="DNS" value={Array.isArray(net.dns_servers) ? net.dns_servers.join(', ') : net.dns} />
      </SectionBlock>

      {/* Recommendations */}
      {recs.length > 0 && (
        <SectionBlock title={`Recommendations (${recs.length})`}>
          {recs.map((r: any, i: number) => {
            const sev = (r.severity ?? '').toUpperCase();
            const sevCls = sev === 'CRITICAL' ? 'text-red-400' : sev === 'HIGH' ? 'text-orange-400' : sev === 'MODERATE' ? 'text-yellow-400' : 'text-blue-400';
            return (
              <div key={i} className="py-1.5 border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${sevCls}`}>{sev}</span>
                  <span className="text-xs text-slate-200">{r.title}</span>
                </div>
                {r.evidence && <p className="text-xs text-slate-500 mt-0.5 ml-16">{r.evidence}</p>}
              </div>
            );
          })}
        </SectionBlock>
      )}
    </div>
  );
}

// ── Reference Data: Summary metrics for quick lookup ────────────────────────

function ReferenceDataSection({ device, snapshot }: { device: any; snapshot: any }) {
  const latest = snapshot?.latest_snapshot ?? snapshot ?? {};
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
        <p className="text-slate-500 text-xs mb-0.5">Risk Score</p>
        <p className={`text-lg font-bold ${(latest.risk_score ?? 0) > 60 ? 'text-red-400' : (latest.risk_score ?? 0) > 40 ? 'text-yellow-400' : 'text-green-400'}`}>{latest.risk_score ?? '—'}</p>
      </div>
      <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
        <p className="text-slate-500 text-xs mb-0.5">PKG Version</p>
        <p className="text-white text-sm font-mono">{device.pkg_version ?? '—'}</p>
      </div>
      <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
        <p className="text-slate-500 text-xs mb-0.5">Last Seen</p>
        <p className="text-slate-200 text-xs">{device.last_seen ? new Date(device.last_seen).toLocaleDateString('en-ZA') : '—'}</p>
      </div>
      <div className="bg-slate-900/50 rounded-md p-2.5 text-center">
        <p className="text-slate-500 text-xs mb-0.5">macOS</p>
        <p className="text-slate-200 text-xs font-mono">{device.macos_version ?? '—'}</p>
      </div>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────────

interface RawDataPanelProps {
  clientId: string;
  clientName: string;
  devices: any[];
  snapshots: any[];
  heartbeats: any[];
}

export function RawDataPanel({ clientId, clientName, devices, snapshots, heartbeats }: RawDataPanelProps) {
  if (!devices || devices.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Raw Data Collected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-xs">No devices registered — install Health Check PKG to start collecting data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-sm">
          Raw Data Collected ({devices.length} {devices.length === 1 ? 'device' : 'devices'})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Link href={`/clients/${clientId}/data`} className="text-xs text-teal-400 hover:text-teal-300">
            Full Data View →
          </Link>
          <span className="text-xs text-slate-600">{heartbeats.length} heartbeats (24h)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {devices.map((device: any, idx: number) => {
          const snapshot = snapshots.find((s: any) =>
            s?.serial === device.serial || s?.latest_snapshot?.serial === device.serial
          );

          return (
            <div key={device.serial} className={idx > 0 ? 'pt-4 border-t border-slate-700' : ''}>
              {/* Device header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Link href={`/devices/${device.serial}`} className="text-sm text-white font-semibold hover:text-teal-300 transition-colors">
                    {device.hostname || device.serial}
                  </Link>
                  <p className="text-xs text-slate-500 font-mono">{device.serial} · {device.model ?? 'Unknown model'}</p>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded border bg-teal-900/30 text-teal-300 border-teal-700/30">HOT</span>
                  <span className="text-xs px-2 py-0.5 rounded border bg-blue-900/30 text-blue-300 border-blue-700/30">REF</span>
                  <span className="text-xs px-2 py-0.5 rounded border bg-slate-700 text-slate-400 border-slate-600">COLD</span>
                </div>
              </div>

              {/* Reference tier: summary cards */}
              <ReferenceDataSection device={device} snapshot={snapshot} />

              {/* Hot tier: latest diagnostic raw data */}
              {snapshot ? (
                <HotDataSection snapshot={snapshot} />
              ) : (
                <p className="text-slate-500 text-xs mt-2">No diagnostic scan yet — run Health Check to collect data.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
