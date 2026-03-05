import { ClientsClient } from './client';

export default function ClientsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Clients</h1>
      <p className="text-slate-400 text-sm mb-6">Client registry · intake records · POPIA consent · onboarding status</p>
      <ClientsClient />
    </div>
  );
}
