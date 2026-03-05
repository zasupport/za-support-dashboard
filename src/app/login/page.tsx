import { LoginForm } from './form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">ZA Support</h1>
          <p className="text-slate-400 text-sm mt-1">Health Check AI Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
