import { fetchDevices } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function DevicesPage() {
  const devices = await fetchDevices();
  const list = Array.isArray(devices) ? devices : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Devices</h1>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">{list.length} registered devices</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-slate-400 text-sm">No devices found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left pb-3 pr-4">Serial</th>
                    <th className="text-left pb-3 pr-4">Hostname</th>
                    <th className="text-left pb-3 pr-4">Client</th>
                    <th className="text-left pb-3">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 pr-4">
                        <Link href={`/devices/${d.serial || d.id}`} className="text-blue-400 hover:underline font-mono text-xs">
                          {d.serial || d.id || '—'}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{d.hostname || '—'}</td>
                      <td className="py-3 pr-4 text-slate-300">{d.client_id || '—'}</td>
                      <td className="py-3 text-slate-400 text-xs">
                        {d.last_seen ? new Date(d.last_seen).toLocaleString('en-ZA') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
