"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/portal/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      localStorage.setItem("portal_token", data.access_token);
      localStorage.setItem("portal_client_id", data.client_id);
      router.push("/portal/dashboard");
    } catch {
      setError("Connection error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#27504D] px-6 py-3 rounded-lg mb-4">
            <span className="text-[#0FEA7A] font-bold text-xl tracking-wide">ZA SUPPORT</span>
          </div>
          <h1 className="text-white text-2xl font-semibold">Client Health Check Portal</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to view your device health and reports</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#16213e] rounded-xl p-8 shadow-xl border border-[#27504D]/30">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-gray-300 text-sm font-medium mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-[#0f0f23] border border-[#27504D]/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#0FEA7A] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-[#0f0f23] border border-[#27504D]/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#0FEA7A] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0FEA7A] hover:bg-[#0cd469] text-[#1a1a2e] font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p className="text-center text-gray-500 text-xs mt-6">
            Need access?{" "}
            <a href="mailto:admin@zasupport.com" className="text-[#0FEA7A] hover:underline">
              Contact ZA Support
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
