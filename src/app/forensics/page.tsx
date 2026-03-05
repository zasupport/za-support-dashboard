import { ForensicsClient } from './client';

export default function ForensicsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Forensics</h1>
      <p className="text-slate-400 text-sm mb-6">Digital forensic investigations · 30+ tools · Chain of custody · POPIA consent gate</p>
      <ForensicsClient />
    </div>
  );
}
