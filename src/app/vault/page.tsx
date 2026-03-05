import { VaultClient } from './client';

export default function VaultPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Vault</h1>
      <p className="text-slate-400 text-sm mb-6">Encrypted credential storage · Fernet AES-128 · Full audit log</p>
      <VaultClient />
    </div>
  );
}
