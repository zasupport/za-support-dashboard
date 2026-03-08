import { Card, CardContent } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cluster {
  cluster_id?: string | number;
  label?: string;
  client_count?: number;
  avg_risk_score?: number;
  avg_backup_pct?: number;
  avg_roi_ratio?: number;
  [key: string]: unknown;
}

interface Pattern {
  pattern_id?: string | number;
  title?: string;
  description?: string;
  recommendation?: string;
  severity?: string;
  affected_client_count?: number;
  [key: string]: unknown;
}

interface ClientProfile {
  client_id?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  cluster_label?: string;
  segment?: string;
  risk_score?: number;
  backup_compliance_pct?: number;
  automated_actions_30d?: number;
  roi_ratio?: number;
  [key: string]: unknown;
}

// ─── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchClusters(): Promise<Cluster[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/ai-profiling/clusters`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch {
    return [];
  }
}

async function fetchPatterns(): Promise<Pattern[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/ai-profiling/patterns`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch {
    return [];
  }
}

async function fetchProfiles(): Promise<ClientProfile[]> {
  try {
    // Get client list
    const clientsRes = await fetch(`${API_URL}/api/v1/clients?per_page=100`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: 'no-store',
    });
    if (!clientsRes.ok) return [];
    const clientsData = await clientsRes.json();
    const clients: ClientProfile[] = Array.isArray(clientsData)
      ? clientsData
      : (clientsData.data ?? []);

    const limited = clients.slice(0, 20);

    const profiles = await Promise.all(
      limited.map(async (client) => {
        const id = client.client_id ?? '';
        if (!id) return client;
        try {
          const profileRes = await fetch(
            `${API_URL}/api/v1/ai-profiling/clients/${encodeURIComponent(id)}`,
            {
              headers: { Authorization: `Bearer ${API_TOKEN}` },
              cache: 'no-store',
            }
          );
          if (!profileRes.ok) return client;
          const profile = await profileRes.json();
          return { ...client, ...profile };
        } catch {
          return client;
        }
      })
    );

    return profiles;
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clusterBorderClass(label?: string): string {
  const l = (label ?? '').toLowerCase();
  if (l.includes('high risk') || l.includes('high-risk')) return 'border-red-500/60';
  if (l.includes('moderate')) return 'border-orange-500/60';
  if (l.includes('healthy') || l.includes('low')) return 'border-green-500/60';
  return 'border-slate-600';
}

function severityBorderClass(severity?: string): string {
  const s = (severity ?? '').toLowerCase();
  if (s === 'critical') return 'border-l-red-500';
  if (s === 'high') return 'border-l-orange-500';
  if (s === 'moderate' || s === 'medium') return 'border-l-yellow-500';
  return 'border-l-slate-500';
}

function severityBadgeClass(severity?: string): string {
  const s = (severity ?? '').toLowerCase();
  if (s === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/40';
  if (s === 'high') return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
  if (s === 'moderate' || s === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
  return 'bg-slate-700 text-slate-400 border-slate-600';
}

function riskScoreClass(score?: number): string {
  if (score == null) return 'text-slate-500';
  if (score >= 70) return 'text-red-400 font-semibold';
  if (score >= 40) return 'text-orange-400 font-semibold';
  return 'text-green-400 font-semibold';
}

function clientDisplayName(c: ClientProfile): string {
  if (c.display_name) return c.display_name;
  const parts = [c.first_name, c.last_name].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return c.client_id ?? '—';
}

function fmtPct(val?: number): string {
  if (val == null) return '—';
  return `${Math.round(val)}%`;
}

function fmtRoi(val?: number): string {
  if (val == null) return '—';
  return `${val.toFixed(1)}:1`;
}

function fmtRisk(val?: number): string {
  if (val == null) return '—';
  return `${Math.round(val)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AiProfilingPage() {
  const [clusters, patterns, profiles] = await Promise.all([
    fetchClusters(),
    fetchPatterns(),
    fetchProfiles(),
  ]);

  // Summary metrics
  const totalProfiled = profiles.length;
  const clusterCount = clusters.length;
  const activePatterns = patterns.length;
  const highRiskClients = profiles.filter(
    (p) => (p.risk_score ?? 0) >= 70
  ).length;

  const lastRun = clusters[0]
    ? (clusters[0].last_run_at as string | undefined) ?? null
    : null;
  const lastRunLabel = lastRun
    ? new Date(lastRun).toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Not yet run';

  // Sort profiles by risk score descending for the table
  const sortedProfiles = [...profiles].sort(
    (a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0)
  );

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={600000} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">AI Client Intelligence</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Cluster analysis updated monthly — last run: {lastRunLabel}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Clients profiled" value={totalProfiled} />
        <SummaryCard label="Clusters detected" value={clusterCount} />
        <SummaryCard label="Active patterns" value={activePatterns} />
        <SummaryCard
          label="High risk clients"
          value={highRiskClients}
          highlight={highRiskClients > 0}
        />
      </div>

      {/* Cluster breakdown */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Cluster Breakdown</h2>
        {clusters.length === 0 ? (
          <EmptyState message="No clusters available — profiling has not run yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.map((cluster, i) => (
              <ClusterCard key={cluster.cluster_id ?? i} cluster={cluster} />
            ))}
          </div>
        )}
      </section>

      {/* Cross-client patterns */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Cross-Client Patterns</h2>
        {patterns.length === 0 ? (
          <EmptyState message="No active patterns detected." />
        ) : (
          <div className="space-y-3">
            {patterns.map((pattern, i) => (
              <PatternCard key={pattern.pattern_id ?? i} pattern={pattern} />
            ))}
          </div>
        )}
      </section>

      {/* Client profile table */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Client Profiles</h2>
        {sortedProfiles.length === 0 ? (
          <EmptyState message="No client profiles available." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Cluster</th>
                  <th className="px-4 py-3">Segment</th>
                  <th className="px-4 py-3 text-right">Risk</th>
                  <th className="px-4 py-3 text-right">Backup</th>
                  <th className="px-4 py-3 text-right">Auto 30d</th>
                  <th className="px-4 py-3 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedProfiles.map((client, i) => (
                  <tr
                    key={client.client_id ?? i}
                    className="bg-slate-900 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {clientDisplayName(client)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {client.cluster_label ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <SegmentBadge segment={client.segment} />
                    </td>
                    <td className={`px-4 py-3 text-right ${riskScoreClass(client.risk_score)}`}>
                      {fmtRisk(client.risk_score)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {fmtPct(client.backup_compliance_pct)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {client.automated_actions_30d ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-teal-400 font-medium">
                      {fmtRoi(client.roi_ratio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p
          className={`text-3xl font-bold ${
            highlight && value > 0 ? 'text-red-400' : 'text-white'
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const borderClass = clusterBorderClass(cluster.label);
  return (
    <Card className={`bg-slate-800 border-2 ${borderClass}`}>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white leading-tight">
            {cluster.label ?? `Cluster ${String(cluster.cluster_id ?? '')}`}
          </p>
          <span className="shrink-0 text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
            {cluster.client_count ?? 0} client{(cluster.client_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Avg Risk</p>
            <p className={`text-sm font-semibold ${riskScoreClass(cluster.avg_risk_score)}`}>
              {fmtRisk(cluster.avg_risk_score)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Avg Backup</p>
            <p className="text-sm font-semibold text-slate-200">
              {fmtPct(cluster.avg_backup_pct)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Avg ROI</p>
            <p className="text-sm font-semibold text-teal-400">
              {fmtRoi(cluster.avg_roi_ratio)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern }: { pattern: Pattern }) {
  const borderClass = severityBorderClass(pattern.severity);
  const badgeClass = severityBadgeClass(pattern.severity);
  return (
    <div
      className={`rounded-lg bg-slate-800 border border-slate-700 border-l-4 ${borderClass} px-4 py-3`}
    >
      <div className="flex flex-wrap items-start gap-2 mb-1">
        <p className="text-sm font-semibold text-white flex-1 min-w-0">
          {pattern.title ?? 'Untitled pattern'}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {pattern.severity && (
            <span
              className={`text-xs px-2 py-0.5 rounded border font-medium ${badgeClass}`}
            >
              {pattern.severity}
            </span>
          )}
          {pattern.affected_client_count != null && (
            <span className="text-xs text-slate-400">
              {pattern.affected_client_count} client
              {pattern.affected_client_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      {pattern.description && (
        <p className="text-xs text-slate-400 mb-1">{pattern.description}</p>
      )}
      {pattern.recommendation && (
        <p className="text-xs text-teal-400 mt-1">
          <span className="font-medium text-teal-300">Action:</span>{' '}
          {pattern.recommendation}
        </p>
      )}
    </div>
  );
}

function SegmentBadge({ segment }: { segment?: string }) {
  const s = (segment ?? '').toLowerCase();
  const cls =
    s === 'medical_practice'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
      : s === 'sme'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
      : s === 'family'
      ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
      : s === 'individual'
      ? 'bg-slate-600/60 text-slate-300 border-slate-500'
      : 'bg-slate-700 text-slate-500 border-slate-600';
  return segment ? (
    <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>
      {segment.replace('_', ' ')}
    </span>
  ) : (
    <span className="text-slate-600 text-xs">—</span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 px-6 py-10 text-center">
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
