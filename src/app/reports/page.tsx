import { ReportsClient } from './client';

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
      <p className="text-slate-400 text-sm mb-6">
        Generate and download Health Check Diagnostic PDFs from diagnostic snapshots.
      </p>
      <ReportsClient />
    </div>
  );
}
