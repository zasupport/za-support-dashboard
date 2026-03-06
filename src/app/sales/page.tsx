import { SalesClient } from './client';

export default function SalesPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Sales CRM</h1>
          <p className="text-slate-400 text-sm">
            Contacts · opportunities · upsell recommendations · outcome tracking
          </p>
        </div>
      </div>
      <SalesClient />
    </div>
  );
}
