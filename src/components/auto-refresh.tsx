'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Drop this into any server-component page to make it auto-refresh.
 * It calls router.refresh() on the given interval, which re-fetches
 * all server component data without a full page reload.
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
