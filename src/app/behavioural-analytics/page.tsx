import { BehaviouralClient } from './client';

export default function BehaviouralAnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Behavioural Analytics</h1>
      <p className="text-slate-400 text-sm mb-6">
        System performance timing · App launch delays · Productivity loss · Financial ROI · POPIA compliant
      </p>
      <BehaviouralClient />
    </div>
  );
}
