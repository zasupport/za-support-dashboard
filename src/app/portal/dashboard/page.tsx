"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Device {
  serial: string;
  model: string;
  hostname: string;
  chip_type: string;
  macos_version: string;
  last_seen: string;
  risk_level: string;
  risk_score: number;
  battery_health_pct: number;
  storage_free_gb: number;
  time_machine_status: string;
  ccc_backup_status: string;
}

interface Report {
  id: string;
  report_type: string;
  filename: string;
  generated_at: string;
  notes: string;
}

interface Intervention {
  intervention_type: string;
  description: string;
  detected_at: string;
  financial_value_rand: number;
  manual_hours_saved: number;
}

interface ROI {
  total_exposure: number;
  total_value: number;
  total_actions: number;
  periods: number;
}

interface PortalData {
  client: {
    first_name: string;
    last_name: string;
    business_name: string;
    status: string;
  };
  devices: Device[];
  reports: Report[];
  interventions: Intervention[];
  roi: ROI;
}

const RISK_COLOUR: Record<string, string> = {
  critical: "text-red-400 bg-red-900/20 border-red-500/40",
  high: "text-orange-400 bg-orange-900/20 border-orange-500/40",
  moderate: "text-yellow-400 bg-yellow-900/20 border-yellow-500/40",
  low: "text-green-400 bg-green-900/20 border-green-500/40",
};

function riskColour(level: string) {
  return RISK_COLOUR[level?.toLowerCase()] ?? "text-gray-400 bg-gray-800 border-gray-600";
}

function fmt(n: number | null | undefined, prefix = "R ") {
  if (!n) return "—";
  return `${prefix}${Number(n).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PortalDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "devices" | "reports" | "activity">("overview");

  const load = useCallback(async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) { router.push("/portal/login"); return; }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/portal/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) { router.push("/portal/login"); return; }
    if (!res.ok) { setError("Failed to load data."); setLoading(false); return; }

    setData(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function signOut() {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_client_id");
    router.push("/portal/login");
  }

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-[#0FEA7A] text-lg">Loading your Health Check data…</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-red-400">{error}</div>
    </div>
  );

  if (!data) return null;

  const { client, devices, reports, interventions, roi } = data;
  const name = client.first_name || client.business_name || "Client";

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <header className="bg-[#16213e] border-b border-[#27504D]/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-[#27504D] text-[#0FEA7A] font-bold px-3 py-1 rounded text-sm">ZA SUPPORT</span>
          <span className="text-gray-300 text-sm">Health Check Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Hi, {name}</span>
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-[#16213e] border-b border-[#27504D]/20 px-6 flex gap-6">
        {(["overview", "devices", "reports", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-[#0FEA7A] text-[#0FEA7A]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* ROI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Exposure Identified" value={fmt(roi?.total_exposure)} colour="text-orange-400" />
              <StatCard label="Value Delivered" value={fmt(roi?.total_value)} colour="text-[#0FEA7A]" />
              <StatCard label="Automated Actions" value={String(roi?.total_actions ?? 0)} colour="text-blue-400" />
              <StatCard label="Devices Monitored" value={String(devices.length)} colour="text-purple-400" />
            </div>

            {/* Device quick-status */}
            {devices.length > 0 && (
              <Section title="Your Devices">
                <div className="space-y-3">
                  {devices.map((d) => (
                    <div key={d.serial} className="flex items-center justify-between bg-[#0f0f23] rounded-lg px-4 py-3 border border-[#27504D]/20">
                      <div>
                        <p className="font-medium text-sm">{d.model || d.serial}</p>
                        <p className="text-gray-500 text-xs mt-0.5">macOS {d.macos_version} · Last seen {fmtDate(d.last_seen)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded border capitalize ${riskColour(d.risk_level)}`}>
                        {d.risk_level || "unknown"}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Latest report */}
            {reports.length > 0 && (
              <Section title="Latest Report">
                <div className="bg-[#0f0f23] rounded-lg px-4 py-3 border border-[#27504D]/20">
                  <p className="text-sm font-medium">{reports[0].filename}</p>
                  <p className="text-gray-400 text-xs mt-1">Generated {fmtDate(reports[0].generated_at)}</p>
                  {reports[0].notes && <p className="text-gray-500 text-xs mt-2">{reports[0].notes}</p>}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* ── DEVICES TAB ── */}
        {tab === "devices" && (
          <div className="space-y-4">
            {devices.length === 0 && <EmptyState text="No devices registered yet." />}
            {devices.map((d) => (
              <div key={d.serial} className="bg-[#16213e] rounded-xl border border-[#27504D]/30 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{d.model || "Unknown Model"}</h3>
                    <p className="text-gray-400 text-sm">{d.hostname} · {d.serial}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${riskColour(d.risk_level)}`}>
                    {d.risk_level ?? "—"}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DeviceStat label="Risk Score" value={d.risk_score != null ? `${d.risk_score}/100` : "—"} />
                  <DeviceStat label="Battery Health" value={d.battery_health_pct != null ? `${d.battery_health_pct}%` : "—"} />
                  <DeviceStat label="Free Storage" value={d.storage_free_gb != null ? `${d.storage_free_gb} GB` : "—"} />
                  <DeviceStat label="macOS" value={d.macos_version || "—"} />
                  <DeviceStat label="Time Machine" value={d.time_machine_status || "—"} />
                  <DeviceStat label="CCC Backup" value={d.ccc_backup_status || "—"} />
                  <DeviceStat label="Chip" value={d.chip_type || "—"} />
                  <DeviceStat label="Last Seen" value={fmtDate(d.last_seen)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === "reports" && (
          <div className="space-y-3">
            {reports.length === 0 && <EmptyState text="No reports generated yet." />}
            {reports.map((r) => (
              <div key={r.id} className="bg-[#16213e] rounded-xl border border-[#27504D]/30 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{r.filename}</p>
                  <p className="text-gray-500 text-xs mt-1 capitalize">{r.report_type.replace(/_/g, " ")} · {fmtDate(r.generated_at)}</p>
                  {r.notes && <p className="text-gray-600 text-xs mt-1">{r.notes}</p>}
                </div>
                <span className="text-[#0FEA7A] text-xs">PDF</span>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab === "activity" && (
          <div className="space-y-3">
            {interventions.length === 0 && <EmptyState text="No automated actions in the last 90 days." />}
            {interventions.map((i, idx) => (
              <div key={idx} className="bg-[#16213e] rounded-xl border border-[#27504D]/30 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i.description}</p>
                    <p className="text-gray-500 text-xs mt-1 capitalize">{i.intervention_type.replace(/_/g, " ")} · {fmtDate(i.detected_at)}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    {i.financial_value_rand > 0 && (
                      <p className="text-[#0FEA7A] text-sm font-semibold">{fmt(i.financial_value_rand)}</p>
                    )}
                    {i.manual_hours_saved > 0 && (
                      <p className="text-gray-400 text-xs">{i.manual_hours_saved}h saved</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

function StatCard({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="bg-[#16213e] rounded-xl border border-[#27504D]/30 p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${colour}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function DeviceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1a1a2e] rounded-lg px-3 py-2.5">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16 text-gray-500 text-sm">{text}</div>
  );
}
