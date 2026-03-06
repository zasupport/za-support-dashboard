import { GuidesClient } from './client';

export default function GuidesPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Customer Guides</h1>
          <p className="text-slate-400 text-sm">
            Knowledge base · client education · feedback tracking
          </p>
        </div>
      </div>
      <GuidesClient />
    </div>
  );
}
