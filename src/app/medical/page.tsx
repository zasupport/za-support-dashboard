import { MedicalClient } from './client';

export default function MedicalPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Medical Practices</h1>
          <p className="text-slate-400 text-sm">
            Practice profiles · HPCSA/POPIA compliance · assessments · software stack
          </p>
        </div>
      </div>
      <MedicalClient />
    </div>
  );
}
