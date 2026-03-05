import { BreachScannerClient } from './client';

export default function BreachScannerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Breach Scanner</h1>
      <p className="text-slate-400 text-sm mb-6">Compromised data detection · 5 threat intel providers · POPIA consent gate</p>
      <BreachScannerClient />
    </div>
  );
}
