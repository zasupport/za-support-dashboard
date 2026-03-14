'use client';

import { useEffect, useState } from 'react';

type Proposal = {
  id: string;
  status: string;
  selected_tier?: string | null;
  expires_at?: string | null;
  proposal_url?: string | null;
};

export function ActiveProposalBanner({ clientId }: { clientId: string }) {
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    fetch(`/api/proposals?client_id=${encodeURIComponent(clientId)}`)
      .then(r => r.json())
      .then(data => {
        const active = (data.proposals ?? []).find(
          (p: Proposal) => p.status === 'viewed' || p.status === 'pending' || p.status === 'selected'
        );
        setProposal(active ?? null);
      })
      .catch(() => {});
  }, [clientId]);

  if (!proposal) return null;

  if (proposal.status === 'viewed') {
    const now = new Date();
    const daysLeft = proposal.expires_at
      ? Math.max(0, Math.ceil((new Date(proposal.expires_at).getTime() - now.getTime()) / 86400000))
      : null;
    return (
      <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">👀</span>
        <div>
          <strong>Proposal opened — this client is looking right now.</strong>
          {' '}Call them to close while it&apos;s top of mind.
          {daysLeft !== null && <span className="ml-2 text-amber-400/80">(Expires in {daysLeft}d)</span>}
          {proposal.proposal_url && (
            <a
              href={proposal.proposal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 underline text-amber-300 hover:text-amber-100"
            >
              View proposal →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (proposal.status === 'selected') {
    return (
      <div className="rounded-md border border-teal-500/50 bg-teal-500/10 px-4 py-3 text-teal-200 text-sm flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">✅</span>
        <div>
          <strong>Proposal accepted!</strong> Client selected <strong>{proposal.selected_tier}</strong>.
          {' '}Action: set up debit order and activate service.
        </div>
      </div>
    );
  }

  // pending — sent but not opened
  if (proposal.status === 'pending') {
    const now = new Date();
    const daysLeft = proposal.expires_at
      ? Math.max(0, Math.ceil((new Date(proposal.expires_at).getTime() - now.getTime()) / 86400000))
      : null;
    return (
      <div className="rounded-md border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-blue-300 text-sm flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">📤</span>
        <div>
          <strong>Proposal sent — not opened yet.</strong>
          {daysLeft !== null && <span className="ml-2 text-blue-400/70">{daysLeft}d remaining.</span>}
          {' '}Follow up if no response within 48 hours.
        </div>
      </div>
    );
  }

  return null;
}
