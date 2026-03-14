import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoRefresh } from '@/components/auto-refresh';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_TOKEN = process.env.ZA_API_TOKEN || '';
const h = { 'X-API-Key': API_TOKEN };

interface CleanupItem {
  path: string;
  size_gb: number;
  last_modified?: string;
  description?: string;
}

interface CleanupCategory {
  category: string;
  items: CleanupItem[];
  subtotal_gb: number;
}

interface VisualiseResponse {
  client_id: string;
  client_name?: string;
  total_gb: number;
  categories: CleanupCategory[];
  status?: string;
  last_updated?: string;
}

async function fetchVisualise(clientId: string): Promise<VisualiseResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/storage-cleanup/visualise/${encodeURIComponent(clientId)}`,
      { headers: h, cache: 'no-store' },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const CATEGORY_COLOURS: Record<string, string> = {
  downloads:    'border-blue-500/40 bg-blue-500/5',
  caches:       'border-orange-500/40 bg-orange-500/5',
  logs:         'border-slate-500/40 bg-slate-500/5',
  trash:        'border-red-500/40 bg-red-500/5',
  duplicates:   'border-yellow-500/40 bg-yellow-500/5',
  large_files:  'border-purple-500/40 bg-purple-500/5',
  temp:         'border-teal-500/40 bg-teal-500/5',
};

function categoryColour(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_COLOURS[key] ?? 'border-slate-600/40 bg-slate-700/10';
}

export default async function StorageCleanupDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const data = await fetchVisualise(clientId);

  if (!data) notFound();

  const categories: CleanupCategory[] = data.categories ?? [];
  const totalGb = data.total_gb ?? 0;
  const showWarning = totalGb > 0.5;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={120000} />

      {/* Header */}
      <div>
        <Link href="/storage-cleanup" className="text-slate-400 text-xs hover:text-white block mb-1">
          ← Storage Cleanup
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {data.client_name || clientId}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5 font-mono">{clientId}</p>
      </div>

      {/* Warning banner */}
      {showWarning && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-yellow-300 text-sm">
          <strong>{totalGb.toFixed(1)} GB</strong> of recoverable storage identified.
          An alert will be sent to ZA Support when this client approves cleanup.
        </div>
      )}

      {/* Total summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className={`text-2xl font-bold mb-1 ${totalGb >= 1 ? 'text-teal-400' : 'text-slate-300'}`}>
            {totalGb.toFixed(1)} GB
          </div>
          <div className="text-slate-400 text-xs">Total recoverable</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">{categories.length}</div>
          <div className="text-slate-400 text-xs">Categories</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white mb-1">
            {categories.reduce((s, c) => s + (c.items?.length ?? 0), 0)}
          </div>
          <div className="text-slate-400 text-xs">Total items</div>
        </div>
      </div>

      {/* Category cards */}
      {categories.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="px-6 py-8 text-center">
            <p className="text-slate-400 text-sm">No cleanup categories found for this client.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.category}
              className={`border ${categoryColour(cat.category)} bg-slate-800`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm capitalize">
                    {cat.category.replace(/_/g, ' ')}
                  </CardTitle>
                  <span className={`text-sm font-bold ${cat.subtotal_gb >= 1 ? 'text-teal-400' : 'text-slate-400'}`}>
                    {(cat.subtotal_gb ?? 0).toFixed(1)} GB
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {(cat.items ?? []).length === 0 ? (
                  <p className="text-slate-500 text-xs">No items.</p>
                ) : (
                  <div className="space-y-1">
                    {cat.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between py-1.5 border-b border-slate-700/40 last:border-0"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-slate-200 text-xs font-mono truncate" title={item.path}>
                            {item.path}
                          </p>
                          {item.description && (
                            <p className="text-slate-500 text-xs mt-0.5">{item.description}</p>
                          )}
                          {item.last_modified && (
                            <p className="text-slate-600 text-xs">
                              {new Date(item.last_modified).toLocaleDateString('en-ZA')}
                            </p>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs shrink-0 font-mono">
                          {(item.size_gb ?? 0).toFixed(2)} GB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Category subtotal footer */}
                <div className="pt-2 mt-1 border-t border-slate-700/40 flex justify-between items-center">
                  <span className="text-slate-500 text-xs">
                    {(cat.items ?? []).length} item{(cat.items ?? []).length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-400 text-xs font-semibold">
                    Subtotal: {(cat.subtotal_gb ?? 0).toFixed(2)} GB
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Last updated */}
      {data.last_updated && (
        <p className="text-slate-600 text-xs">
          Last updated {new Date(data.last_updated).toLocaleString('en-ZA')}
        </p>
      )}
    </div>
  );
}
