import { fetchClient, fetchClientTasks, fetchClientCheckins, fetchClientJobs, fetchClientDevices, fetchClientNetwork } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskChecklist } from './TaskChecklist';
import { StatusUpdater } from './StatusUpdater';
import { ClientNotes } from './ClientNotes';
import { CreateJobButton } from './CreateJobButton';
import { EditClientButton } from './EditClientButton';
import { PortalLinkButton } from './PortalLinkButton';
import { RoiWidget } from '@/components/RoiWidget';
import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';
import { notFound } from 'next/navigation';

function Row({ label, value }: { label: string; value?: string | boolean | null }) {
  if (!value && value !== false) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  return (
    <div className="flex gap-4 py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-500 text-xs w-40 shrink-0">{label}</span>
      <span className="text-slate-200 text-xs">{display}</span>
    </div>
  );
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400 bg-green-500/10 border-green-500/30',
  B: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  C: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  F: 'text-red-400 bg-red-500/10 border-red-500/30',
};

async function fetchHealthScore(clientId: string) {
  const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
  const API_TOKEN = process.env.ZA_API_TOKEN || '';
  try {
    const res = await fetch(`${API_URL}/api/v1/clients/${clientId}/health`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ client_id: string }> }) {
  const { client_id } = await params;
  const [client, tasks, checkins, health, jobs, devices, network] = await Promise.all([
    fetchClient(client_id),
    fetchClientTasks(client_id),
    fetchClientCheckins(client_id),
    fetchHealthScore(client_id),
    fetchClientJobs(client_id),
    fetchClientDevices(client_id),
    fetchClientNetwork(client_id),
  ]);

  if (!client) notFound();

  const isUrgent = client.urgency_level?.toLowerCase().startsWith('urgent');

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={300000} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link href="/clients" className="text-slate-400 text-xs hover:text-white mb-1 block">← All Clients</Link>
          <Link href={`/clients/${client.client_id}/brief`} className="text-teal-400 text-xs hover:text-teal-300 mb-1 block">Site Visit Brief →</Link>
          <h1 className="text-2xl font-bold text-white">{client.first_name} {client.last_name}</h1>
          <p className="text-slate-400 text-sm font-mono mt-0.5">{client.client_id}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end items-center">
          {isUrgent && (
            <span className="text-xs px-3 py-1 rounded-full border bg-red-500/20 text-red-300 border-red-500/30 font-medium">URGENT</span>
          )}
          {client.has_business && (
            <span className="text-xs px-3 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30 font-medium">Has Business</span>
          )}
          {health?.grade && (
            <span className={`text-sm px-3 py-1 rounded-full border font-bold ${GRADE_COLORS[health.grade] ?? ''}`}>
              Grade {health.grade} · {health.health_score}/100
            </span>
          )}
          <EditClientButton client={client} />
          <StatusUpdater clientId={client.client_id} currentStatus={client.status} />
        </div>
      </div>

      {/* Urgent / business action banners */}
      {isUrgent && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          This client marked their request as <strong>URGENT</strong> — action required today.
        </div>
      )}
      {client.has_business && (
        <div className="rounded-md border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-purple-300 text-sm">
          <strong>Business opportunity:</strong> {client.business_name || 'Client has a business'} — offer SME Health Check assessment.
          {client.business_health_check_interest && ` Interest level: ${client.business_health_check_interest}.`}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact details */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <Row label="Email"              value={client.email} />
            <Row label="Phone"              value={client.phone} />
            <Row label="Preferred contact"  value={client.preferred_contact} />
            <Row label="Address"            value={client.address} />
            <Row label="Referral source"    value={client.referral_source} />
            <Row label="Referred by"        value={client.referred_by} />
            <Row label="Joined"             value={client.created_at ? new Date(client.created_at).toLocaleDateString('en-ZA') : undefined} />
          </CardContent>
        </Card>

        {/* Concerns */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">What They Need</CardTitle></CardHeader>
          <CardContent>
            <Row label="Urgency" value={client.urgency_level} />
            {client.concerns && client.concerns.length > 0 && (
              <div className="py-1.5 border-b border-slate-700/50">
                <p className="text-slate-500 text-xs mb-1">Concerns</p>
                <ul className="space-y-0.5">
                  {client.concerns.map((c: string, i: number) => (
                    <li key={i} className="text-slate-200 text-xs">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
            {client.concerns_detail && (
              <div className="py-1.5">
                <p className="text-slate-500 text-xs mb-1">In their own words</p>
                <p className="text-slate-300 text-xs italic">"{client.concerns_detail}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROI Widget */}
      <RoiWidget clientId={client.client_id} clientName={`${client.first_name} ${client.last_name}`} />

      {/* Business section (if applicable) */}
      {client.has_business && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Business Details</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <Row label="Business name"    value={client.business_name} />
            <Row label="Industry / type"  value={client.business_type} />
            <Row label="Staff count"      value={client.business_staff_count} />
            <Row label="Devices in biz"   value={client.business_device_count} />
            <Row label="HC interest"      value={client.business_health_check_interest} />
          </CardContent>
        </Card>
      )}

      {/* Registered devices */}
      {(devices as any[]).length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-sm">Registered Devices ({(devices as any[]).length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(devices as any[]).map((d: any) => {
              const riskCls = d.risk_level === 'CRITICAL' ? 'text-red-400'
                : d.risk_level === 'HIGH' ? 'text-orange-400'
                : d.risk_level === 'MODERATE' ? 'text-yellow-400'
                : d.risk_level === 'LOW' ? 'text-green-400' : 'text-slate-500';
              return (
                <Link
                  key={d.serial}
                  href={`/devices/${d.serial}`}
                  className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 rounded px-2 -mx-2 transition-colors"
                >
                  <div>
                    <p className="text-sm text-slate-200">{d.hostname || d.serial}</p>
                    <p className="text-xs text-slate-500 font-mono">{d.serial}{d.model ? ` · ${d.model}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {d.risk_level && (
                      <span className={`text-xs font-semibold ${riskCls}`}>
                        {d.risk_level}{d.risk_score != null ? ` (${d.risk_score})` : ''}
                      </span>
                    )}
                    {d.last_seen && (
                      <span className="text-xs text-slate-500">
                        {new Date(d.last_seen).toLocaleDateString('en-ZA')}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Network Intelligence — UniFi */}
      {network && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-sm">Network Intelligence</CardTitle>
            <div className="flex items-center gap-2">
              {network.stale && (
                <span className="text-xs px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Stale data</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
                network.wan_status === 'online'
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : network.wan_status === 'offline'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-slate-600/40 text-slate-400 border-slate-600'
              }`}>
                WAN {network.wan_status?.toUpperCase() ?? 'UNKNOWN'}
              </span>
              <span className="text-xs text-slate-500 font-mono">{network.source}</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* WAN stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-900/50 rounded-md p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">WAN IP</p>
                <p className="text-slate-200 text-xs font-mono">{network.wan_ip ?? '—'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-md p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">Clients</p>
                <p className="text-white text-lg font-bold">{network.connected_clients ?? '—'}</p>
                <p className="text-slate-500 text-xs">{network.wireless_clients ?? 0}W + {network.wired_clients ?? 0}E</p>
              </div>
              <div className="bg-slate-900/50 rounded-md p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">Devices</p>
                <p className="text-white text-lg font-bold">{network.devices_online ?? '—'}<span className="text-slate-500 text-xs font-normal">/{network.devices_total ?? '—'}</span></p>
                <p className="text-slate-500 text-xs">online</p>
              </div>
              <div className="bg-slate-900/50 rounded-md p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">Uptime</p>
                <p className="text-slate-200 text-xs font-mono">{network.uptime_hours != null ? `${network.uptime_hours}h` : '—'}</p>
              </div>
            </div>

            {/* Throughput */}
            {(network.wan_rx_mbps != null || network.wan_tx_mbps != null) && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/50 rounded-md p-3 flex items-center gap-2">
                  <span className="text-green-400 text-xs font-medium">↓ RX</span>
                  <span className="text-slate-200 text-xs font-mono">{network.wan_rx_mbps != null ? `${network.wan_rx_mbps.toFixed(2)} Mbps` : '—'}</span>
                </div>
                <div className="bg-slate-900/50 rounded-md p-3 flex items-center gap-2">
                  <span className="text-teal-400 text-xs font-medium">↑ TX</span>
                  <span className="text-slate-200 text-xs font-mono">{network.wan_tx_mbps != null ? `${network.wan_tx_mbps.toFixed(2)} Mbps` : '—'}</span>
                </div>
              </div>
            )}

            {/* UniFi devices */}
            {network.devices && network.devices.length > 0 && (
              <div className="space-y-1">
                <p className="text-slate-500 text-xs mb-2">Network Devices</p>
                {(network.devices as any[]).map((d: any) => (
                  <div key={d.mac} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div>
                        <p className="text-slate-200 text-xs">{d.name || d.model || d.mac}</p>
                        <p className="text-slate-500 text-xs font-mono">{d.type?.toUpperCase()} · {d.ip ?? d.mac}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      {d.firmware_version && (
                        <span className="text-xs text-slate-500 font-mono">fw {d.firmware_version}</span>
                      )}
                      <span className={`text-xs font-medium ${d.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>{d.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Last polled */}
            <p className="text-slate-600 text-xs mt-3">
              Last polled {network.as_of ? new Date(network.as_of).toLocaleString('en-ZA') : '—'} · Site: {network.site_name ?? 'default'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report download + workshop job */}
      <div className="flex items-center gap-3 flex-wrap">
        <a
          href={`/api/reports/${client.client_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
        >
          Download CyberPulse Report (PDF)
        </a>
        <CreateJobButton clientId={client.client_id} />
        <PortalLinkButton clientId={client.client_id} />
        <span className="text-slate-500 text-xs">Generated from latest Scout diagnostic</span>
      </div>

      {/* Open workshop jobs */}
      {(() => {
        const openJobs = (jobs as any[]).filter(j => !['done', 'completed', 'cancelled'].includes(j.status));
        if (openJobs.length === 0) return null;
        const P: Record<string, string> = { urgent: 'text-red-400', high: 'text-orange-400', normal: 'text-slate-300', low: 'text-slate-500' };
        const S: Record<string, string> = { open: 'bg-slate-600/40 text-slate-300 border-slate-600', in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', waiting_parts: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
        return (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-white text-sm">Open Workshop Jobs ({openJobs.length})</CardTitle>
              <Link href="/workshop" className="text-xs text-teal-400 hover:text-teal-300">View all →</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {openJobs.map((j: any) => (
                <Link key={j.job_ref} href={`/workshop/${j.job_ref}`}
                  className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 rounded px-2 -mx-2 transition-colors">
                  <div>
                    <p className="text-sm text-slate-200">{j.title}</p>
                    <p className="text-xs text-slate-500 font-mono">{j.job_ref}{j.serial ? ` · ${j.serial}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${P[j.priority] ?? 'text-slate-400'}`}>{j.priority.toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${S[j.status] ?? S.open}`}>{j.status.replace(/_/g, ' ')}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* Internal notes */}
      <ClientNotes clientId={client.client_id} />

      {/* Onboarding tasks — interactive checklist */}
      <TaskChecklist initialTasks={tasks as any[]} clientId={client.client_id} />

      {/* Pre-visit check-ins */}
      {(checkins as any[]).length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Pre-Visit Check-Ins</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(checkins as any[]).map((ci: any) => (
              <div key={ci.id} className="border border-slate-700 rounded-md p-3 space-y-2">
                <p className="text-slate-400 text-xs">{new Date(ci.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                {ci.focus_today && <Row label="Focus today"       value={ci.focus_today} />}
                {ci.issues_noted && <Row label="Issues reported"  value={ci.issues_noted} />}
                {ci.changes_since_last && <Row label="Changes"    value={ci.changes_since_last} />}
                {ci.backup_drive_connected && <Row label="Backup drive" value={ci.backup_drive_connected} />}
                {ci.pre_visit_notes && <Row label="Notes"         value={ci.pre_visit_notes} />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
