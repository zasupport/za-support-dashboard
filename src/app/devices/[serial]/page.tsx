import { fetchDiagnostics, fetchDeviceSnapshots } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { TrendCharts } from './TrendCharts';

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

      {/* Trend charts */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Historical Trends</h2>
        <TrendCharts serial={serial} />
      </div>

      {/* Report download */}
      {diag.client_id && (
        <div className="flex items-center gap-3">
          <a
            href={`/api/reports/${diag.client_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
          >
            Download CyberPulse Report (PDF)
          </a>
          <span className="text-slate-500 text-xs">Generated from latest diagnostic snapshot</span>
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
