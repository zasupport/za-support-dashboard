import Link from 'next/link';
import { ClientsClient } from './client';

export default function ClientsPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
          <p className="text-slate-400 text-sm">Client registry · intake records · POPIA consent · onboarding status</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-medium transition-colors"
        >
          + New Client
        </Link>
      </div>
      <ClientsClient />
    </div>
  );
}
