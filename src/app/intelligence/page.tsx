import { AppIntelligenceClient } from './client';

export default function IntelligencePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">App Intelligence</h1>
      <p className="text-slate-400 text-sm mb-6">Process metrics · App health scores · Startup analysis · Productivity scoring</p>
      <AppIntelligenceClient />
    </div>
  );
}
