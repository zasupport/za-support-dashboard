'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, RefreshCw, Search, Phone, User, Clock, ChevronRight } from 'lucide-react';

type InboundMessage = {
  id: string;
  from_phone: string;
  client_id: string | null;
  client_name: string | null;
  message: string;
  command: string | null;
  reply_sent: string | null;
  forwarded_to_courtney: boolean;
  received_at: string | null;
};

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function WhatsAppInboxPage() {
  const [messages, setMessages] = useState<InboundMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InboundMessage | null>(null);
  const [limit, setLimit] = useState(100);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp?limit=${limit}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = messages.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.client_name?.toLowerCase().includes(q)) ||
      m.from_phone.includes(q) ||
      m.message.toLowerCase().includes(q) ||
      (m.command?.toLowerCase().includes(q))
    );
  });

  const unknownCount = messages.filter(m => !m.client_id).length;

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-green-400" />
          <div>
            <h1 className="text-white font-semibold text-base">WhatsApp Inbox</h1>
            <p className="text-slate-400 text-xs">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
              {unknownCount > 0 && (
                <span className="ml-2 text-amber-400">{unknownCount} unknown sender{unknownCount !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or message…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Message list */}
        <div className="w-full md:w-96 border-r border-slate-800 overflow-y-auto shrink-0">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-slate-500 text-sm">Loading messages…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <MessageCircle size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">{search ? 'No results' : 'No inbound messages yet'}</p>
              {!search && (
                <p className="text-slate-600 text-xs text-center max-w-xs">
                  Messages appear here when clients reply via WhatsApp. Activate WhatsApp Business to start receiving messages.
                </p>
              )}
            </div>
          ) : (
            filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => setSelected(msg)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800/60 transition-colors ${selected?.id === msg.id ? 'bg-slate-800' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    {msg.client_name ? (
                      <span className="text-xs font-semibold text-slate-300">
                        {msg.client_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </span>
                    ) : (
                      <User size={14} className="text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm font-medium truncate ${msg.client_name ? 'text-white' : 'text-amber-400'}`}>
                        {msg.client_name ?? msg.from_phone}
                      </span>
                      <span className="text-xs text-slate-500 shrink-0">{timeAgo(msg.received_at)}</span>
                    </div>

                    {msg.client_name && (
                      <p className="text-xs text-slate-500 mb-0.5 truncate">{msg.from_phone}</p>
                    )}

                    <p className="text-xs text-slate-400 truncate">{msg.message}</p>

                    <div className="flex items-center gap-2 mt-1">
                      {msg.command && (
                        <span className="text-xs bg-teal-900/60 text-teal-300 px-1.5 py-0.5 rounded">
                          {msg.command}
                        </span>
                      )}
                      {msg.reply_sent && (
                        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                          replied
                        </span>
                      )}
                      {msg.forwarded_to_courtney && (
                        <span className="text-xs bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded">
                          forwarded
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 mt-1.5 shrink-0" />
                </div>
              </button>
            ))
          )}

          {filtered.length >= 100 && (
            <div className="px-4 py-3 text-center">
              <button
                onClick={() => setLimit(l => l + 100)}
                className="text-xs text-teal-400 hover:text-teal-300"
              >
                Load more
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="hidden md:flex flex-1 flex-col overflow-y-auto">
          {selected ? (
            <div className="p-6 max-w-2xl">
              {/* Sender header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  {selected.client_name ? (
                    <span className="text-base font-semibold text-slate-300">
                      {selected.client_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </span>
                  ) : (
                    <User size={20} className="text-slate-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    {selected.client_name ?? 'Unknown sender'}
                  </h2>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Phone size={12} />
                    {selected.from_phone}
                  </div>
                  {selected.client_id && (
                    <a
                      href={`/clients/${selected.client_id}`}
                      className="text-xs text-teal-400 hover:text-teal-300 mt-0.5 block"
                    >
                      View client profile →
                    </a>
                  )}
                </div>
              </div>

              {/* Message bubble */}
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                  <Clock size={11} />
                  Received {formatDate(selected.received_at)}
                </p>
                <div className="bg-slate-800 rounded-xl rounded-tl-sm px-4 py-3 inline-block max-w-full">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2">
                {selected.command && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28">Command detected</span>
                    <span className="text-xs bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded font-mono">
                      {selected.command}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-28">Auto reply</span>
                  {selected.reply_sent ? (
                    <span className="text-xs text-green-400">Sent: "{selected.reply_sent.slice(0, 60)}{selected.reply_sent.length > 60 ? '…' : ''}"</span>
                  ) : (
                    <span className="text-xs text-slate-500">No auto reply</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-28">Forwarded</span>
                  <span className={`text-xs ${selected.forwarded_to_courtney ? 'text-amber-400' : 'text-slate-500'}`}>
                    {selected.forwarded_to_courtney ? 'Forwarded to Courtney' : 'Not forwarded'}
                  </span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide">Quick actions</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${selected.from_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-green-900/50 text-green-400 border border-green-800 hover:bg-green-900 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Open in WhatsApp
                  </a>
                  {selected.client_id && (
                    <a
                      href={`/clients/${selected.client_id}`}
                      className="text-xs bg-teal-900/50 text-teal-400 border border-teal-800 hover:bg-teal-900 px-3 py-1.5 rounded-md transition-colors"
                    >
                      View client
                    </a>
                  )}
                  {selected.client_id && (
                    <a
                      href={`/workshop?client=${selected.client_id}`}
                      className="text-xs bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors"
                    >
                      Create job
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
              <MessageCircle size={40} strokeWidth={1.5} />
              <p className="text-sm">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
