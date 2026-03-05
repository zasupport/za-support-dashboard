import { fetchDiagnostics } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DeviceDetailPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const diag = await fetchDiagnostics(serial);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Device: {serial}</h1>
      {!diag ? (
        <p className="text-slate-400">No diagnostic data found for this device.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Hostname', value: diag.hostname },
              { label: 'Client', value: diag.client_id },
              { label: 'macOS', value: diag.payload?.macos_version || diag.macos_version },
              { label: 'Last Report', value: diag.created_at ? new Date(diag.created_at).toLocaleString('en-ZA') : '—' },
            ].map(({ label, value }) => (
              <Card key={label} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-slate-400">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white font-medium">{value || '—'}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Raw Diagnostic Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-slate-300 overflow-auto max-h-96 bg-slate-900 p-4 rounded">
                {JSON.stringify(diag.payload || diag, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
