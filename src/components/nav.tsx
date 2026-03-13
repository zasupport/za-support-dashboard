'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor, Wifi, Shield, BarChart2, Activity, Bell, Lock, Search, Microscope, Users, Wrench, FileText, Coffee, ShieldCheck, Download, Settings, BookOpen, LogOut, TrendingUp, Stethoscope, Copy, FlaskConical, Cpu, Zap, Radar, Brain, ClipboardList, MessageCircle, KeyRound, Terminal, Inbox, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSearch } from './GlobalSearch';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: 'Dashboard', icon: Monitor },
  { href: '/morning', label: 'Morning Brief', icon: Coffee },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/interventions', label: 'Automations', icon: Zap },
  { href: '/whatsapp', label: 'WhatsApp Inbox', icon: MessageCircle },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/ai-profiling', label: 'AI Insights', icon: Brain },
  { href: '/workshop', label: 'Workshop', icon: Wrench },
  { href: '/job-cards', label: 'Job Cards', icon: FileText },
  { href: '/cybershield', label: 'CyberShield', icon: ShieldCheck },
  { href: '/upgrade-radar', label: 'Upgrade Radar', icon: Radar },
  { href: '/physical-assessment', label: 'Site Assessments', icon: ClipboardList },
  { href: '/remote-commands', label: 'Remote Commands', icon: Terminal },
  { href: '/unassigned-machines', label: 'Unassigned', icon: Inbox },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/isp', label: 'ISP Status', icon: Wifi },
  { href: '/unifi', label: 'Network Monitor', icon: Network },
  { href: '/shield', label: 'Shield Events', icon: Shield },
  { href: '/intelligence', label: 'App Intelligence', icon: BarChart2 },
  { href: '/analytics', label: 'Interaction Analytics', icon: Activity },
  { href: '/behavioural-analytics', label: 'Behavioural Analytics', icon: Cpu },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/vault', label: 'Vault', icon: Lock },
  { href: '/breach-scanner', label: 'Breach Scanner', icon: Search },
  { href: '/forensics', label: 'Forensics', icon: Microscope },
  { href: '/sales', label: 'Sales CRM', icon: TrendingUp },
  { href: '/medical', label: 'Medical', icon: Stethoscope },
  { href: '/dedup', label: 'Deduplication', icon: Copy },
  { href: '/guides', label: 'Guides', icon: BookOpen },
  { href: '/research', label: 'Research', icon: FlaskConical },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/installer', label: 'Scout Installer', icon: Download },
  { href: '/activation', label: 'Activation Codes', icon: KeyRound },
  { href: '/system', label: 'System Health', icon: Settings },
];

// Top links shown in mobile bottom nav
const mobileLinks = [
  { href: '/', label: 'Home', icon: Monitor },
  { href: '/morning', label: 'Brief', icon: Coffee },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/interventions', label: 'Actions', icon: Zap },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/workshop', label: 'Workshop', icon: Wrench },
];

export function Nav() {
  const pathname = usePathname();
  const [unassignedCount, setUnassignedCount]     = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    async function fetchUnassignedCount() {
      try {
        const res = await fetch('/api/commands/summary', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setUnassignedCount(data.unassigned_machines_count ?? 0);
      } catch {
        // non-fatal — badge just won't show
      }
    }
    fetchUnassignedCount();
    // Refresh count every 5 minutes
    const interval = setInterval(fetchUnassignedCount, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchNotificationCount() {
      try {
        const res = await fetch('/api/notifications/summary', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setNotificationCount(data.pending_count ?? 0);
      } catch {
        // non-fatal — badge just won't show
      }
    }
    fetchNotificationCount();
    // Refresh count every 60 seconds
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-screen bg-slate-900 text-slate-100 flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <span className="font-bold text-white tracking-wide text-sm block mb-3">ZA Support</span>
          <GlobalSearch />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const isUnassigned    = href === '/unassigned-machines';
            const isNotifications = href === '/notifications';
            const showUnassignedBadge    = isUnassigned    && unassignedCount > 0;
            const showNotificationBadge  = isNotifications && notificationCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === href
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {showUnassignedBadge && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unassignedCount}
                  </span>
                )}
                {showNotificationBadge && (
                  <span className="bg-yellow-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {notificationCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-slate-700">
          <button
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <span className="font-bold text-white text-sm shrink-0">ZA Support</span>
        <div className="flex-1 min-w-0">
          <GlobalSearch />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex">
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const isNotifications = href === '/notifications';
          const showBadge = isNotifications && notificationCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors relative',
                pathname === href ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <span className="relative">
                <Icon size={18} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 bg-yellow-500 text-slate-900 text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
