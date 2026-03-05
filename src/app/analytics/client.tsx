'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InteractionClient() {
  const [clientId, setClientId] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadFleet() {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/fleet?client_id=${encodeURIComponent(clientId)}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input
          className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white w-64 focus:outline-none focus:border-blue-500"
          placeholder="Client ID (e.g. gillian-pearson)"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadFleet()}
        />
        <button
          onClick={loadFleet}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          Load
        </button>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}

      {!loading && data.length === 0 && clientId && (
        <p className="text-slate-400 text-sm">No interaction analytics data for this client.</p>
      )}

      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((device: any, i: number) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white font-mono">{device.device_id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Avg Frustration</span>
                  <span className={(device.avg_frustration_score ?? 0) > 60 ? 'text-red-400' : 'text-green-400'}>
                    {device.avg_frustration_score?.toFixed(0) ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Typing Speed</span>
                  <span>{device.avg_typing_speed_wpm?.toFixed(0) ?? '—'} WPM</span>
                </div>
                <div className="flex justify-between">
                  <span>Rage Clicks</span>
                  <span className={device.total_rage_clicks > 0 ? 'text-orange-400' : ''}>{device.total_rage_clicks ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Samples</span>
                  <span>{device.sample_count ?? '—'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
