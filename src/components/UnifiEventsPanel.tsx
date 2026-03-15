"use client";

import { useEffect, useState } from "react";

interface UnifiEvent {
  id: number;
  event_type: string;
  category: string;
  description: string;
  severity: string;
  risk_score: number;
  src_ip?: string;
  src_mac?: string;
  src_hostname?: string;
  dst_ip?: string;
  service?: string;
  direction?: string;
  signature?: string;
  policy?: string;
  action?: string;
  event_ts: string;
}

interface EventsSummary {
  critical_count: number;
  high_count: number;
  medium_count: number;
  threat_count: number;
  outage_count: number;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-900/50 border-red-500 text-red-100",
  high: "bg-orange-900/40 border-orange-500 text-orange-100",
  medium: "bg-yellow-900/30 border-yellow-600 text-yellow-100",
  low: "bg-green-900/20 border-green-700 text-green-200",
  info: "bg-gray-800/40 border-gray-600 text-gray-300",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-600 text-white",
  medium: "bg-yellow-600 text-black",
  low: "bg-green-700 text-white",
  info: "bg-gray-600 text-white",
};

function formatEventTs(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Johannesburg" });
}

function EventTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    threat_detected: "🔴 Threat",
    internet_down: "⛔ Internet Down",
    internet_restored: "✅ Restored",
    packet_loss: "⚠️ Packet Loss",
    high_latency: "⏱ High Latency",
    multiple_devices_offline: "📴 Devices Offline",
    devices_reconnected: "🔄 Reconnected",
    network_updated: "🔄 Network Update",
    temporary_disconnect: "⚡ Temp Disconnect",
  };
  return <span>{labels[type] || type.replace(/_/g, " ")}</span>;
}

export function UnifiEventsPanel({ clientId, apiBase }: { clientId: string; apiBase: string }) {
  const [events, setEvents] = useState<UnifiEvent[]>([]);
  const [summary, setSummary] = useState<EventsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch(`${apiBase}/api/v1/unifi/${clientId}/events?limit=100`, {
      headers: { "X-API-Key": process.env.NEXT_PUBLIC_ZA_API_TOKEN || "" },
    })
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setSummary(d.summary || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId, apiBase]);

  const filtered = filter === "all" ? events : events.filter((e) => e.severity === filter);

  if (loading) return <div className="text-gray-400 text-sm p-4">Loading events...</div>;
  if (!events.length) return <div className="text-gray-400 text-sm p-4">No events recorded.</div>;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      {summary && (
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Critical", val: summary.critical_count, color: "bg-red-700" },
            { label: "High", val: summary.high_count, color: "bg-orange-600" },
            { label: "Medium", val: summary.medium_count, color: "bg-yellow-600" },
            { label: "Threats", val: summary.threat_count, color: "bg-red-900 border border-red-500" },
            { label: "Outages", val: summary.outage_count, color: "bg-orange-900 border border-orange-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
              <div className="text-2xl font-bold text-white">{val}</div>
              <div className="text-xs text-white/80 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {["all", "critical", "high", "medium", "low"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-white text-black" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map((ev) => (
          <div
            key={ev.id}
            className={`rounded-lg border p-3 text-sm ${SEVERITY_STYLES[ev.severity] || SEVERITY_STYLES.info}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {ev.severity === "critical" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                )}
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${SEVERITY_BADGE[ev.severity] || ""}`}>
                  {ev.severity}
                </span>
                <span className="font-medium">
                  <EventTypeLabel type={ev.event_type} />
                </span>
                <span className="text-xs opacity-60">{ev.category}</span>
              </div>
              <span className="text-xs opacity-60 whitespace-nowrap">{formatEventTs(ev.event_ts)}</span>
            </div>

            <p className="mt-1 text-xs opacity-80">{ev.description}</p>

            {/* Security threat details */}
            {ev.event_type === "threat_detected" && (
              <div className="mt-2 rounded bg-red-950/50 p-2 text-xs space-y-1">
                <div className="font-bold text-red-300">⚠️ Security Threat Detail</div>
                {ev.src_hostname && <div>Device: <span className="font-mono text-red-200">{ev.src_hostname}</span></div>}
                {ev.src_ip && <div>Source IP: <span className="font-mono">{ev.src_ip}</span> ({ev.src_mac})</div>}
                {ev.dst_ip && <div>Destination: <span className="font-mono">{ev.dst_ip}</span></div>}
                {ev.signature && <div>Signature: <span className="font-mono text-orange-300">{ev.signature}</span></div>}
                {ev.policy && <div>Policy: {ev.policy} | Type: {ev.policy}</div>}
                {ev.action && <div>Action: <span className={ev.action === "block" ? "text-green-400" : "text-orange-400"}>{ev.action.toUpperCase()}</span></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
