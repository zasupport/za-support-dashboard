import { InteractionClient } from './client';

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Interaction Analytics</h1>
      <p className="text-slate-400 text-sm mb-6">Keystroke dynamics · Mouse behavior · Frustration scoring · POPIA compliant</p>
      <InteractionClient />
    </div>
  );
}
