'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.ZA_API_URL || 'https://api.zasupport.com';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

interface ResearchItem {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  url: string | null;
  category: string;
  relevance: string;
  tags: string[];
  created_at: string;
}

interface Digest {
  id: string;
  week_of: string;
  summary_md: string;
  item_count: number;
  sent_at: string | null;
  created_at: string;
}

const RELEVANCE_COLOUR: Record<string, string> = {
  high: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  medium: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  low: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const SOURCE_LABEL: Record<string, string> = {
  hn: 'Hacker News',
  arxiv: 'ArXiv',
  github: 'GitHub',
};

const CATEGORY_LABEL: Record<string, string> = {
  voice_ai: 'Voice AI',
  autonomous_agents: 'Agents',
  ai_tools: 'AI Tools',
  investment: 'Investment',
  other: 'Other',
};

export default function ResearchPage() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [showDigest, setShowDigest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, digestRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/v1/research/items?per_page=100`, { headers }),
        fetch(`${API_URL}/api/v1/research/digests/latest`, { headers }),
      ]);

      if (itemsRes.status === 'fulfilled' && itemsRes.value.ok) {
        const data = await itemsRes.value.json();
        setItems(data.data || []);
      }
      if (digestRes.status === 'fulfilled' && digestRes.value.ok) {
        setDigest(await digestRes.value.json());
      }
    } catch {
      setError('Failed to load research data.');
    } finally {
      setLoading(false);
    }
  }

  async function triggerScrape() {
    setScraping(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/research/scrape`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sources: ['hn', 'arxiv', 'github'], limit_per_source: 20 }),
      });
      const data = await res.json();
      await loadData();
      alert(`Scrape complete — ${data.new_items} new items added.`);
    } catch {
      setError('Scrape failed.');
    } finally {
      setScraping(false);
    }
  }

  async function generateDigest() {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/research/digest/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ send_email: false, dry_run: false }),
      });
      const data = await res.json();
      await loadData();
      setShowDigest(true);
      if (data.status === 'no_items') alert('No new items to include in digest.');
    } catch {
      setError('Digest generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);
  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Research Intelligence</h1>
          <p className="text-slate-400 text-sm">
            Weekly tech digest · HN · ArXiv · GitHub · AI agents · Voice AI · Investment flows
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={triggerScrape}
            disabled={scraping}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition disabled:opacity-50"
          >
            {scraping ? 'Scraping...' : 'Scrape Now'}
          </button>
          <button
            onClick={generateDigest}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Digest'}
          </button>
          {digest && (
            <button
              onClick={() => setShowDigest(!showDigest)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg transition"
            >
              {showDigest ? 'Hide Digest' : 'View Digest'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Latest Digest */}
      {showDigest && digest && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Latest Digest — Week of {new Date(digest.week_of).toLocaleDateString('en-ZA')}
            </h2>
            <span className="text-slate-400 text-xs">{digest.item_count} items</span>
          </div>
          <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
            {digest.summary_md}
          </pre>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: items.length },
          { label: 'High Relevance', value: items.filter(i => i.relevance === 'high').length },
          { label: 'This Week', value: items.filter(i => new Date(i.created_at) > new Date(Date.now() - 7*86400000)).length },
          { label: 'AI Agents', value: items.filter(i => i.category === 'autonomous_agents').length },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABEL[cat] || cat}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="text-slate-400 text-sm">Loading research items...</div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-400 text-sm">
          No items yet. Click <strong>Scrape Now</strong> to collect the latest research.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-slate-500 text-xs uppercase tracking-wide">
                      {SOURCE_LABEL[item.source] || item.source}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${RELEVANCE_COLOUR[item.relevance] || RELEVANCE_COLOUR.medium}`}>
                      {item.relevance}
                    </span>
                    {item.category !== 'other' && (
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABEL[item.category] || item.category}
                      </span>
                    )}
                  </div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium hover:text-blue-300 transition line-clamp-2"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-white font-medium line-clamp-2">{item.title}</span>
                  )}
                  {item.summary && (
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.summary}</p>
                  )}
                </div>
                <div className="text-slate-500 text-xs whitespace-nowrap shrink-0">
                  {new Date(item.created_at).toLocaleDateString('en-ZA')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
